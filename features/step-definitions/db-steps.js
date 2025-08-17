// step-definitions/db-steps.js
import { Then, When } from '@wdio/cucumber-framework';
import { expect } from 'chai';
import serviceFactory from '../../services/service-factory.js';
import testData from '../../test-data/testData.json';
import { red, green, yellow } from '../../utils/apiClient.js';


/**
 * Verify that a device ID exists in the database
 */
Then('verify verify device_id i.e {string} in database', async function(propertyName) {
    // Get the device ID value that was stored in previous step
    const deviceId = this[propertyName];
    
    // Make sure we have a value
    expect(deviceId, `No value found for ${propertyName}`).to.exist;
    console.log(`Verifying device_id ${deviceId} in database`);
    
    // Get database service
    const deviceService = serviceFactory.getDbService('devicemanagement', 'public.device_registration');
    
    // Query database
    try {
        const result = await deviceService.rawQuery(
            'SELECT * FROM public.device_registration WHERE device_id = ?',
            [deviceId]
        );
        
        // Check if any records were found
        const deviceExists = result.rows && result.rows.length > 0;
        expect(deviceExists, `Device with ID ${deviceId} not found in database`).to.be.true;
        
        // Store the device record for potential future use
        this.dbDevice = result.rows[0];
        
        // Log the found device details
        console.log(`✅ Device found in database: ${JSON.stringify(this.dbDevice)}`);
        
    } catch (error) {
        console.error(`❌ Database query error: ${error.message}`);
        throw error;
    }
});

/**
 * Alternative simplified step for device verification
 */
Then('verify the device ID from response exists in database', async function() {
    // Get the device ID from world object
    expect(this.device_id, 'No device_id found from previous steps').to.exist;
    console.log(`Verifying device_id ${this.device_id} in database`);
    
    // Get database service for device registration table
    const deviceService = serviceFactory.getDbService(process.env.device_management, 'public.device_registration');
    
    try {
        // Query for the device
        const result = await deviceService.rawQuery(
            'SELECT * FROM public.device_registration WHERE device_id = ?',
            [this.device_id]
        );
        
        // Verify device exists
        const deviceExists = result.rows && result.rows.length > 0;
        expect(deviceExists, `Device with ID ${this.device_id} not found in database`).to.be.true;
        
        // Store and log the device
        this.dbDevice = result.rows[0];
        console.log(`✅ Device verified in database: ${JSON.stringify(this.dbDevice)}`);
        
    } catch (error) {
        console.error(`❌ Database verification failed: ${error.message}`);
        throw error;
    }
});

Then('verify that all device input values are correctly stored in the database', async function() {
    // Get the response data using the fallback pattern
    const responseData = this.response.body || this.response.data.data || this.response;
    
    // Get the device_id from the response
    const deviceId = responseData.device_id;
    
    // Log what we found to help with debugging
    console.log("Using device_id:", deviceId);
    
    // Ensure we have a device_id
    expect(deviceId).to.not.be.undefined;
    
    // Get database service for device registration table
    const deviceService = serviceFactory.getDbService(process.env.device_management, 'public.device_registration');
    
    try {
        // Query for the device
        const result = await deviceService.rawQuery(
            'SELECT * FROM public.device_registration WHERE device_id = ?',
            [deviceId]
        );
        
        // Verify device exists
        const deviceExists = result.rows && result.rows.length > 0;
        expect(deviceExists, `Device with ID ${deviceId} not found in database`).to.be.true;
        
        const deviceData = result.rows[0];
        console.log(`Device verified in database:`, JSON.stringify(deviceData));
        
        // Compare all relevant fields from request body with DB values
        expect(deviceData.mobile_number).to.equal(this.requestBody.mobile_number);
        expect(deviceData.otp_verified).to.equal(this.requestBody.otp_verified);
        expect(deviceData.app_version).to.equal(this.requestBody.app_version);
        
        // For comparing the device_configuration JSON object
        const dbConfig = typeof deviceData.device_configuration === 'string' 
            ? JSON.parse(deviceData.device_configuration) 
            : deviceData.device_configuration;
            
        // Use deep equality for object comparison
        expect(dbConfig).to.deep.equal(this.requestBody.device_configuration);
        
        console.log("✅ All device data verified in database");
    } catch (error) {
        console.error(`❌ Database verification failed: ${error.message}`);
        throw error;
    }
});



// Replace your database validation step with this corrected version

// Replace your database validation step with this corrected version

Then(/^verify the device is mapped to the school in the database(?: "([^"]+)")?$/, async function (presence) {
    const expectedPresence = presence || "true";
    const shouldExist = expectedPresence.toLowerCase() === "true";
    
    const deviceId = this.deviceId || this.regResponse?.data?.device_id;
    const organisationCode = testData["organisation_code"];
    
    if (!deviceId) {
        throw new Error("deviceId not found from previous steps");
    }
    
    console.log(`${yellow}🔍 Verifying device mapping in database`);
    console.log(`${yellow}📊 Device ID: ${deviceId}`);
    console.log(`${yellow}🏢 Organization Code: ${organisationCode}`);
    
    const deviceService = serviceFactory.getDbService('devicemanagement', 'public.device_organisation_mapping');
    
    // Use the exact query from your original spec
    const query = `SELECT * FROM public.device_organisation_mapping 
                   WHERE device_id = ? AND organisation_code = ? AND active = 'true' 
                   ORDER BY id ASC`;
    
    const result = await deviceService.rawQuery(query, [deviceId, organisationCode]);
    const mappingExists = result.rows && result.rows.length > 0;
    
    console.log(`${yellow}📋 Query result: ${result.rows?.length || 0} rows found`);
    
    if (shouldExist) {
        expect(mappingExists, `Device ${deviceId} not mapped to organization ${organisationCode} in database`).to.be.true;
        console.log(`${green}✅ Device mapping verified in database`);
        if (result.rows.length > 0) {
            console.log(`${green}📄 Mapping data:`, JSON.stringify(result.rows[0]));
        }
    } else {
        expect(mappingExists, `Device ${deviceId} should NOT be mapped to organization ${organisationCode}`).to.be.false;
        console.log(`${green}✅ Confirmed device is not mapped in database`);
    }
});
// ✅ Delete test devices by mobile number
When('I delete test devices with mobile number {string}', async function (mobileNumber) {
    const deviceService = serviceFactory.getDbService('devicemanagement', 'public.device_registration');
    
    try {
        await deviceService.rawQuery('DELETE FROM public.device_registration WHERE mobile_number = ?', [mobileNumber]);
        console.log(`🗑️ Deleted test devices with mobile number: ${mobileNumber}`);
    } catch (error) {
        console.error(`❌ Cleanup failed: ${error.message}`);
        throw error;
    }
});