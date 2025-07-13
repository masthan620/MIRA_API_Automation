// debug-cliq-jenkins.js - Simple working version
import fs from 'fs';
import axios from 'axios';
import 'dotenv/config';

function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

function error(message) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`);
}

// Test 1: Environment Variables
function testEnvironmentVariables() {
    log('=== Testing Environment Variables ===');
    
    const required = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN'];
    const missing = [];
    
    required.forEach(envVar => {
        if (process.env[envVar]) {
            log(`✅ ${envVar}: ${process.env[envVar].substring(0, 10)}...`);
        } else {
            missing.push(envVar);
            error(`❌ ${envVar}: MISSING`);
        }
    });
    
    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    
    log('✅ All environment variables present');
    return true;
}

// Test 2: File System
function testFileSystem() {
    log('=== Testing File System ===');
    
    const screenshotPath = process.env.SCREENSHOT_PATH || './summary/summary.png';
    const workingDir = process.cwd();
    
    log(`Working directory: ${workingDir}`);
    log(`Screenshot path: ${screenshotPath}`);
    
    if (!fs.existsSync(screenshotPath)) {
        error(`❌ Screenshot file not found: ${screenshotPath}`);
        throw new Error(`Screenshot file not found: ${screenshotPath}`);
    }
    
    const stats = fs.statSync(screenshotPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    log(`✅ Screenshot file exists: ${fileSizeMB} MB`);
    log(`✅ File modified: ${stats.mtime}`);
    
    return true;
}

// Test 3: Network Connectivity
async function testNetworkConnectivity() {
    log('=== Testing Network Connectivity ===');
    
    const testUrls = [
        'https://google.com',
        'https://accounts.zoho.in',
        'https://cliq.zoho.in'
    ];
    
    for (const url of testUrls) {
        try {
            log(`Testing: ${url}`);
            const response = await axios.get(url, { timeout: 10000 });
            log(`✅ ${url}: ${response.status} OK`);
        } catch (err) {
            error(`❌ ${url}: ${err.message}`);
            throw new Error(`Network test failed for ${url}: ${err.message}`);
        }
    }
    
    log('✅ All network tests passed');
    return true;
}

// Test 4: Zoho Token
async function testZohoToken() {
    log('=== Testing Zoho Token ===');
    
    const tokenUrl = 'https://accounts.zoho.in/oauth/v2/token';
    
    const tokenData = new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        grant_type: 'refresh_token',
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET
    });
    
    try {
        log('Requesting OAuth token...');
        const response = await axios.post(tokenUrl, tokenData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 30000
        });
        
        if (response.data.access_token) {
            log(`✅ Token received: ${response.data.access_token.substring(0, 20)}...`);
            log(`✅ Token expires in: ${response.data.expires_in} seconds`);
            return response.data.access_token;
        } else {
            error('❌ No access token in response');
            throw new Error('No access token in response');
        }
    } catch (err) {
        if (err.response) {
            error(`❌ Token request failed: ${err.response.status} - ${err.response.statusText}`);
            error(`❌ Response data: ${JSON.stringify(err.response.data)}`);
        } else {
            error(`❌ Token request failed: ${err.message}`);
        }
        throw err;
    }
}

// Test 5: Cliq API
async function testCliqAPI(accessToken) {
    log('=== Testing Cliq API ===');
    
    const cliqUrl = 'https://cliq.zoho.in/api/v2/channels';
    
    try {
        log('Testing Cliq API access...');
        const response = await axios.get(cliqUrl, {
            headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
            timeout: 30000
        });
        
        const channelCount = response.data.channels?.length || 0;
        log(`✅ Cliq API accessible: ${channelCount} channels found`);
        
        // Show first few channels
        if (response.data.channels && response.data.channels.length > 0) {
            const channelNames = response.data.channels.slice(0, 5).map(c => c.unique_name || c.name);
            log(`✅ Sample channels: ${channelNames.join(', ')}`);
        }
        
        return true;
    } catch (err) {
        if (err.response) {
            error(`❌ Cliq API failed: ${err.response.status} - ${err.response.statusText}`);
            error(`❌ Response data: ${JSON.stringify(err.response.data)}`);
        } else {
            error(`❌ Cliq API failed: ${err.message}`);
        }
        throw err;
    }
}

// Test 6: Send Test Message
async function testSendMessage(accessToken) {
    log('=== Testing Message Send ===');
    
    const channelName = process.env.ZOHO_CHANNEL_NAME || 'automationreports';
    const messageUrl = `https://cliq.zoho.in/api/v2/channelsbyname/${channelName}/message`;
    
    const messageData = {
        text: `🔧 Debug test message from Jenkins - ${new Date().toISOString()}`
    };
    
    try {
        log(`Sending test message to channel: ${channelName}`);
        const response = await axios.post(messageUrl, messageData, {
            headers: { 
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        log('✅ Test message sent successfully');
        return true;
    } catch (err) {
        if (err.response) {
            error(`❌ Message send failed: ${err.response.status} - ${err.response.statusText}`);
            error(`❌ Response data: ${JSON.stringify(err.response.data)}`);
        } else {
            error(`❌ Message send failed: ${err.message}`);
        }
        throw err;
    }
}

// Main function
async function main() {
    log('🔍 Starting Jenkins Cliq Debug Tests...');
    
    try {
        // Run all tests in sequence
        testEnvironmentVariables();
        testFileSystem();
        await testNetworkConnectivity();
        const accessToken = await testZohoToken();
        await testCliqAPI(accessToken);
        await testSendMessage(accessToken);
        
        log('\n🎉 ALL TESTS PASSED! Cliq integration is working correctly.');
        process.exit(0);
        
    } catch (err) {
        error(`\n💥 DEBUG FAILED: ${err.message}`);
        process.exit(1);
    }
}

// Run the main function
main().catch(err => {
    error(`Unexpected error: ${err.message}`);
    process.exit(1);
});