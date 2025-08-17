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

// DEVICE REGISTRATION STEPS (existing - keep as is)
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

// Replace your device mapping steps with these simple ones

// Map device to school WITHOUT overrides (NO table)
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
    
    // Empty request body (no subscription_key needed)
    const requestBody = {};
    console.log("Request Body →", JSON.stringify(requestBody, null, 2));
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': process.env.ACCESS_TOKEN
    };
    
    try {
        this.response = await apiClient.post(endpoint, requestBody, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.deviceId = deviceId;
});

// Map device to school WITH overrides (WITH table)
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
    
    // Empty request body (no subscription_key needed)
    const requestBody = {};
    console.log("Request Body →", JSON.stringify(requestBody, null, 2));
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': process.env.ACCESS_TOKEN
    };
    
    try {
        this.response = await apiClient.post(endpoint, requestBody, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.deviceId = deviceId;
});

// Add these step definitions to your device.management.steps.js file

// Get device details WITHOUT overrides (NO table)
// Add these step definitions to the END of your features/step-definitions/device.management.steps.js file

// Get device details WITHOUT overrides (NO table)
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
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': process.env.ACCESS_TOKEN
    };
    
    try {
        this.response = await apiClient.get(endpoint, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.deviceId = deviceId; // Store for later use
});

// Get device details WITH overrides (WITH table)
Given(/^get device details:$/, async function (table) {
    // Try multiple paths to find device_id from registration response
    let deviceId = this.regResponse?.data?.device_id || 
                   this.regResponse?.body?.data?.device_id || 
                   this.regResponse?.data?.data?.device_id ||
                   this.response?.data?.device_id ||
                   this.response?.body?.data?.device_id ||
                   this.deviceId;
    
    // Process table overrides
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
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': process.env.ACCESS_TOKEN
    };
    
    try {
        this.response = await apiClient.get(endpoint, headers);
    } catch (error) {
        this.response = error.response;
    }
    
    this.sentData = { device_id: deviceId };
    this.deviceId = deviceId; // Store for later use
});