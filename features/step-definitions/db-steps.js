// step-definitions/db-steps.js
import { Then, When } from '@wdio/cucumber-framework';
import { expect } from 'chai';
import serviceFactory from '../../services/service-factory.js';



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

Then(/^verify the device is mapped to the school in the database(?: "([^"]+)")?$/, async function (presence) {
    const expectedPresence = presence || "true"; // fallback to true

    const responseData = this.regResponse?.body || this.regResponse?.data?.data || this.response?.data || this.response;
    const deviceId = responseData.device_id || this.deviceId;
    const schoolCode = testData["school_code"];

    expect(deviceId, 'No device_id found in world').to.exist;

    const deviceService = serviceFactory.getDbService('devicemanagement', 'public.device_school_mapping');
    const query = 'SELECT * FROM public.device_school_mapping WHERE device_id = ? AND school_code = ?';
    const params = [deviceId, schoolCode];
    const shouldExist = expectedPresence.toLowerCase() === "true";

    const result = await deviceService.rawQuery(query, params);
    const mappingExists = result.rows && result.rows.length > 0;

    if (shouldExist) {
        expect(mappingExists, `Device ${deviceId} not mapped to school ${schoolCode}`).to.be.true;
    } else {
        expect(mappingExists, `Device ${deviceId} should NOT be mapped to school ${schoolCode}`).to.be.false;
    }
});

Then('verify the device is unmapped from the school in the database', async function () {
    const schoolCode = testData["school_code"];
    const deviceId = this.regResponse?.body?.device_id ?? this.regResponse?.data?.data?.device_id ?? this.regResponse?.device_id;
    const query = `SELECT * FROM device_school_mapping WHERE device_id = ? AND school_code = ? ORDER BY updated_at DESC LIMIT 1`;;
    const dbRecord = await serviceFactory.getDbService('devicemanagement', 'public.device_school_mapping').rawQuery(query, [deviceId, schoolCode]);
    const activeField = dbRecord.fields.find(f => f.name === 'active');
    expect(activeField, 'Active field not found in result.fields').to.not.be.undefined;
    expect(activeField.dataTypeModifier, 'Expected dataTypeModifier to be -1 for "active" column').to.equal(-1);
});


// ✅ Delete test devices by mobile number
When('I delete test devices with mobile number {string}', async function (mobileNumber) {
    const deviceService = serviceFactory.getDbService('devicemanagement', 'public.device_registration');
    
    try {
        // Count records to be deleted
        const countQuery = 'SELECT COUNT(*) as count FROM public.device_registration WHERE mobile_number = ?';
        const countResult = await deviceService.rawQuery(countQuery, [mobileNumber]);
        const recordCount = countResult.rows[0].count;
        
        console.log(`📊 Found ${recordCount} device(s) with mobile number: ${mobileNumber}`);
        
        // Delete the records
        const deleteQuery = 'DELETE FROM public.device_registration WHERE mobile_number = ?';
        const result = await deviceService.rawQuery(deleteQuery, [mobileNumber]);
        
        this.deletedRecordCount = recordCount;
        this.deleteResult = result;
        
        console.log(`🗑️ Successfully deleted ${recordCount} device record(s)`);
        
    } catch (error) {
        console.error(`❌ Database cleanup failed: ${error.message}`);
        throw error;
    }
});

Then('the test data should be successfully deleted from database', function () {
    expect(this.deleteResult).to.exist;
    console.log(`✅ Confirmed: ${this.deletedRecordCount} record(s) deleted successfully`);
});

Then('verify no devices exist with mobile number {string}', async function (mobileNumber) {
    const deviceService = serviceFactory.getDbService('devicemanagement', 'public.device_registration');
    
    const query = 'SELECT COUNT(*) as count FROM public.device_registration WHERE mobile_number = ?';
    const result = await deviceService.rawQuery(query, [mobileNumber]);
    const remainingCount = parseInt(result.rows[0].count);
    
    expect(remainingCount).to.equal(0);
    console.log(`✅ Verified: No devices exist with mobile number ${mobileNumber}`);
});