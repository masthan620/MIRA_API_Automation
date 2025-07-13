// base-db-service.js
import dbFactory from './db-factory.js';

class BaseDbService {
    /**
     * @param {string} dbName - Database name to connect to
     * @param {string} tableName - Table name to operate on
     */
    constructor(dbName, tableName) {
        if (!dbName) {
            throw new Error('Database name is required');
        }
        if (!tableName) {
            throw new Error('Table name is required');
        }
        
        this.dbName = dbName;
        this.tableName = tableName;
        this.db = dbFactory.getConnection(dbName);
    }
    
    /**
     * Get query builder for the table
     */
    query() {
        return this.db(this.tableName);
    }
    
    /**
     * Get all records with optional conditions
     * @param {Object} conditions - WHERE conditions
     * @returns {Promise<Array>} - Query results
     */
    async getAll(conditions = {}) {
        return this.query().where(conditions);
    }
    
    /**
     * Get by ID
     * @param {string|number} id - ID to look up
     * @param {string} idField - Name of ID column (default: 'id')
     * @returns {Promise<Object>} - Single record or undefined
     */
    async getById(id, idField = 'id') {
        return this.query().where({ [idField]: id }).first();
    }
    
    /**
     * Insert record
     * @param {Object|Array} data - Data to insert
     * @returns {Promise<Array>} - Inserted records
     */
    async insert(data) {
        return this.query().insert(data).returning('*');
    }
    
    /**
     * Update record
     * @param {string|number} id - ID to update
     * @param {Object} data - Data to update
     * @param {string} idField - Name of ID column (default: 'id')
     * @returns {Promise<Array>} - Updated records
     */
    async update(id, data, idField = 'id') {
        return this.query().where({ [idField]: id }).update(data).returning('*');
    }
    
    /**
     * Delete record
     * @param {string|number} id - ID to delete
     * @param {string} idField - Name of ID column (default: 'id')
     * @returns {Promise<number>} - Count of deleted rows
     */
    async delete(id, idField = 'id') {
        return this.query().where({ [idField]: id }).del();
    }
    
    /**
     * Raw query execution
     * @param {string} query - Raw SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} - Query result
     */
    async rawQuery(query, params = []) {
        return this.db.raw(query, params);
    }
    
    /**
     * Count records with optional conditions
     * @param {Object} conditions - WHERE conditions
     * @returns {Promise<number>} - Count of matching records
     */
    async count(conditions = {}) {
        const result = await this.query()
            .where(conditions)
            .count('* as count')
            .first();
        return parseInt(result.count);
    }
    
    /**
     * Check if records exist with given conditions
     * @param {Object} conditions - WHERE conditions
     * @returns {Promise<boolean>} - True if records exist
     */
    async exists(conditions = {}) {
        const count = await this.count(conditions);
        return count > 0;
    }
    /**
     * Validate existence of record based on raw query and assert if not found
     * @param {string} query - Raw SQL query
     * @param {Array} params - Query parameters
     * @param {string} errorMessage - Custom error message if no record is found
     */
    async validateRecordExists(query, params = [], errorMessage = 'Record not found') {
        try {
            const result = await this.rawQuery(query, params);
            const recordExists = result.rows && result.rows.length > 0;
            return recordExists;
        } catch (err) {
            console.error(`❌ DB validation failed: ${err.message}`);
            return false;
        }
    }

    async  getDeviceMapping(deviceId, schoolCode) {
        const query = `
            SELECT * FROM device_school_mapping 
            WHERE device_id = $1 AND school_code = $2
            ORDER BY updated_at DESC LIMIT 1
        `;
        const result = await dbConnection.query(query, [deviceId, schoolCode]);
        return result.rows.length ? result.rows[0] : null;
    }
    async fetchRecords(query, params = []) {
        try {
            const result = await dbConnection.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        }
    }

    
    
    
}

export default BaseDbService;