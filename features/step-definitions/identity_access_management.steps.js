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
import {
  storeUserRequestData,
  resolveRequestId,
  authenticateUser,
} from "../helpers/testHelpers.js";

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
  /^as (a|an) (teacher|admin|student), I send a Reset Password request for user "([^"]*)":$/,
  async function (article, user_type, username, table) {
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
      storeUserRequestData(this, username, status);
    }
  }
);

Given(
  /^as (a|an) (teacher|admin), I approve password reset request(?: for the user "([^"]*)")?(?: with request_id "([^"]*)")?$/,
  async function (article, user_type, username, request_id) {
    const baseKey = "password-reset-status";
    if (!process.env.PASSWORD_RESET_HANDLE_ENDPOINT) {
      throw new Error(
        "PASSWORD_RESET_HANDLE_ENDPOINT environment variable is not defined"
      );
    }
    let inputRequestId = request_id || "{stored_request_id}";
    let requestId = resolveRequestId(this, inputRequestId);
    const endpoint = buildEndpoint(process.env.PASSWORD_RESET_HANDLE_ENDPOINT, {
      request_id: requestId,
    });

    const requestBody = getFinalRequestBody(baseKey);
    await makeTimedRequest(this, "patch", endpoint, requestBody);
  }
);
Given(
  /^as (a|an) (teacher|admin), I reject password reset request(?: for the user "([^"]*)")?(?: with request_id "([^"]*)")?:$/,
  async function (article, user_type, username, request_id, table) {
    const baseKey = "password-reset-status";

    if (!process.env.PASSWORD_RESET_HANDLE_ENDPOINT) {
      throw new Error(
        "PASSWORD_RESET_HANDLE_ENDPOINT environment variable is not defined"
      );
    }
    let inputRequestId = request_id || "{stored_request_id}";
    let requestId = resolveRequestId(this, inputRequestId);

    const endpoint = buildEndpoint(process.env.PASSWORD_RESET_HANDLE_ENDPOINT, {
      request_id: requestId,
    });

    const requestBody = getFinalRequestBody(baseKey, table);
    await makeTimedRequest(this, "patch", endpoint, requestBody);
  }
);

Given(
  /^as (a|an) (user|teacher|admin), I reset password for "([^"]*)"$/,
  async function (article, user_type, username) {
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


    if (user_type === "admin" || user_type === "teacher") {
      console.log(`${yellow} Adding additional properties for ${user_type}`);

      requestBody.new_password_type = "Text";
      requestBody.request_id = String(
        resolveRequestId(this, "{stored_request_id}")
      );

      console.log(`${green} Enhanced request body for ${user_type}:`, {
        user_id: requestBody.user_id,
        new_password_type: requestBody.new_password_type,
        request_id: requestBody.request_id,
        new_password: "***hidden***",
      });
    }

    this.sentData = { ...requestBody, username };
    // Initialize user passwords storage if not exists
    if (!global.testData["user_passwords"]) {
      global.testData["user_passwords"] = {};
    }

    // Store the new password for this specific user
    global.testData["user_passwords"][username] = requestBody.new_password;
    await makeTimedRequest(this, "patch", endpoint, requestBody);
  }
);

// Separate step for overrides
Given(
  /^as a (user|teacher|admin), I reset password for "([^"]*)":$/,
  async function (user_type, username, table) {
    const baseKey = "resetPasswordWithUserId";

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

    this.sentData = { ...requestBody, username };
    // Initialize user passwords storage if not exists
    if (!global.testData["user_passwords"]) {
      global.testData["user_passwords"] = {};
    }

    // Store the new password for this specific user
    global.testData["user_passwords"][username] = requestBody.new_password;
    console.log(global.testData["user_passwords"][username]);
    await makeTimedRequest(this, "patch", endpoint, requestBody);
  }
);

Then(
  /^a pending password reset request should exist for user "([^"]*)" in DB$/,
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

Given(/^i verify user "([^"]*)"$/, async function (username) {
  const endpoint = buildEndpoint(process.env.USER_VERIFICATION_ENDPOINT, {
    username,
  });
  await makeTimedRequest(this, "get", endpoint);
  // Store the requested username for later use
  this.requestedUsername = username.toLowerCase();
});

Then(/^validate response data against database$/, async function () {
  if (this.response?.status !== 200 || !this.requestedUsername) return;

  const validation = serviceFactory.getUserValidationService();
  await validation.validateUserResponse(
    this.requestedUsername,
    this.response.data
  );
});

Given(
  /^i login as a (teacher|student|admin) using user "([^"]*)"$/,
  async function (user_type, usernameOrPlaceholder) {
    let actualUsername, password;
    if (
      usernameOrPlaceholder.startsWith("{") &&
      usernameOrPlaceholder.endsWith("}")
    ) {
      const placeholder = usernameOrPlaceholder.slice(1, -1);
      const index =
        parseInt(placeholder.replace("mapped_student_", "")) - 1 || 0;
      actualUsername = this.mappedStudentUsernames[index];
    } else {
      actualUsername = usernameOrPlaceholder;
    }
    if (
      global.testData["user_passwords"] &&
      global.testData["user_passwords"][actualUsername]
    ) {
      password = global.testData["user_passwords"][actualUsername];
    } else {
      password = global.testData["admin_password"]; // Default password
    }

    await authenticateUser(this, actualUsername, password);
  }
);

Given(
  /^i login as a (teacher|student|admin) using user:$/,
  async function (user_type, table) {
    const params = Object.fromEntries(table.raw().map(([k, v]) => [k, v]));
    await authenticateUser(
      this,
      params.username,
      params.password,
      params.device_id
    );
  }
);
