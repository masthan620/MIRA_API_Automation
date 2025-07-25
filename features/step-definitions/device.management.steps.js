import { Given, Then, When } from '@wdio/cucumber-framework';
import { expect } from '@wdio/globals';
import apiClient from '../../utils/apiClient.js';
import fs from 'fs';
import path from 'path';
import serviceFactory from  '../../services/service-factory';
import testData from '../../test-data/testData.json';
import {
red,
green,
yellow,
reset,
  makeTimedRequest,
} from "../../utils/apiClient.js";

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
        current[part] = value;
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }

  return resolvedOverrides;
}
//Register device WITHOUT overrides (NO table)
Given(/^register device$/, async function () {
    const endpoint = process.env.DEVICE_REGISTER_ENDPOINT;
    this.requestBody = loadRequestBody("saveDevice");
    this.requestBody.unique_device_id = generateUniqueId1();
    console.log("Final Request Body →", JSON.stringify(this.requestBody, null, 2));
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': process.env.ACCESS_TOKEN
    };
    this.response = await apiClient.post(endpoint, this.requestBody, headers);
    this.regResponse = this.response;
});
Given(/^register device:$/, async function (table) {
    const endpoint = process.env.DEVICE_REGISTER_ENDPOINT;
    this.requestBody = loadRequestBody("saveDevice");
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
    if (!overrides.unique_device_id) {
      this.requestBody.unique_device_id = generateUniqueId1();
    }
    // Apply overrides from testData if key matches
    this.requestBody = applyOverrides(this.requestBody, overrides);
    console.log("Final Request Body →", JSON.stringify(this.requestBody, null, 2));
    //Updated: Add Authorization header for device registration
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': process.env.ACCESS_TOKEN
    };
    this.response = await apiClient.post(endpoint, this.requestBody, headers);
    this.regResponse = this.response;
});





// ✅ Map device to school - Condition-based (handles existing patterns)
// Update the existing step definition to handle invalid device_id from testData
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
  
    const requestBody = loadRequestBody("mapDevice");
    await makeTimedRequest(this, "post", endpoint, requestBody);
  }
);

// ✅ Unmap device from school
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
    auth: "EISecret",
    Authorization: `${process.env.ACCESS_TOKEN_UNMAP}`,
    "User-Agent": "Apidog/1.0.0 (https://apidog.com)",
    };
        
    this.response = await apiClient.delete(endpoint, headers);
    this.unmapresponse = this.response;
  });

Then(/^map (\d+) student\(s\) to device and verify status code (\d+)$/, async function (studentCount, expectedStatusCode) {
  // ... existing code ...
   const deviceId = this.regResponse?.body?.device_id || this.regResponse?.data?.device_id || this.device_id;
   //const deviceId = "U028NZ";
   const schoolCode = testData["school_code"];
   
   if (!deviceId) {
       throw new Error("deviceId not found from previous registration step.");
   }
 
   // Build endpoint
   const endpointTemplate = process.env.MAP_STUDENTS_TO_DEVICE_ENDPOINT;
   const endpoint = endpointTemplate
       .replace('{school_code}', schoolCode)
       .replace('{device_id}', deviceId);
 
   // Load request body and get user IDs from test data
   const requestBody = loadRequestBody("mapStudentsToDevice");
   const userIds = testData["student_user_ids"].slice(0, parseInt(studentCount));
   requestBody.user_ids = userIds;
 
    console.log(
      `${yellow}🎓 Mapping ${studentCount} students to device: ${deviceId}`
    );
    console.log(
      `${yellow}📦 Request Body:`,
      JSON.stringify(requestBody, null, 2)
    );
 
    await makeTimedRequest(this, "post", endpoint, requestBody);
   this.mappingResponse = this.response;
   
  // Verify status code
  expect(this.response.status).toEqual(parseInt(expectedStatusCode));
  console.log(`${green}✅ Mapping API returned status code: ${this.response.status}`);
  
  // Store mapped user IDs for verification
  this.mappedUserIds = userIds;
});
  
  