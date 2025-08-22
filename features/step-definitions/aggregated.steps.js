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
import { getResponseData } from "../helpers/responseValidator.js";
import { buildEndpoint, addQueryParams } from "../helpers/stepHelpers.js";
import { storeUserRequestData } from "../helpers/testHelpers.js";

// Step: Verify the mapping of students to device
Then(/^verify the mapping of students to device$/, async function () {
    const deviceId = this.regResponse?.body?.device_id || this.regResponse?.data?.device_id || this.device_id;
    //const deviceId = "U028NZ";
    const schoolCode = testData["school_code"];
    
    if (!deviceId) {
        throw new Error("deviceId not found from previous registration step.");
    }

    // Build endpoint with query parameters for verification
    const baseEndpoint = process.env.GET_USERS_LIST_ENDPOINT;
  const endpoint =
    `${baseEndpoint}?device_id=${deviceId}&type=student&projection=username,device_id&page=1&limit=100&is_login_info=true`.replace(
      "{school_code}",
      schoolCode
    );

    console.log(`${yellow}🔍 Verifying student mapping for device: ${deviceId}`);
    console.log(`${yellow}🔗 Verification endpoint: ${endpoint}`);

  await makeTimedRequest(this, "get", endpoint);
    
    // Get response data
    const responseData = this.response.body || this.response.data || this.response;
    console.log(`${yellow}📊 Verification response:`, JSON.stringify(responseData, null, 2));
    
    // Check if we have data array
    if (!responseData.data) {
        throw new Error("Response does not contain 'data' array");
    }
    
    // Check if users were mapped in previous step
    if (!this.mappedUserIds || this.mappedUserIds.length === 0) {
        throw new Error("No mapped user IDs found from previous mapping step");
    }
    
    // Get user_id to username mapping from test data
    const userIdToUsernameMap = testData["user_id_to_username_mapping"];
    if (!userIdToUsernameMap) {
        throw new Error("user_id_to_username_mapping not found in testData.json");
    }
    
    // Verify that users are mapped to the device
    const usersWithDevice = responseData.data.filter(user => user.device_id === deviceId);
    
    if (usersWithDevice.length === 0) {
        console.log(`${red}❌ No users found mapped to device: ${deviceId}`);
        console.log(`${red}📋 Expected mapped user IDs: ${this.mappedUserIds.join(', ')}`);
        console.log(`${red}📊 Actual response data: ${JSON.stringify(responseData.data, null, 2)}`);
        throw new Error(`No users found mapped to device ${deviceId}. Expected ${this.mappedUserIds.length} users.`);
    }
    
    // Build expected usernames based on mapped user IDs
    const expectedUsernames = this.mappedUserIds.map(userId => {
        const username = userIdToUsernameMap[userId];
        if (!username) {
            throw new Error(`Username not found for user_id: ${userId} in testData mapping`);
        }
        return username;
    });
    
    console.log(`${yellow}📋 Expected usernames for mapped users: ${expectedUsernames.join(', ')}`);
    
    // Verify that the specific mapped users are present
    const actualUsernames = usersWithDevice.map(user => user.username);
    
    // Check that all expected users are found
    expectedUsernames.forEach(expectedUsername => {
        const found = actualUsernames.includes(expectedUsername);
        if (!found) {
            throw new Error(`Expected user '${expectedUsername}' not found in device mappings. Found users: ${actualUsernames.join(', ')}`);
        }
        console.log(`${green}✅ Found expected user: ${expectedUsername}`);
    });
    
    // Verify each user has the correct device_id
    usersWithDevice.forEach(user => {
        if (expectedUsernames.includes(user.username)) {
            expect(user.device_id).toEqual(deviceId);
            console.log(`${green}✅ User '${user.username}' correctly mapped to device: ${deviceId}`);
        }
    });
    this.mappedStudentUsernames = usersWithDevice.map(user => user.username);
    
    console.log(`${green}✅ Student mapping verification completed for device: ${deviceId}`);
    console.log(`${green}👥 Verified ${expectedUsernames.length} expected users are mapped to device`);
    console.log(`${green}📋 Verified users: ${expectedUsernames.join(', ')}`);
});

Given(
  /^as (a|an) (teacher|admin), I get all the "([^"]*)" requests for the school "([^"]*)"$/,
  async function (article, user_type, request_type, school_code) {
    let limit = 1000;
    let page = 1;

    let endpoint = buildEndpoint(process.env.INCOMING_REQUEST_LIST_ENDPOINT, {
      school_code,
      request_type,
    });
    endpoint = addQueryParams(endpoint, { limit, page });
    await makeTimedRequest(this, "get", endpoint);
    this.responseData = getResponseData(this.response);
    console.log(
      `${green}Response Data: ${JSON.stringify(this.responseData, null, 2)}`
    );
  }
);

Given(
  /^store user_id and request_id for the user "([^"]*)" with status "([^"]*)"$/,
  async function (username, status) {
    if (username && status) {
      storeUserRequestData(this, username, status);
    }
  }
);
