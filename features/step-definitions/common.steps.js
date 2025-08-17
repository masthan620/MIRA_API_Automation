import { Given, Then } from '@wdio/cucumber-framework';
import { expect } from '@wdio/globals';
import apiClient from '../../utils/apiClient.js'; //
import fs from 'fs';
import path from 'path';
import serviceFactory from  '../../services/service-factory';
import { getResponseData, verifyField } from '../helpers/responseValidator.js';

import { generateUniqueId1 } from "../../utils/generateRandomData.js";

import { red, green, yellow } from "../../utils/apiClient.js";

// Function to load request body from JSON
const loadRequestBody = (key) => {
    const dataPath = path.resolve('./test-data/apiRequestBodies.json');
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const requestBodies = JSON.parse(raw);
    return requestBodies[key];
};

// Utility: Apply overrides with support for dot notation
const applyOverrides = (base, overrides) => {
    for (const key in overrides) {
        if (key.includes('.')) {
            const parts = key.split('.');
            let ref = base;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!ref[parts[i]]) ref[parts[i]] = {};
                ref = ref[parts[i]];
            }
            ref[parts[parts.length - 1]] = overrides[key];
        } else {
            base[key] = overrides[key];
        }
    }
    return base;
};


const findKeyDeep = (obj, keyToFind) => {
  if (typeof obj !== 'object' || obj === null) return undefined;

  if (Object.prototype.hasOwnProperty.call(obj, keyToFind)) {
    return obj[keyToFind];
  }

  for (const key in obj) {
    const found = findKeyDeep(obj[key], keyToFind);
    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
};


Given(/^I send a GET request to "([^"]*)"$/, async function(url)  {
    this.response = await apiClient.get(url); 
});

Given(/^I send a POST request to "([^"]*)" with body:$/, async function(url, body)  {
    let requestBody = loadRequestBody("createDevice");

    this.response = await apiClient.post(url, requestBody); // 
});

Then(/^the response status code should be (\d+)$/, async function(expectedStatusCode) {
    expect(this.response.status).toEqual(parseInt(expectedStatusCode));
});

Given(/^I send a POST request to "([^"]*)" using "([^"]*)" request body$/, async function(endpoint, bodyKey) {
    let requestBody = loadRequestBody(bodyKey);
    if (!requestBody) {
      throw new Error("Loaded requestBody is undefined");
    }
    // Capture start time
    const startTime = Date.now();
    this.response = await apiClient.post(endpoint, requestBody);
    // Capture end time and calculate duration
    const endTime = Date.now();
    this.responseTime = endTime - startTime;

    console.log(`${endpoint} took ${this.responseTime}ms`);
  }
);

// POST with request body and dynamic overrides
Given(/^I send a POST request to "([^"]*)" using "([^"]*)" request body with overrides:$/, async function(endpoint, bodyKey, table) {
    let requestBody = loadRequestBody(bodyKey);
    const overrides = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
    requestBody = applyOverrides(requestBody, overrides);
    console.log("Final Request Body →", JSON.stringify(requestBody, null, 2));
    this.response = await apiClient.post(endpoint, requestBody);
});


Then('debug response structure', function() {
    console.log('Response type:', typeof this.response);
    //console.log('Response has body:', !!this.response.body);
    console.log('Response has data:', JSON.stringify(this.response.data));
    //console.log('Response keys:', Object.keys(this.response));
    
    // Try to safely extract important parts
    const statusCode = this.response.statusCode || this.response.status;
    console.log('Status code:', statusCode);
    
    // Try to extract the response body/data
    let responseData;
    if (this.response.body) {
        responseData = this.response.body;
    } else if (this.response.data) {
        responseData = this.response.data;
    } else {
        // Maybe the response itself is the data
        responseData = this.response;
    }
    
    console.log('Extracted data keys:', Object.keys(responseData));
});


Then('response should have fields {string}', function (fieldList) {
  const responseData = this.response.body || this.response.data || this.response;
  const fields = fieldList.split(',').map(f => f.trim());

  fields.forEach((field) => {
    const foundValue = findKeyDeep(responseData, field);
    expect(foundValue).toBeDefined();
    this[field] = foundValue;
    console.log(`✅ Found "${field}": ${foundValue}`);
  });
});


Then("response should have the following properties:", function (dataTable) {
  const responseData = getResponseData(this.response);
  const expectedFields = dataTable.raw();

  expectedFields.forEach((row) => {
    const fieldName = row[0];
    let expectedValue = row[1];

    // 🔍 If expectedValue is a key in global.testData, use the corresponding value
    if (global.testData.hasOwnProperty(expectedValue)) {
      expectedValue = global.testData[expectedValue];
    } else {
      // ❌ Fail the test immediately if key is missing
      console.error(
        `❌ TEST DATA JSON does not have the field: "${expectedValue}" for property "${fieldName}"`
      );
      throw new Error(
        `TEST DATA JSON does not have the field: "${expectedValue}" (for expected field "${fieldName}")`
      );
    }

    const actualValue = verifyField(responseData, fieldName, expectedValue);
    this[fieldName] = actualValue;
  });
});

Then(
  /^the response time should be less than (\d+) milliseconds$/,
  async function (expectedTime) {
    // Use this.responseTime instead of this.response.responseTime
    expect(this.responseTime).toBeDefined();
    expect(this.responseTime).toBeLessThan(parseInt(expectedTime));
    console.log(
      `✅ Response time: ${this.responseTime}ms (expected < ${expectedTime}ms)`
    );
  }
);

Then(
  "response should contain request data as specified:",
  function (dataTable) {
    const responseData = getResponseData(this.response);
    const validations = dataTable.raw();

    validations.forEach((row) => {
      const [requestField, responsePattern] = row;
      const sentValue = this.sentData && this.sentData[requestField];

      if (sentValue) {
        // Replace {value} placeholder with actual sent value
        const expectedText = responsePattern.replace("{value}", sentValue);
        expect(responseData.message).toContain(expectedText);
        console.log(`✅ Found ${requestField} in response: "${expectedText}"`);
      }
    });
  }
);

Given(/^i have valid authentication token$/, async function () {
  this.authToken = process.env.ACCESS_TOKEN;
  console.error(`Using auth token: ${this.authToken}`);
});

Given(/^i have invalid authentication token$/, function () {
  this.authToken = global.testData[invalid_auth_token] || testData["invalid_auth_token"];
  console.log(`${yellow}Using invalid auth token: ${this.authToken}`);
});

Given(/^i do not have authentication token$/, function () {
  this.authToken = null;
});


Then(/^response should be an array with device mappings$/, function () {
    const responseData = this.response.body || this.response.data || this.response;
    
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);
    console.log(`${green}✅ Response is array with ${responseData.length} device mappings`);
});
