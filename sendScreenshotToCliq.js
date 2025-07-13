// sendScreenshotToCliq.js - Minimal version based on debug success
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import 'dotenv/config';

console.log('🚀 Starting screenshot upload...');

const channelName = process.env.ZOHO_CHANNEL_NAME || 'automationreports';
const filePath = process.env.SCREENSHOT_PATH || './summary/summary.png';

console.log(`Channel: ${channelName}`);
console.log(`File: ${filePath}`);

try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    console.log('✅ Screenshot file found');

    // Get token (same as debug script)
    console.log('Getting token...');
    const tokenResponse = await axios.post('https://accounts.zoho.in/oauth/v2/token', new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        grant_type: 'refresh_token',
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET
    }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenResponse.data.access_token;
    console.log(`✅ Token received: ${accessToken.substring(0, 20)}...`);

    // Send message
    console.log('Sending message...');
    await axios.post(`https://cliq.zoho.in/api/v2/channelsbyname/${channelName}/message`, {
        text: '🚀 Starting automated screenshot upload...'
    }, {
        headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    console.log('✅ Message sent');

    // Upload file
    console.log('Uploading file...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), { filename: 'allure-report-screenshot.png' });

    await axios.post(`https://cliq.zoho.in/api/v2/channelsbyname/${channelName}/files`, formData, {
        headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            ...formData.getHeaders()
        }
    });
    console.log('✅ File uploaded');

    // Send success message
    console.log('Sending success message...');
    await axios.post(`https://cliq.zoho.in/api/v2/channelsbyname/${channelName}/message`, {
        text: '📊 Allure Test Report Screenshot uploaded successfully!'
    }, {
        headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    
    console.log('🎉 SUCCESS: All steps completed!');
    process.exit(0);

} catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
        console.error('HTTP Status:', error.response.status);
        console.error('Response:', JSON.stringify(error.response.data));
    }
    process.exit(1);
}