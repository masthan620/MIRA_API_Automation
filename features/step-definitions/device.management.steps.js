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
// Function to load request body from JSON (keep only one declaration)
const loadRequestBody = (key) => {
    const dataPath = path.resolve('./test-data/apiRequestBodies.json');
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const requestBodies = JSON.parse(raw);
    return requestBodies[key];
};
// Utility function for applying overrides (keep only one declaration)
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
// Helper function to build headers with authentication
const buildAuthHeaders = (authToken) => {
    const headers = { 'Content-Type': 'application/json' };
    
    if (authToken !== null) {
        headers['Authorization'] = authToken;
    }
    
    return headers;
};
// DEVICE REGISTRATION STEPS - UPDATED
Given(/^register device$/, async function () {
    const endpoint = process.env.DEVICE_REGISTER_ENDPOINT;
    this.requestBody = loadRequestBody("saveDevice");
    this.requestBody.unique_device_id = generateUniqueId1();
    console.log("Final Request Body →", JSON.stringify(this.requestBody, null, 2));
    
    // UPDATED: Use this.authToken if set, otherwise use default token
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`${yellow}🔑 Registration using auth token: ${authToken || 'null/empty'}`);
    
    const headers = buildAuthHeaders(authToken);
    console.log("Request Headers →", JSON.stringify(headers, null, 2));
    
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
    
    // UPDATED: Use this.authToken if set, otherwise use default token
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`${yellow}🔑 Registration using auth token: ${authToken || 'null/empty'}`);
    
    const headers = buildAuthHeaders(authToken);
    console.log("Request Headers →", JSON.stringify(headers, null, 2));
    
    this.response = await apiClient.post(endpoint, this.requestBody, headers);
    this.regResponse = this.response;
});
// Map device to school WITHOUT overrides (NO table) - UPDATED
Given(/^map the device to school$/, async function () {
    const deviceId = this.regResponse?.data?.device_id || 
                     this.regResponse?.body?.data?.device_id || 
                     this.regResponse?.data?.data?.device_id ||
                     this.device_id;
    
    const organisationCode = testData["organisation_code"];
    
    if (!deviceId) {
        console.error("Available response structure:", JSON.stringify(this.regResponse, null, 2));
        throw new Error("deviceId not found from previous registration step.");
    }
    
    let endpoint = process.env.MAP_DEVICE_ENDPOINT;
    endpoint = endpoint.replace('{organisation_code}', organisationCode);
    endpoint = endpoint.replace('{device_id}', deviceId);
    
    console.log(`${yellow}🔗 Mapping device ${deviceId} to organization ${organisationCode}`);
    console.log(`${yellow}📍 Endpoint: ${endpoint}`);
    
    const requestBody = {};
    console.log("Request Body →", JSON.stringify(requestBody, null, 2));
    
    // UPDATED: Use this.authToken if set, otherwise use default token
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`${yellow}🔑 Using auth token: ${authToken || 'null/empty'}`);
    
    const headers = buildAuthHeaders(authToken);
    console.log("Request Headers →", JSON.stringify(headers, null, 2));
    
    try {
        this.response = await apiClient.post(endpoint, requestBody, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.deviceId = deviceId;
});
// Map device to school WITH overrides (WITH table) - UPDATED
Given(/^map the device to school:$/, async function (table) {
    let deviceId = this.regResponse?.data?.device_id || 
                   this.regResponse?.body?.data?.device_id || 
                   this.regResponse?.data?.data?.device_id ||
                   this.device_id;
    
    let organisationCode = testData["organisation_code"];
    
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
    
    for (const key in overrides) {
        const value = testData[overrides[key]] !== undefined ? testData[overrides[key]] : overrides[key];
        
        if (key === 'device_id') {
            deviceId = value;
        } else if (key === 'organisation_code') {
            organisationCode = value;
        }
    }
    
    let endpoint = process.env.MAP_DEVICE_ENDPOINT;
    endpoint = endpoint.replace('{organisation_code}', organisationCode);
    endpoint = endpoint.replace('{device_id}', deviceId);
    
    console.log(`${yellow}🔗 Mapping device ${deviceId} to organization ${organisationCode}`);
    console.log(`${yellow}📍 Final Endpoint: ${endpoint}`);
    
    const requestBody = {};
    console.log("Request Body →", JSON.stringify(requestBody, null, 2));
    
    // UPDATED: Use this.authToken if set, otherwise use default token
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`${yellow}🔑 Using auth token: ${authToken || 'null/empty'}`);
    
    const headers = buildAuthHeaders(authToken);
    console.log("Request Headers →", JSON.stringify(headers, null, 2));
    
    try {
        this.response = await apiClient.post(endpoint, requestBody, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.deviceId = deviceId;
});
// Get device details WITHOUT overrides (NO table) - UPDATED
Given(/^get device details$/, async function () {
    // Try multiple paths to find device_id from registration response
    const deviceId = this.regResponse?.data?.device_id || 
                     this.regResponse?.body?.data?.device_id || 
                     this.regResponse?.data?.data?.device_id ||
                     this.response?.data?.device_id ||
                     this.response?.body?.data?.device_id ||
                     this.deviceId;
    
    if (!deviceId) {
        console.error("Available regResponse:", JSON.stringify(this.regResponse, null, 2));
        console.error("Available response:", JSON.stringify(this.response, null, 2));
        throw new Error("deviceId not found from previous registration step.");
    }
    
    let endpoint = process.env.GET_DEVICE_DETAILS_ENDPOINT;
    endpoint = endpoint.replace('{device_id}', deviceId);
    
    console.log(`${yellow}🔍 Getting device details for device: ${deviceId}`);
    console.log(`${yellow}📍 Endpoint: ${endpoint}`);
    
    // UPDATED: Use this.authToken if set, otherwise use default token
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`${yellow}🔑 Using auth token: ${authToken || 'null/empty'}`);
    
    const headers = buildAuthHeaders(authToken);
    console.log("Request Headers →", JSON.stringify(headers, null, 2));
    
    try {
        this.response = await apiClient.get(endpoint, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.deviceId = deviceId; // Store for later use
});
// Get device details WITH overrides (WITH table) - UPDATED
Given(/^get device details:$/, async function (table) {
    // Try multiple paths to find device_id from registration response
    let deviceId = this.regResponse?.data?.device_id || 
                   this.regResponse?.body?.data?.device_id || 
                   this.regResponse?.data?.data?.device_id ||
                   this.response?.data?.device_id ||
                   this.response?.body?.data?.device_id ||
                   this.deviceId;
    
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
    
    // Apply overrides from testData if key matches, otherwise use raw value
    for (const key in overrides) {
        const value = testData[overrides[key]] !== undefined ? testData[overrides[key]] : overrides[key];
        
        if (key === 'device_id') {
            deviceId = value;
        }
    }
    
    if (!deviceId && !overrides.device_id) {
        console.error("Available regResponse:", JSON.stringify(this.regResponse, null, 2));
        console.error("Available response:", JSON.stringify(this.response, null, 2));
        throw new Error("deviceId not found from previous registration step and not provided in overrides.");
    }
    
    let endpoint = process.env.GET_DEVICE_DETAILS_ENDPOINT;
    endpoint = endpoint.replace('{device_id}', deviceId);
    
    console.log(`${yellow}🔍 Getting device details for device: ${deviceId}`);
    console.log(`${yellow}📍 Endpoint: ${endpoint}`);
    
    // UPDATED: Use this.authToken if set, otherwise use default token
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`${yellow}🔑 Using auth token: ${authToken || 'null/empty'}`);
    
    const headers = buildAuthHeaders(authToken);
    console.log("Request Headers →", JSON.stringify(headers, null, 2));
    
    try {
        this.response = await apiClient.get(endpoint, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.sentData = { device_id: deviceId };
    this.deviceId = deviceId; // Store for later use
});
// Get organisation device details WITHOUT overrides (NO table) - UPDATED
Given(/^get the organization details for device$/, async function () {
    // Try multiple paths to find device_id from registration response
    const deviceId = this.regResponse?.data?.device_id || 
                     this.regResponse?.body?.data?.device_id || 
                     this.regResponse?.data?.data?.device_id ||
                     this.response?.data?.device_id ||
                     this.response?.body?.data?.device_id ||
                     this.deviceId;
    
    // Get organisation_code from test data
    const organisationCode = testData["organisation_code"];
    
    if (!deviceId) {
        console.error("Available regResponse:", JSON.stringify(this.regResponse, null, 2));
        console.error("Available response:", JSON.stringify(this.response, null, 2));
        throw new Error("deviceId not found from previous registration step.");
    }
    
    if (!organisationCode) {
        throw new Error("organisation_code not found in testData.json");
    }
    
    let endpoint = process.env.GET_ORGANISATION_DEVICE_ENDPOINT;
    endpoint = endpoint.replace('{organisation_code}', organisationCode);
    endpoint = endpoint.replace('{device_id}', deviceId);
    
    console.log(`${yellow}🔍 Getting organisation device details for device: ${deviceId}`);
    console.log(`${yellow}🏢 Organisation: ${organisationCode}`);
    console.log(`${yellow}📍 Endpoint: ${endpoint}`);
    
    // UPDATED: Use this.authToken if set, otherwise use default token
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`${yellow}🔑 Using auth token: ${authToken || 'null/empty'}`);
    
    const headers = buildAuthHeaders(authToken);
    console.log("Request Headers →", JSON.stringify(headers, null, 2));
    
    try {
        this.response = await apiClient.get(endpoint, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.deviceId = deviceId; // Store for later use
    this.organisationCode = organisationCode; // Store for later use
});
// Get organisation device details WITH overrides (WITH table) - UPDATED
Given(/^get the organization details for device:$/, async function (table) {
    // Try multiple paths to find device_id from registration response
    let deviceId = this.regResponse?.data?.device_id || 
                   this.regResponse?.body?.data?.device_id || 
                   this.regResponse?.data?.data?.device_id ||
                   this.response?.data?.device_id ||
                   this.response?.body?.data?.device_id ||
                   this.deviceId;
    
    // Get default organisation_code from test data
    let organisationCode = testData["organisation_code"];
    
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
    
    // Apply overrides from testData if key matches, otherwise use raw value
    for (const key in overrides) {
        const value = testData[overrides[key]] !== undefined ? testData[overrides[key]] : overrides[key];
        
        if (key === 'device_id') {
            deviceId = value;
        } else if (key === 'organisation_code') {
            organisationCode = value;
        }
    }
    
    if (!deviceId && !overrides.device_id) {
        console.error("Available regResponse:", JSON.stringify(this.regResponse, null, 2));
        console.error("Available response:", JSON.stringify(this.response, null, 2));
        throw new Error("deviceId not found from previous registration step and not provided in overrides.");
    }
    
    if (!organisationCode && !overrides.organisation_code) {
        throw new Error("organisation_code not found in testData.json and not provided in overrides.");
    }
    
    let endpoint = process.env.GET_ORGANISATION_DEVICE_ENDPOINT;
    endpoint = endpoint.replace('{organisation_code}', organisationCode);
    endpoint = endpoint.replace('{device_id}', deviceId);
    
    console.log(`${yellow}🔍 Getting organisation device details for device: ${deviceId}`);
    console.log(`${yellow}🏢 Organisation: ${organisationCode}`);
    console.log(`${yellow}📍 Endpoint: ${endpoint}`);
    console.log(`${yellow}⚙️ Applied overrides:`, JSON.stringify(overrides, null, 2));
    
    // UPDATED: Use this.authToken if set, otherwise use default token
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`${yellow}🔑 Using auth token: ${authToken || 'null/empty'}`);
    
    const headers = buildAuthHeaders(authToken);
    console.log("Request Headers →", JSON.stringify(headers, null, 2));
    
    try {
        this.response = await apiClient.get(endpoint, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.sentData = { device_id: deviceId, organisation_code: organisationCode };
    this.deviceId = deviceId; // Store for later use
    this.organisationCode = organisationCode; // Store for later use
});
// Unmap device from school WITHOUT overrides (NO table)
Given(/^unmap the device from school$/, async function () {
    const deviceId = this.regResponse?.data?.device_id || 
                     this.regResponse?.body?.data?.device_id || 
                     this.regResponse?.data?.data?.device_id ||
                     this.device_id;
    
    const organisationCode = testData["organisation_code"];
    
    if (!deviceId) {
        console.error("Available response structure:", JSON.stringify(this.regResponse, null, 2));
        throw new Error("deviceId not found from previous registration step.");
    }
    
    let endpoint = process.env.UNMAP_DEVICE_ENDPOINT;
    endpoint = endpoint.replace('{organisation_code}', organisationCode);
    endpoint = endpoint.replace('{device_id}', deviceId);
    
    console.log(`${yellow}🔗 Unmapping device ${deviceId} from organization ${organisationCode}`);
    console.log(`${yellow}📍 Endpoint: ${endpoint}`);
    
    // Use this.authToken if set, otherwise use default token
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`${yellow}🔑 Using auth token: ${authToken || 'null/empty'}`);
    
    const headers = buildAuthHeaders(authToken);
    console.log("Request Headers →", JSON.stringify(headers, null, 2));
    
    try {
        this.response = await apiClient.delete(endpoint, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.deviceId = deviceId;
});
// Unmap device from school WITH overrides (WITH table)
Given(/^unmap the device from school:$/, async function (table) {
    let deviceId = this.regResponse?.data?.device_id || 
                   this.regResponse?.body?.data?.device_id || 
                   this.regResponse?.data?.data?.device_id ||
                   this.device_id;
    
    let organisationCode = testData["organisation_code"];
    
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
    
    for (const key in overrides) {
        const value = testData[overrides[key]] !== undefined ? testData[overrides[key]] : overrides[key];
        
        if (key === 'device_id') {
            deviceId = value;
        } else if (key === 'organisation_code') {
            organisationCode = value;
        }
    }
    
    let endpoint = process.env.UNMAP_DEVICE_ENDPOINT;
    endpoint = endpoint.replace('{organisation_code}', organisationCode);
    endpoint = endpoint.replace('{device_id}', deviceId);
    
    console.log(`${yellow}🔗 Unmapping device ${deviceId} from organization ${organisationCode}`);
    console.log(`${yellow}📍 Final Endpoint: ${endpoint}`);
    
    // Use this.authToken if set, otherwise use default token
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`${yellow}🔑 Using auth token: ${authToken || 'null/empty'}`);
    
    const headers = buildAuthHeaders(authToken);
    console.log("Request Headers →", JSON.stringify(headers, null, 2));
    
    try {
        this.response = await apiClient.delete(endpoint, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.deviceId = deviceId;
});
// Add these student mapping steps to your existing device.management.steps.js file

// Map students to device WITHOUT overrides (NO table)
Given(/^map students to device$/, async function () {
    const deviceId = this.deviceId || 
                     this.regResponse?.data?.device_id || 
                     this.regResponse?.body?.data?.device_id || 
                     this.regResponse?.data?.data?.device_id;
    
    const organisationCode = testData["organisation_code"];
    
    if (!deviceId) {
        console.error("Available response structure:", JSON.stringify(this.regResponse, null, 2));
        throw new Error("deviceId not found from previous registration step.");
    }
    
    let endpoint = process.env.MAP_STUDENTS_TO_DEVICE_ENDPOINT;
    endpoint = endpoint.replace('{organisation_code}', organisationCode);
    endpoint = endpoint.replace('{device_id}', deviceId);
    
    console.log(`Mapping students to device ${deviceId} in organization ${organisationCode}`);
    console.log(`Endpoint: ${endpoint}`);
    
    const requestBody = {
        user_ids: testData["student_user_ids"]
    };
    
    console.log("Request Body →", JSON.stringify(requestBody, null, 2));
    
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`Using auth token: ${authToken || 'null/empty'}`);
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (authToken !== null) {
        headers['Authorization'] = authToken;
    }
    
    console.log("Request Headers →", JSON.stringify(headers, null, 2));
    
    try {
        this.response = await apiClient.post(endpoint, requestBody, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.deviceId = deviceId;
    this.mappedUserIds = testData["student_user_ids"];
    this.sentData = { device_id: deviceId, organisation_code: organisationCode, user_ids: testData["student_user_ids"] };
});
// Map students to device WITH overrides (WITH table)
Given(/^map students to device:$/, async function (table) {
    let deviceId = this.deviceId || 
                   this.regResponse?.data?.device_id || 
                   this.regResponse?.body?.data?.device_id || 
                   this.regResponse?.data?.data?.device_id;
    
    let organisationCode = testData["organisation_code"];
    let userIds = testData["student_user_ids"];
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
    for (const key in overrides) {
        const value = testData[overrides[key]] !== undefined ? testData[overrides[key]] : overrides[key];
        if (key === 'device_id') {
            deviceId = value;
        } else if (key === 'organisation_code') {
            organisationCode = value;
        } else if (key === 'user_ids') {
            try {
                if (testData[overrides[key]]) {
                    userIds = testData[overrides[key]];
                } else {
                    userIds = JSON.parse(overrides[key]);
                }
            } catch (error) {
                userIds = [overrides[key]];
            }
        }
    }
    let endpoint = process.env.MAP_STUDENTS_TO_DEVICE_ENDPOINT;
    endpoint = endpoint.replace('{organisation_code}', organisationCode);
    endpoint = endpoint.replace('{device_id}', deviceId);
    console.log(`Mapping students to device ${deviceId} in organization ${organisationCode}`);
    console.log(`Final Endpoint: ${endpoint}`);
    console.log(`User IDs: ${JSON.stringify(userIds)}`);
    
    const requestBody = {
        user_ids: userIds
    };
    console.log("Request Body →", JSON.stringify(requestBody, null, 2));
    const authToken = this.authToken !== undefined ? this.authToken : process.env.ACCESS_TOKEN;
    console.log(`Using auth token: ${authToken || 'null/empty'}`);
    
    const headers = {
        'Content-Type': 'application/json'
    };
    if (authToken !== null) {
        headers['Authorization'] = authToken;
    }
    console.log("Request Headers →", JSON.stringify(headers, null, 2)); 
    try {
        this.response = await apiClient.post(endpoint, requestBody, headers);
    } catch (error) {
        this.response = error.response;
    }
    this.deviceId = deviceId;
    this.mappedUserIds = userIds;
    this.sentData = { device_id: deviceId, organisation_code: organisationCode, user_ids: userIds };
});
