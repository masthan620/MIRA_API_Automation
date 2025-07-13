// db-factory.js
import knex from 'knex';
import dotenv from 'dotenv';
import SnowflakeService from './snowflake-service.js';

dotenv.config();
// Database connection instances cache
const connections = {};

class DatabaseFactory {
    constructor() {
        // Validate required environment variables
        this._validateEnvironment();
        
        // Parse available databases from environment
        this.availableDatabases = (process.env.AVAILABLE_DATABASES || '')
            .split(',')
            .map(db => db.trim())
            .filter(db => db);
            
        if (this.availableDatabases.length === 0) {
            console.warn('No databases defined in AVAILABLE_DATABASES environment variable');
        }
    }
    static createSnowflakeConnection() {
        return new SnowflakeService();
    }
    
    
    /**
     * Validate required environment variables
     */
    _validateEnvironment() {
        const required = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
    
    /**
     * Build connection string for a specific database
     */
    _buildConnectionString(dbName) {
        return `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}`;
    }
    
    /**
     * Get or create a database connection
     * @param {string} dbName - Name of the database
     * @returns {object} - Knex instance
     */
    getConnection(dbName) {
        if (!dbName) {
            throw new Error('Database name is required');
        }
        
        // Check if this is a valid database from our list
        if (this.availableDatabases.length > 0 && !this.availableDatabases.includes(dbName)) {
            throw new Error(`Unknown database: ${dbName}. Available databases: ${this.availableDatabases.join(', ')}`);
        }
        
        // Return cached connection if exists
        if (connections[dbName]) {
            return connections[dbName];
        }
        
        // Create new connection
        const connectionString = this._buildConnectionString(dbName);
        connections[dbName] = knex({
            client: 'pg',
            connection: connectionString,
            pool: {
                min: 2,
                max: 10,
                idleTimeoutMillis: 30000
            }
        });
        
        return connections[dbName];
    }
    
    /**
     * Test a database connection
     * @param {string} dbName - Name of the database to test
     */
    async testConnection(dbName) {
        try {
            const conn = this.getConnection(dbName);
            await conn.raw('SELECT 1 AS result');
            console.log(`✅ Database connection to ${dbName} successful`);
            return true;
        } catch (err) {
            console.error(`❌ Database connection to ${dbName} failed:`, err.message);
            return false;
        }
    }
    
    /**
     * Get list of all available databases
     */
    getAvailableDatabases() {
        return [...this.availableDatabases];
    }
    
    /**
     * Close all database connections
     */
    async closeAll() {
        const promises = [];
        
        for (const dbName in connections) {
            console.log(`Closing connection to ${dbName} database`);
            promises.push(connections[dbName].destroy());
        }
        
        await Promise.all(promises);
    }
}

// Change this to an ES modules export
const dbFactory = new DatabaseFactory();
export default dbFactory;