// db-test.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

// Initialize dotenv
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

class DatabaseFactory {
  constructor() {
    this.connections = {};
    this.validateEnvironment();
  }

  validateEnvironment() {
    // Check for required environment variables
    const required = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  buildConnectionString(dbName) {
    return `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}`;
  }

  getConnection(dbName) {
    if (!this.connections[dbName]) {
      const connectionString = this.buildConnectionString(dbName);
      this.connections[dbName] = new Pool({ connectionString });
    }
    return this.connections[dbName];
  }

  async testConnection(dbName) {
    console.log(`Testing connection to ${dbName}...`);
    try {
      const pool = this.getConnection(dbName);
      const client = await pool.connect();
      const result = await client.query('SELECT 1 AS result');
      client.release();
      
      console.log(`✅ Successfully connected to ${dbName} database`);
      return true;
    } catch (err) {
      console.error(`❌ Failed to connect to ${dbName} database:`, err.message);
      return false;
    }
  }
  
  async executeQuery(dbName, query, params = []) {
    try {
      const pool = this.getConnection(dbName);
      const result = await pool.query(query, params);
      return result.rows;
    } catch (err) {
      console.error(`Error executing query on ${dbName}:`, err.message);
      throw err;
    }
  }

  async closeAll() {
    const promises = [];
    for (const dbName in this.connections) {
      console.log(`Closing connection to ${dbName} database`);
      promises.push(this.connections[dbName].end());
    }
    await Promise.all(promises);
    console.log('All database connections closed');
  }
}

// Main function to test connections
async function testDatabaseConnections() {
  console.log('Starting database connection tests...');
  
  const dbFactory = new DatabaseFactory();
  
  try {
    // Test device management database connection
    const deviceDbConnected = await dbFactory.testConnection('devicemanagement');
    
    if (deviceDbConnected) {
      // Test query on device_registration table
      console.log("\n📊 Querying device_registration table:");
      const deviceCount = await dbFactory.executeQuery(
        'devicemanagement', 
        'SELECT COUNT(*) as count FROM public.device_registration'
      );
      console.log(`Total registered devices: ${deviceCount[0].count}`);
      
      // Get some sample devices
      console.log("\n📱 Sample devices from device_registration table:");
      const sampleDevices = await dbFactory.executeQuery(
        'devicemanagement',
        'SELECT device_id, device_name, unique_device_id FROM public.device_registration LIMIT 5'
      );
      
      console.table(sampleDevices);
      
      // Get specific device types
      console.log("\n📱 Samsung devices:");
      const samsungDevices = await dbFactory.executeQuery(
        'devicemanagement',
        "SELECT device_id, device_name, unique_device_id FROM public.device_registration WHERE device_name LIKE 'Samsung%'"
      );
      
      console.table(samsungDevices);
    }
    
    // Check if the database has iOS devices
    if (deviceDbConnected) {
      console.log("\n🍎 iOS devices:");
      const iosDevices = await dbFactory.executeQuery(
        'devicemanagement',
        "SELECT device_id, device_name, unique_device_id FROM public.device_registration WHERE device_name = 'iPad' OR device_name LIKE 'iPhone%'"
      );
      
      if (iosDevices.length > 0) {
        console.table(iosDevices);
      } else {
        console.log("No iOS devices found in the database");
      }
    }
    
    // Check if other tables exist
    if (deviceDbConnected) {
      try {
        console.log("\n🔍 Checking for other relevant tables in the schema:");
        const tables = await dbFactory.executeQuery(
          'devicemanagement',
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );
        
        console.log("Available tables in public schema:");
        console.table(tables);
      } catch (error) {
        console.error("Error querying schema information:", error.message);
      }
    }
    
  } catch (error) {
    console.error('Error during database testing:', error);
  } finally {
    await dbFactory.closeAll();
  }
}

// Run the tests
testDatabaseConnections();