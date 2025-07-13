import { Given, Then, Before } from "@wdio/cucumber-framework";
import serviceFactory from "../../services/service-factory";
import { getResponseData } from "../helpers/responseValidator.js";
import { generatePassword } from "../../utils/generateRandomData.js";
import {
  getFinalRequestBody,
  buildEndpoint,
  addQueryParams,
  waitFor,
} from "../helpers/stepHelpers.js";
import {
  red,
  green,
  yellow,
  reset,
  makeTimedRequest,
} from "../../utils/apiClient.js";

// Initialize helper methods once before scenarios
Before(function () {
  if (!this.resolveRequestId) {
    this.resolveRequestId = function (requestId) {
      if (requestId === "{stored_request_id}" && this.stored_request_id) {
        console.log(
          `${yellow} Replaced placeholder with stored request ID: ${this.stored_request_id}`
        );
        return this.stored_request_id;
      } else if (requestId.startsWith("{") && requestId.endsWith("}")) {
        throw new Error(
          `Placeholder ${requestId} could not be resolved. Make sure you've stored the request ID first.`
        );
      }
      return requestId;
    };
  }

  if (!this.storeUserRequestData) {
    this.storeUserRequestData = function (username, status) {
      const responseData = getResponseData(this.response);
      if (!responseData.data || !Array.isArray(responseData.data)) {
        throw new Error('Response does not contain a "data" array');
      }

      const userRequest = responseData.data.find(
        (req) => req.username === username && req.status === status
      );

      if (!userRequest) {
        throw new Error(
          `No reset request found for user "${username}" with status "${status}"`
        );
      }

      if (userRequest.user_id === undefined) {
        throw new Error(
          'The field "user_id" does not exist in the reset request'
        );
      }

      if (userRequest.id === undefined) {
        throw new Error('The field "id" does not exist in the reset request');
      }

      this.stored_user_id = userRequest.user_id;
      this.stored_request_id = userRequest.id;
      this.stored_username = username;
      this.stored_status = status;

      console.log(`${green} Stored user_id: ${this.stored_user_id}`);
      console.log(`${green} Stored request_id: ${this.stored_request_id}`);
      console.log(`${green} For username: ${username} with status: ${status}`);
    };
  }
});

Given(
  /^Send an OTP request using "([^"]*)" request body$/,
  async function (bodyKey) {
    const endpoint = process.env.OTP_ENDPOINT;
    if (!endpoint) {
      throw new Error("OTP_ENDPOINT environment variable is not defined");
    }
    const requestBody = getFinalRequestBody(bodyKey);
    await makeTimedRequest(this, "post", endpoint, requestBody);
  }
);

Given(
  /^Send an OTP request using "([^"]*)" request body:$/,
  async function (bodyKey, table) {
    const endpoint = process.env.OTP_ENDPOINT;
    if (!endpoint) {
      throw new Error("OTP_ENDPOINT environment variable is not defined");
    }
    const requestBody = getFinalRequestBody(bodyKey, table);
    await makeTimedRequest(this, "post", endpoint, requestBody);
  }
);

Given(
  /^as a student, I send a Reset Password request for user "([^"]*)"$/,
  async function (username) {
    const baseKey = "passwordResetToAdmin/Teacher";

    if (!process.env.PASSWORD_RESET_REQUEST_ENDPOINT) {
      throw new Error(
        "PASSWORD_RESET_REQUEST_ENDPOINT environment variable is not defined"
      );
    }
    const endpoint = buildEndpoint(
      process.env.PASSWORD_RESET_REQUEST_ENDPOINT,
      { username }
    );
    const requestBody = getFinalRequestBody(baseKey);

    console.log(
      `${green} Final Request Body →`,
      JSON.stringify(requestBody, null, 2)
    );

    await makeTimedRequest(this, "post", endpoint, requestBody, {}, false);
  }
);

Given(
  /^as a student, I send a Reset Password request for user "([^"]*)":$/,
  async function (username, table) {
    const baseKey = "passwordResetToAdmin/Teacher";

    if (!process.env.PASSWORD_RESET_REQUEST_ENDPOINT) {
      throw new Error(
        "PASSWORD_RESET_REQUEST_ENDPOINT environment variable is not defined"
      );
    }

    const endpoint = buildEndpoint(
      process.env.PASSWORD_RESET_REQUEST_ENDPOINT,
      { username }
    );
    const requestBody = getFinalRequestBody(baseKey, table);

    console.log(
      `${green} Final Request Body →`,
      JSON.stringify(requestBody, null, 2)
    );

    await makeTimedRequest(this, "post", endpoint, requestBody, {}, false);
  }
);

Given(
  /^as an admin, get all password reset requests for school "([^"]*)"(?: with limit "([^"]*)" and page "([^"]*)")?(?: and store user_id and request_id for the user "([^"]*)" with status "([^"]*)")?$/,
  async function (schoolCode, limit, page, username, status) {
    if (!process.env.PASSWORD_RESET_LIST_ENDPOINT) {
      throw new Error(
        "PASSWORD_RESET_LIST_ENDPOINT environment variable is not defined"
      );
    }

    // Apply defaults
    limit = limit || 1000;
    page = page || 1;

    let endpoint = buildEndpoint(process.env.PASSWORD_RESET_LIST_ENDPOINT, {
      schoolCode,
    });
    endpoint = addQueryParams(endpoint, { limit, page });
    await waitFor(5000);
    await makeTimedRequest(this, "get", endpoint);

    // Handle storage logic if parameters are provided
    if (username && status) {
      this.storeUserRequestData(username, status);
    }
  }
);

Given(
  /^as a Teacher or Admin, I approve password reset request "([^"]*)"$/,
  async function (requestId) {
    const baseKey = "password-reset-status";
    if (!process.env.PASSWORD_RESET_HANDLE_ENDPOINT) {
      throw new Error(
        "PASSWORD_RESET_HANDLE_ENDPOINT environment variable is not defined"
      );
    }

    requestId = this.resolveRequestId(requestId);
    const endpoint = buildEndpoint(process.env.PASSWORD_RESET_HANDLE_ENDPOINT, {
      request_id: requestId,
    });

    const requestBody = getFinalRequestBody(baseKey);
    await makeTimedRequest(this, "patch", endpoint, requestBody);
  }
);
Given(
  /^as a Teacher or Admin, I reject password reset request "([^"]*)":$/,
  async function (requestId, table) {
    const baseKey = "password-reset-status";

    if (!process.env.PASSWORD_RESET_HANDLE_ENDPOINT) {
      throw new Error(
        "PASSWORD_RESET_HANDLE_ENDPOINT environment variable is not defined"
      );
    }

    requestId = this.resolveRequestId(requestId);
    const endpoint = buildEndpoint(process.env.PASSWORD_RESET_HANDLE_ENDPOINT, {
      request_id: requestId,
    });

    const requestBody = getFinalRequestBody(baseKey, table);
    await makeTimedRequest(this, "patch", endpoint, requestBody);
  }
);

Given(/^as a user, I reset password for "([^"]*)"$/, async function (username) {
  const baseKey = "resetPasswordWithUserId";

  if (!process.env.USER_PASSWORD_RESET_ENDPOINT) {
    throw new Error(
      "USER_PASSWORD_RESET_ENDPOINT environment variable is not defined"
    );
  }

  const endpoint = buildEndpoint(process.env.USER_PASSWORD_RESET_ENDPOINT, {
    username,
  });

  const requestBody = getFinalRequestBody(baseKey);

  // Get user_id from database first
  const usersService = serviceFactory.getUsersService("iamdb");
  const dbUser = await usersService.getUserByUsername(username.toLowerCase());

  if (!dbUser) {
    console.log(`${red} User ${username} not found in database`);
    requestBody.user_id = "invalid_user_id";
  } else {
    console.log(
      `${green} Found user: ${username} with user_id: ${dbUser.user_id}`
    );
    // Update with database user_id
    requestBody.user_id = dbUser.user_id;
  }

  // Generate password and store sent data
  requestBody.new_password = generatePassword({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });

  console.log(
    `${yellow} Generated password for ${username}: ${requestBody.new_password}`
  );

  this.sentData = { ...requestBody, username };

  await makeTimedRequest(this, "patch", endpoint, requestBody);
});

// Separate step for overrides
Given(
  /^as a user, I reset password for "([^"]*)" with overrides:$/,
  async function (username, table) {
    const baseKey = "resetPasswordWithUserId";

    if (!process.env.USER_PASSWORD_RESET_ENDPOINT) {
      throw new Error(
        "USER_PASSWORD_RESET_ENDPOINT environment variable is not defined"
      );
    }

    const endpoint = buildEndpoint(process.env.USER_PASSWORD_RESET_ENDPOINT, {
      username,
    });

    // Get user_id from database first
    const usersService = serviceFactory.getUsersService("iamdb");
    const dbUser = await usersService.getUserByUsername(username);

    if (!dbUser) {
      throw new Error(`User ${username} not found in database`);
    }

    console.log(
      `${green} Found user: ${username} with user_id: ${dbUser.user_id}`
    );

    const requestBody = getFinalRequestBody(baseKey, table);

    // Update with database user_id
    requestBody.user_id = dbUser.user_id;

    // Generate password and store sent data
    requestBody.new_password = generatePassword({
      length: 12,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });

    console.log(
      `${yellow} Generated password for ${username}: ${requestBody.new_password}`
    );

    this.sentData = { ...requestBody, username };

    await makeTimedRequest(this, "patch", endpoint, requestBody);
  }
);

Then(
  /^verify that there exists a password reset request record with pending status in DB for user "([^"]*)"$/,
  async function (username) {
    const usersService = serviceFactory.getUsersService("iamdb");
    const user = await usersService.getUserByUsername(username);

    if (!user) {
      throw new Error(`User with username "${username}" not found in database`);
    }

    console.log(
      `${green} Found user: ${username} with user_id: ${user.user_id}`
    );

    this.current_user_id = user.user_id;
    this.current_username = username;

    if (this.response.status === 200 || this.response.status === 201) {
      await verifyPasswordResetRequestCreated(this, user.user_id);
    }
  }
);

async function verifyPasswordResetRequestCreated(testContext, userId) {
  console.log(`${green} Received userId: ${userId} (type: ${typeof userId})`);

  await waitFor(2000);

  const resetService = serviceFactory.getPasswordResetService("iamdb");
  const pendingRequest = await resetService.getPendingRequestByUserId(userId);

  if (pendingRequest) {
    console.log(
      `${green} Password reset request created: ID=${pendingRequest.id}, Status=${pendingRequest.status}`
    );
    testContext.created_reset_request_id = pendingRequest.id;
    testContext.created_reset_request = pendingRequest;
  } else {
    console.log(`${red} No pending password reset request found in database`);
    const allRequests = await resetService.getAllRequestsByUserId(userId);
    console.log(`${green} All requests for user ${userId}:`, allRequests);
    throw new Error(
      `Expected pending password reset request for user_id ${userId} not found`
    );
  }
}
