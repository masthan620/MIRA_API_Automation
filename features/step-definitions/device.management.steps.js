import { Given, Then, When } from '@wdio/cucumber-framework';
import { expect } from '@wdio/globals';
import apiClient from '../../utils/apiClient.js';
import fs from 'fs';
import path from 'path';
import serviceFactory from  '../../services/service-factory';
import testData from '../../test-data/testData.json';
import { red, green, yellow, reset } from '../../utils/apiClient.js';


import { generateUniqueId1 } from "../../utils/generateRandomData.js";

// Function to load request body from JSON
const loadRequestBody = (key) => {
    const dataPath = path.resolve('./test-data/apiRequestBodies.json');
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const requestBodies = JSON.parse(raw);
    return requestBodies[key];
};

function applyOverrides(originalBody, overrides) {
  const resolvedOverrides = { ...originalBody };

  for (const key in overrides) {
    const value = testData[overrides[key]] !== undefined ? testData[overrides[key]] : overrides[key];

    const keys = key.split('.');
    let current = resolvedOverrides;

    for (let i = 0; i < keys.length; i++) {
      const part = keys[i];

      if (i === keys.length - 1) {
        // Final key: assign value
        current[part] = value;
      } else {
        // Intermediate key: ensure nested object exists
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }

  return resolvedOverrides;
}

// ✅ Register device WITHOUT overrides (NO table)
Given(/^register device$/, async function () {
    const endpoint = process.env.DEVICE_REGISTER_ENDPOINT;
    this.requestBody = loadRequestBody("saveDevice");
    this.requestBody.unique_device_id = generateUniqueId1();

    console.log("Final Request Body →", JSON.stringify(this.requestBody, null, 2));

    this.response = await apiClient.post(endpoint, this.requestBody);
    this.regResponse = this.response;
});

// ✅ Register device WITH overrides (WITH table)
Given(/^register device:$/, async function (table) {
    const endpoint = process.env.DEVICE_REGISTER_ENDPOINT;
  
    // Load default request body
    this.requestBody = loadRequestBody("saveDevice");
  
    // Read overrides from DataTable
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
  
    // Auto generate unique ID if not overridden
    if (!overrides.unique_device_id) {
      this.requestBody.unique_device_id = generateUniqueId1();
    }
  
    // Apply overrides from testData if key matches
    this.requestBody = applyOverrides(this.requestBody, overrides);
  
    console.log("Final Request Body →", JSON.stringify(this.requestBody, null, 2));
  
    // Execute API call
    this.response = await apiClient.post(endpoint, this.requestBody);
    this.regResponse = this.response;
});

// ✅ Map device to school - Condition-based (handles existing patterns)
Given(/^(?:I )?map the device to school(?: with (.+))?$/, async function (condition) {
    const endpointTemplate = process.env.MAP_DEVICE_ENDPOINT;
    let schoolCode = testData["school_code"]; // default school code
    let requestBodyKey = "mapDevice"; // default request body
    
    const responseData = this.regResponse?.body || this.regResponse?.data?.data || this.regResponse;
    let deviceId = responseData.device_id; // Get device_id from registration
  
    if (!deviceId) {
        throw new Error("deviceId not found from previous step.");
    }
    
    // Handle different conditions
    if (condition) {
        if (condition === "empty subscription_key") {
            requestBodyKey = "mapDeviceEmptyKey";
        } else if (condition === "empty schoolCode") {
            schoolCode = ""; // This creates double slash in URL
        } else if (condition.startsWith('schoolCode "')) {
            // Extract school code from: schoolCode "8435957"
            const match = condition.match(/schoolCode "([^"]*)"/);
            schoolCode = match ? match[1] : "";
        }
        // 🆕 DEVICE_ID VALIDATION CONDITIONS
        else if (condition === "empty device_id") {
            deviceId = ""; // Override device_id with empty string
        } else if (condition === "invalid device_id") {
            // Get invalid device_id from testData
            deviceId = testData["invalid_device_id_test"];
        } else if (condition.startsWith('invalid device_id "')) {
            // Extract device_id from: invalid device_id "12sde23"
            const match = condition.match(/invalid device_id "([^"]*)"/);
            deviceId = match ? match[1] : testData["invalid_device_id_test"];
        }
    }
  
    const endpoint = endpointTemplate
        .replace('{school_code}', schoolCode)
        .replace('{device_id}', deviceId);
  
    const requestBody = loadRequestBody(requestBodyKey);
  
    console.log(`${yellow}📦 Mapping Request Body${condition ? ` (${condition})` : ''}:`, JSON.stringify(requestBody, null, 2));
    console.log(`${yellow}🔗 Endpoint: ${endpoint}`);
    console.log(`${yellow}📱 Device ID: ${deviceId}`);
    console.log(`${yellow}🏫 School Code: ${schoolCode}`);
  
    const headers = {
        'auth': 'EISecret',
        'Authorization': `${process.env.ACCESS_TOKEN}`,
    };
  
    this.response = await apiClient.post(endpoint, requestBody, headers);
    this.mapResponse = this.response;
});

// ✅ Map device to school - DataTable-based (for scenario outline)
When(/^map the device to school:$/, async function (table) {
    const endpointTemplate = process.env.MAP_DEVICE_ENDPOINT;
    let requestBodyKey = "mapDevice"; // default request body
    
    const responseData = this.regResponse?.body || this.regResponse?.data?.data || this.regResponse;
    const deviceId = responseData.device_id;
  
    if (!deviceId) {
        throw new Error("deviceId not found from previous step.");
    }
    
    // Handle DataTable approach (for scenario outline style)
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
    const schoolCodeKey = overrides.school_code;
    
    // Get school code from testData if it's a key, otherwise use directly
    const schoolCode = testData[schoolCodeKey] !== undefined ? testData[schoolCodeKey] : schoolCodeKey;
    
    console.log(`${yellow}📦 Using DataTable approach with school_code key "${schoolCodeKey}":`, schoolCode);
  
    const endpoint = endpointTemplate
        .replace('{school_code}', schoolCode)
        .replace('{device_id}', deviceId);
  
    const requestBody = loadRequestBody(requestBodyKey);
  
    console.log(`${yellow}📦 Mapping Request Body (DataTable):`, JSON.stringify(requestBody, null, 2));
    console.log(`${yellow}🔗 Endpoint: ${endpoint}`);
  
    const headers = {
        'auth': 'EISecret',
        'Authorization': `${process.env.ACCESS_TOKEN}`,
    };
  
    this.response = await apiClient.post(endpoint, requestBody, headers);
    this.mapResponse = this.response;
});

When(/^unmap the device from the school$/, async function () {
    const deviceId = this.regResponse?.body?.device_id ?? 
                    this.regResponse?.data?.data?.device_id ?? 
                    this.regResponse?.device_id;
    
    if (!deviceId) {
        throw new Error("deviceId not found from registration response.");
    }
    
    const schoolCode = testData["school_code"];
    const endpoint = process.env.UNMAP_DEVICE_ENDPOINT
        .replace('{school_code}', schoolCode)
        .replace('{device_id}', deviceId);

    const headers = {
        'auth': 'EISecret',
        'Authorization': `${process.env.ACCESS_TOKEN_UNMAP}`,
        'User-Agent': 'Apidog/1.0.0 (https://apidog.com)',
    };
        
    this.response = await apiClient.delete(endpoint, headers);
    this.unmapResponse = this.response;
});
// ✅ FIXED Unmap step with proper URL encoding and error handling
When(/^unmap device from school with overrides:$/, async function (table) {
    const endpointTemplate = process.env.UNMAP_DEVICE_ENDPOINT;
    let deviceId, schoolCode;
    const responseData = this.regResponse?.body || this.regResponse?.data?.data || this.regResponse;
    deviceId = responseData.device_id;
    schoolCode = testData["school_code"];
    
    if (!deviceId) {
        throw new Error("deviceId not found from registration response.");
    }
    
    // Handle DataTable overrides
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
    
    // Override device_id if provided
    if (overrides.device_id) {
        const deviceIdKey = overrides.device_id;
        deviceId = testData[deviceIdKey] !== undefined ? testData[deviceIdKey] : deviceIdKey;
        console.log(`${yellow}🔄 Overriding device_id with: "${deviceId}"`);
    }
    
    // Override school_code if provided  
    if (overrides.school_code) {
        const schoolCodeKey = overrides.school_code;
        schoolCode = testData[schoolCodeKey] !== undefined ? testData[schoolCodeKey] : schoolCodeKey;
        console.log(`${yellow}🔄 Overriding school_code with: "${schoolCode}"`);
    }
    
    // ✅ URL encode the parameters to handle special characters and spaces
    const encodedSchoolCode = encodeURIComponent(schoolCode);
    const encodedDeviceId = encodeURIComponent(deviceId);
    
    const endpoint = endpointTemplate
        .replace('{school_code}', encodedSchoolCode)
        .replace('{device_id}', encodedDeviceId);
    
    console.log(`${yellow}🔗 Unmap Endpoint: ${endpoint}`);
    console.log(`${yellow}📱 Device ID: "${deviceId}" (encoded: "${encodedDeviceId}")`);
    console.log(`${yellow}🏫 School Code: "${schoolCode}" (encoded: "${encodedSchoolCode}")`);
    
    const headers = {
        'auth': 'EISecret',
        'Authorization': `${process.env.ACCESS_TOKEN_UNMAP}`,
        'User-Agent': 'Apidog/1.0.0 (https://apidog.com)',
    };
    
    // ✅ Handle both success and error responses properly
    try {
        this.response = await apiClient.delete(endpoint, headers);
        this.unmapResponse = this.response;
        console.log(`${green}✅ Unmap request completed with status: ${this.response.status}`);
    } catch (error) {
        // ✅ Capture error response instead of throwing
        if (error.response) {
            this.response = error.response;
            this.unmapResponse = error.response;
            console.log(`${yellow}⚠️ Unmap request failed with status: ${error.response.status}`);
            console.log(`${yellow}📝 Error response: ${JSON.stringify(error.response.data)}`);
        } else {
            // ✅ For network errors, create a standard error response
            this.response = {
                status: 500,
                data: {
                    status: false,
                    message: error.message || "Network error occurred",
                    code: "NETWORK_ERROR"
                }
            };
            this.unmapResponse = this.response;
            console.log(`${red}❌ Network error: ${error.message}`);
        }
    }
});

Then(/^map (\d+) students? to device and verify status code (\d+)$/, async function (studentCount, expectedStatusCode) {
    // ✅ Flexible deviceId extraction
    let deviceId = this.regResponse?.body?.device_id 
                || this.regResponse?.data?.data?.device_id 
                || this.regResponse?.device_id 
                || this.device_id;

    const schoolCode = testData["school_code"];

    if (!deviceId) {
        console.error("❌ Full regResponse:", JSON.stringify(this.regResponse, null, 2));
        throw new Error("deviceId not found from registration response.");
    }

    const endpoint = process.env.MAP_STUDENTS_TO_DEVICE_ENDPOINT
        .replace('{school_code}', schoolCode)
        .replace('{device_id}', deviceId);

    const requestBody = {
        ...loadRequestBody("mapStudentsToDevice"),
        user_ids: testData["student_user_ids"].slice(0, parseInt(studentCount))
    };

    const headers = {
        'auth': 'EISecret',
        'Content-Type': 'application/json',
        'Authorization': `${process.env.ACCESS_TOKEN_UNMAP}`,
    };

    console.log(`🎓 Mapping ${studentCount} students to device: ${deviceId}`);
    console.log(`📦 Request Body:`, JSON.stringify(requestBody, null, 2));
    console.log(`🔗 Endpoint: ${endpoint}`);

    const start = Date.now();
    this.response = await apiClient.post(endpoint, requestBody, headers);
    const end = Date.now();

    this.mappingResponse = this.response;
    this.responseTime = end - start;
    this.mappedUserIds = requestBody.user_ids;

    expect(this.response.status).toEqual(parseInt(expectedStatusCode));
    console.log(`✅ Mapping API returned status code: ${this.response.status} in ${this.responseTime}ms`);
});

// ✅ Step: Validate response body fields using a table
Then(/^the response body should contain:$/, function (table) {
    const responseData = this.response?.body || this.response?.data || this.response;
    const validations = table.hashes();

    validations.forEach(({ field, validation_type, expected_value }) => {
        const actualValue = responseData[field];

        switch (validation_type) {
            case 'equals':
                expect(actualValue).toEqual(expected_value);
                console.log(`✅ ${field} equals "${expected_value}"`);
                break;

            case 'type':
                if (expected_value === 'array') {
                    expect(Array.isArray(actualValue)).toBe(true);
                    console.log(`✅ ${field} is of type array`);
                } else {
                    expect(typeof actualValue).toBe(expected_value.toLowerCase());
                    console.log(`✅ ${field} is of type ${expected_value}`);
                }
                break;

            case 'exists':
                expect(actualValue).toBeDefined();
                expect(actualValue).not.toBe(null);
                console.log(`✅ ${field} exists in response`);
                break;

            default:
                throw new Error(`Unknown validation_type: ${validation_type}`);
        }
    });
});

  
// ✅ Get device details step (FIXED)
When(/^get device details for the mapped device$/, async function () {
    const endpointTemplate = process.env.GET_DEVICE_DETAILS_ENDPOINT;
    
    // Get device_id from registration response
    const responseData = this.regResponse?.body || this.regResponse?.data?.data || this.regResponse;
    const deviceId = responseData.device_id;
    
    // Get school code from test data
    const schoolCode = testData["school_code"];
    
    if (!deviceId) {
        throw new Error("deviceId not found from registration response.");
    }
    
    // Store device_id for later validation
    this.storedDeviceId = deviceId;
    
    // Store device_color from mapping response for validation (FIXED)
    if (this.mapResponse) {
        const mapResponseData = this.mapResponse.body || this.mapResponse.data || this.mapResponse;
        // Check if device_color is nested in data property
        if (mapResponseData.data && mapResponseData.data.device_color) {
            this.storedDeviceColor = mapResponseData.data.device_color;
        } else if (mapResponseData.device_color) {
            this.storedDeviceColor = mapResponseData.device_color;
        }
        console.log(`${yellow}🎨 Stored device color from mapping: ${this.storedDeviceColor}`);
    }
    
    const endpoint = endpointTemplate
        .replace('{school_code}', schoolCode)
        .replace('{device_id}', deviceId);
    
    console.log(`${yellow}📱 Getting device details for: ${deviceId}`);
    console.log(`${yellow}🏫 School Code: ${schoolCode}`);
    console.log(`${yellow}🔗 Endpoint: ${endpoint}`);
    
    const headers = {
        'Authorization': `${process.env.ACCESS_TOKEN}`,
    };
    
    // Capture start time
    const startTime = Date.now();
    this.response = await apiClient.get(endpoint, headers);
    const endTime = Date.now();
    this.responseTime = endTime - startTime;
    
    this.deviceDetailsResponse = this.response;
    console.log(`${green}✅ Device details retrieved in ${this.responseTime}ms`);
});

// ✅ Validation step for device details response (FULLY FIXED WITH WDIO EXPECT)
Then(/^the device details response should contain:$/, function (table) {
    const responseData = this.deviceDetailsResponse?.body || this.deviceDetailsResponse?.data || this.deviceDetailsResponse;
    const deviceData = responseData.data || responseData;
    
    const validations = table.hashes();
    
    validations.forEach(validation => {
        const { field, validation_type, expected_value } = validation;
        const actualValue = deviceData[field];
        
        console.log(`${yellow}🔍 Validating ${field}: ${actualValue}`);
        
        switch (validation_type) {
            case 'equals':
                let expectedVal;
                
                // Handle special stored values
                if (expected_value === 'stored_device') {
                    expectedVal = this.storedDeviceId;
                } else if (expected_value === 'stored_color') {
                    expectedVal = this.storedDeviceColor;
                } 
                // Check if it's a testData reference
                else if (testData.hasOwnProperty(expected_value)) {
                    expectedVal = testData[expected_value];
                    console.log(`${yellow}📊 Using testData value for ${expected_value}: ${expectedVal}`);
                }
                // Handle literal values
                else if (expected_value === 'true') {
                    expectedVal = true;
                } else if (expected_value === 'false') {
                    expectedVal = false;
                } else if (!isNaN(expected_value)) {
                    expectedVal = Number(expected_value);
                } else {
                    expectedVal = expected_value;
                }
                
                expect(actualValue).toEqual(expectedVal);
                console.log(`${green}✅ ${field} matches expected value: ${actualValue} === ${expectedVal}`);
                break;
                
            case 'type':
                if (expected_value === 'number') {
                    expect(typeof actualValue).toBe('number');
                    console.log(`${green}✅ ${field} is a number: ${actualValue}`);
                } else if (expected_value === 'string') {
                    expect(typeof actualValue).toBe('string');
                } else if (expected_value === 'boolean') {
                    expect(typeof actualValue).toBe('boolean');
                }
                break;
                
            case 'exists':
                expect(actualValue).toBeDefined();
                expect(actualValue).not.toBe(null);
                console.log(`${green}✅ ${field} exists: ${actualValue}`);
                break;
                
            default:
                throw new Error(`Unknown validation type: ${validation_type}`);
        }
    });
});
// ✅ Specific validation for device color matching (FIXED WITH WDIO EXPECT)
Then(/^verify device details match the mapped device color$/, async function () {
    const deviceDetailsData = this.deviceDetailsResponse?.body?.data || this.deviceDetailsResponse?.data?.data;
    const mappedColor = this.storedDeviceColor;
    
    expect(deviceDetailsData.device_color).toEqual(mappedColor);
    console.log(`${green}✅ Device color validation passed: ${deviceDetailsData.device_color} === ${mappedColor}`);
    
    // Optional: DB validation
    const deviceService = serviceFactory.getDbService('devicemanagement', 'public.device_school_mapping');
    const query = 'SELECT * FROM public.device_school_mapping WHERE device_id = ? AND active = true';
    
    try {
        const result = await deviceService.rawQuery(query, [this.storedDeviceId]);
        
        if (result.rows && result.rows.length > 0) {
            console.log(`${green}✅ Device mapping verified in database`);
            console.log(`${yellow}📊 DB Record:`, JSON.stringify(result.rows[0]));
        }
    } catch (error) {
        console.log(`${yellow}⚠️ DB validation skipped: ${error.message}`);
    }
});

// ✅ Parameterized get device details (for standalone scenario)
When(/^get device details for device "([^"]*)" and school "([^"]*)"$/, async function (deviceId, schoolCode) {
    const endpointTemplate = process.env.GET_DEVICE_DETAILS_ENDPOINT;
    const endpoint = endpointTemplate
        .replace('{school_code}', schoolCode)
        .replace('{device_id}', deviceId);
    
    const headers = {
        'Authorization': `${process.env.ACCESS_TOKEN}`,
    };
    
    const startTime = Date.now();
    this.response = await apiClient.get(endpoint, headers);
    const endTime = Date.now();
    this.responseTime = endTime - startTime;
    
    this.deviceDetailsResponse = this.response;
    console.log(`${green}✅ Device details retrieved for ${deviceId} in ${this.responseTime}ms`);
});
