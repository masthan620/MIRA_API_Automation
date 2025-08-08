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
  
  