// utils/ZohoCliqClient.js - Jenkins-friendly version
import axios from 'axios';
import qs from 'qs';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

class ZohoCliqClient {
    constructor(options = {}) {
        this.options = {
            clientId: process.env.ZOHO_CLIENT_ID,
            clientSecret: process.env.ZOHO_CLIENT_SECRET,
            refreshToken: process.env.ZOHO_REFRESH_TOKEN,
            cliqBaseUrl: options.cliqBaseUrl || 'https://cliq.zoho.in/api/v2',
            tokenUrl: options.tokenUrl || 'https://accounts.zoho.in/oauth/v2/token',
            silent: options.silent === true,
            verbose: options.verbose === true
        };

        // Cache for access token
        this.accessToken = null;
        this.tokenExpiry = null;

        // Validate credentials on initialization
        this.validateCredentials();
    }

    /**
     * Log with timestamp for Jenkins
     */
    log(message, force = false) {
        if (!this.options.silent || force) {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${message}`);
        }
    }

    /**
     * Log errors (always shown)
     */
    logError(message, error = null) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ERROR: ${message}`);
        if (error && this.options.verbose) {
            console.error(error);
        }
    }

    /**
     * Validates credentials with detailed error reporting
     */
    validateCredentials() {
        const missing = [];
        const partial = [];

        // Check each credential
        if (!this.options.clientId) {
            missing.push('ZOHO_CLIENT_ID');
        } else if (this.options.clientId.length < 10) {
            partial.push('ZOHO_CLIENT_ID (too short)');
        }

        if (!this.options.clientSecret) {
            missing.push('ZOHO_CLIENT_SECRET');
        } else if (this.options.clientSecret.length < 10) {
            partial.push('ZOHO_CLIENT_SECRET (too short)');
        }

        if (!this.options.refreshToken) {
            missing.push('ZOHO_REFRESH_TOKEN');
        } else if (this.options.refreshToken.length < 10) {
            partial.push('ZOHO_REFRESH_TOKEN (too short)');
        }

        if (missing.length > 0) {
            this.logError(`Missing environment variables: ${missing.join(', ')}`);
            throw new Error('Missing required environment variables: ' + missing.join(', '));
        }

        if (partial.length > 0) {
            this.log(`WARNING: Suspicious environment variables: ${partial.join(', ')}`);
        }

        this.log('Credentials validation passed');
    }

    /**
     * Gets a fresh OAuth token with detailed error handling
     */
    async refreshAccessToken() {
        try {
            this.log('Requesting OAuth token refresh...');
            
            const tokenData = qs.stringify({
                "refresh_token": this.options.refreshToken,
                "grant_type": "refresh_token",
                "client_id": this.options.clientId,
                "client_secret": this.options.clientSecret
            });

            const response = await axios({
                method: 'post',
                url: this.options.tokenUrl,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: tokenData,
                timeout: 30000 // 30 second timeout
            });

            if (!response.data.access_token) {
                this.logError('Token refresh failed - no access token in response', response.data);
                throw new Error('No access token in response');
            }

            // Cache the token with expiry
            this.accessToken = response.data.access_token;
            const expiresIn = response.data.expires_in || 3600;
            this.tokenExpiry = Date.now() + (expiresIn * 1000) - (5 * 60 * 1000);

            this.log('OAuth token refreshed successfully');
            this.log(`Token expires in: ${Math.floor(expiresIn / 60)} minutes`);
            
            return this.accessToken;
        } catch (error) {
            if (error.response) {
                this.logError(`Token refresh failed: ${error.response.status} - ${error.response.statusText}`, error.response.data);
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                this.logError('Network error: Cannot connect to Zoho servers. Check internet connection and proxy settings.');
            } else {
                this.logError(`Token refresh failed: ${error.message}`);
            }
            throw new Error(`Token refresh failed: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Gets a valid access token (cached or fresh)
     */
    async getValidToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            this.log('Using cached token');
            return this.accessToken;
        }
        return await this.refreshAccessToken();
    }

    /**
     * Makes an authenticated request with detailed error handling
     */
    async makeAuthenticatedRequest(config) {
        try {
            const token = await this.getValidToken();
            config.headers = {
                ...config.headers,
                'Authorization': `Zoho-oauthtoken ${token}`
            };
            config.timeout = config.timeout || 30000; // 30 second timeout

            const response = await axios(config);
            return response;
        } catch (error) {
            // If unauthorized, try refreshing token once
            if (error.response?.status === 401 && !config._retried) {
                this.log('Token expired, refreshing...');
                this.accessToken = null;
                this.tokenExpiry = null;
                const newToken = await this.refreshAccessToken();
                
                config.headers['Authorization'] = `Zoho-oauthtoken ${newToken}`;
                config._retried = true;
                
                return await axios(config);
            }
            
            // Log detailed error information
            if (error.response) {
                this.logError(`API request failed: ${error.response.status} - ${error.response.statusText}`, error.response.data);
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                this.logError('Network error: Cannot connect to Cliq servers. Check internet connection and proxy settings.');
            } else {
                this.logError(`Request failed: ${error.message}`);
            }
            
            throw error;
        }
    }

    /**
     * Test API connection with detailed feedback
     */
    async testConnection() {
        try {
            this.log('Testing Cliq API connection...');
            
            const response = await this.makeAuthenticatedRequest({
                method: 'get',
                url: `${this.options.cliqBaseUrl}/channels`
            });

            const channelCount = response.data.channels?.length || 0;
            this.log(`Connection successful - found ${channelCount} channels`);
            return true;
        } catch (error) {
            this.logError('Connection test failed');
            return false;
        }
    }

    /**
     * Send a message to a Cliq channel
     */
    async sendMessage(channelName, messageContent) {
        try {
            this.log(`Sending message to channel: ${channelName}`);
            
            const messagePayload = typeof messageContent === 'string' 
                ? { text: messageContent }
                : messageContent;

            const response = await this.makeAuthenticatedRequest({
                method: 'post',
                url: `${this.options.cliqBaseUrl}/channelsbyname/${channelName}/message`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: messagePayload
            });

            this.log('Message sent successfully');
            return response.data;
        } catch (error) {
            this.logError('Failed to send message');
            throw error;
        }
    }

    /**
     * Upload a file to a Cliq channel
     */
    async uploadFile(channelName, filePath, options = {}) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const fileStats = fs.statSync(filePath);
            const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
            
            this.log(`Uploading file: ${path.basename(filePath)} (${fileSizeMB} MB) to channel: ${channelName}`);

            const data = new FormData();
            const fileName = options.filename || path.basename(filePath);
            data.append('file', fs.createReadStream(filePath), { filename: fileName });

            const response = await this.makeAuthenticatedRequest({
                method: 'post',
                url: `${this.options.cliqBaseUrl}/channelsbyname/${channelName}/files`,
                headers: data.getHeaders(),
                data: data,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 60000 // 60 second timeout for file uploads
            });

            this.log('File uploaded successfully');
            return response.data;
        } catch (error) {
            this.logError('Failed to upload file');
            throw error;
        }
    }

    /**
     * Send message and upload file in sequence
     */
    async sendMessageAndFile(channelName, messageContent, filePath, options = {}) {
        this.log('Starting message and file upload sequence...');
        await this.sendMessage(channelName, messageContent);
        await this.uploadFile(channelName, filePath, options);
        this.log('Message and file upload sequence completed');
        return true;
    }

    /**
     * Send notification with type formatting
     */
    async sendNotification(channelName, type, message) {
        const typeEmojis = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const emoji = typeEmojis[type] || '📢';
        const formattedMessage = `${emoji} ${message}`;
        return await this.sendMessage(channelName, formattedMessage);
    }

    /**
     * Upload multiple files
     */
    async uploadMultipleFiles(channelName, filePaths, message = null) {
        if (message) {
            await this.sendMessage(channelName, message);
        }
        
        this.log(`Starting upload of ${filePaths.length} files...`);
        for (let i = 0; i < filePaths.length; i++) {
            this.log(`Uploading file ${i + 1}/${filePaths.length}: ${path.basename(filePaths[i])}`);
            await this.uploadFile(channelName, filePaths[i]);
        }
        this.log('All files uploaded successfully');
        return true;
    }

    /**
     * Get list of channels
     */
    async getChannels() {
        const response = await this.makeAuthenticatedRequest({
            method: 'get',
            url: `${this.options.cliqBaseUrl}/channels`
        });
        return response.data.channels || [];
    }

    /**
     * Check if channel exists
     */
    async channelExists(channelName) {
        try {
            const channels = await this.getChannels();
            const exists = channels.some(channel => 
                channel.unique_name === channelName || 
                channel.name === channelName
            );
            this.log(`Channel '${channelName}' ${exists ? 'exists' : 'not found'}`);
            return exists;
        } catch (error) {
            this.logError(`Failed to check channel existence: ${error.message}`);
            return false;
        }
    }
}

export default ZohoCliqClient;