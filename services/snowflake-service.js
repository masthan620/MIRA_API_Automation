import snowflake from 'snowflake-sdk';

class SnowflakeService {
  constructor() {
    this.connection = null;
    const cleanPassword = process.env.SNOWFLAKE_PASSWORD?.replace(/^"(.*)"$/, '$1');
    this.config = {
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USERNAME,
      password: cleanPassword,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      role: process.env.SNOWFLAKE_ROLE
    };
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.connection = snowflake.createConnection(this.config);
      
      this.connection.connect((err, conn) => {
        if (err) {
          console.error('Snowflake connection failed:', err.message);
          reject(err);
        } else {
          console.log('Successfully connected to Snowflake');
          resolve(conn);
        }
      });
    });
  }

  async executeQuery(sqlQuery, binds = []) {
    if (!this.connection) {
      throw new Error('Database connection not established. Call connect() first.');
    }

    return new Promise((resolve, reject) => {
      this.connection.execute({
        sqlText: sqlQuery,
        binds: binds,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Query execution failed:', err.message);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      });
    });
  }

  async getTableData(tableName, columns = '*', whereClause = '', limit = null) {
    let query = `SELECT ${columns} FROM ${tableName}`;
    
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    return await this.executeQuery(query);
  }

  async getRowCount(tableName, whereClause = '') {
    const query = whereClause 
      ? `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`
      : `SELECT COUNT(*) as count FROM ${tableName}`;
    
    const result = await this.executeQuery(query);
    return result[0].COUNT;
  }

  async disconnect() {
    if (this.connection) {
      return new Promise((resolve, reject) => {
        this.connection.destroy((err, conn) => {
          if (err) {
            console.error('Disconnect failed:', err.message);
            reject(err);
          } else {
            console.log('Disconnected from Snowflake');
            this.connection = null;
            resolve();
          }
        });
      });
    }
  }
}

export default SnowflakeService;