// quick-test.js - Super simple test
import fs from 'fs';
import axios from 'axios';
import 'dotenv/config';

console.log('=== QUICK JENKINS TEST ===');

// Test 1: Environment Variables
console.log('\n1. Environment Variables:');
console.log('ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID ? 'SET ✅' : 'MISSING ❌');
console.log('ZOHO_CLIENT_SECRET:', process.env.ZOHO_CLIENT_SECRET ? 'SET ✅' : 'MISSING ❌');
console.log('ZOHO_REFRESH_TOKEN:', process.env.ZOHO_REFRESH_TOKEN ? 'SET ✅' : 'MISSING ❌');
console.log('ZOHO_CHANNEL_NAME:', process.env.ZOHO_CHANNEL_NAME || 'automationreports (default)');

// Test 2: File System
console.log('\n2. File System:');
const screenshotPath = process.env.SCREENSHOT_PATH || './summary/summary.png';
console.log('Screenshot path:', screenshotPath);
console.log('Screenshot exists:', fs.existsSync(screenshotPath) ? 'YES ✅' : 'NO ❌');

// Test 3: Basic Network Test
console.log('\n3. Network Test:');
try {
    const response = await axios.get('https://google.com', { timeout: 5000 });
    console.log('Internet connection:', response.status === 200 ? 'OK ✅' : 'FAILED ❌');
} catch (error) {
    console.log('Internet connection: FAILED ❌', error.message);
}

// Test 4: Zoho Token Test
console.log('\n4. Zoho Token Test:');
if (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET && process.env.ZOHO_REFRESH_TOKEN) {
    try {
        const tokenResponse = await axios.post('https://accounts.zoho.in/oauth/v2/token', new URLSearchParams({
            refresh_token: process.env.ZOHO_REFRESH_TOKEN,
            grant_type: 'refresh_token',
            client_id: process.env.ZOHO_CLIENT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000
        });
        
        if (tokenResponse.data.access_token) {
            console.log('Token request: SUCCESS ✅');
            console.log('Token preview:', tokenResponse.data.access_token.substring(0, 20) + '...');
            
            // Test 5: Cliq API Test
            console.log('\n5. Cliq API Test:');
            const cliqResponse = await axios.get('https://cliq.zoho.in/api/v2/channels', {
                headers: { 'Authorization': `Zoho-oauthtoken ${tokenResponse.data.access_token}` },
                timeout: 10000
            });
            
            console.log('Cliq API access: SUCCESS ✅');
            console.log('Channels found:', cliqResponse.data.channels?.length || 0);
            
            // Test 6: Send Test Message
            console.log('\n6. Test Message:');
            const channelName = process.env.ZOHO_CHANNEL_NAME || 'automationreports';
            const messageResponse = await axios.post(`https://cliq.zoho.in/api/v2/channelsbyname/${channelName}/message`, {
                text: `🔧 Quick test from Jenkins - ${new Date().toLocaleTimeString()}`
            }, {
                headers: { 
                    'Authorization': `Zoho-oauthtoken ${tokenResponse.data.access_token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            console.log('Test message sent: SUCCESS ✅');
            
        } else {
            console.log('Token request: FAILED ❌ - No access token');
        }
    } catch (error) {
        console.log('Token/API request: FAILED ❌');
        console.log('Error:', error.response?.data || error.message);
    }
} else {
    console.log('Skipping token test - missing environment variables');
}

console.log('\n=== TEST COMPLETE ===');