import serviceFactory from "../../services/service-factory";
import { getResponseData } from "../helpers/responseValidator.js";
import { red, green, yellow, makeTimedRequest } from "../../utils/apiClient.js";

export const resolveRequestId = (context, requestId) => {
  if (requestId === "{stored_request_id}" && context.stored_request_id) {
    console.log(
      `${yellow} Replaced placeholder with stored request ID: ${context.stored_request_id}`
    );
    return context.stored_request_id;
  } else if (requestId.startsWith("{") && requestId.endsWith("}")) {
    throw new Error(
      `Placeholder ${requestId} could not be resolved. Make sure you've stored the request ID first.`
    );
  }
  return requestId;
};

export const storeUserRequestData = (context, username, status) => {
  const responseData = getResponseData(context.response);

  const requests = responseData.data || responseData.passwordRequests;
  if (!requests || !Array.isArray(requests)) {
    throw new Error(
      'Response does not contain a valid "data" or "passwordRequests" array'
    );
  }
  const userRequest = requests.find(
    (req) => req.username === username && req.status === status
  );

  context.stored_user_id = userRequest.user_id;
  context.stored_request_id = userRequest.id;
  context.stored_username = username;
  context.stored_status = status;

  console.log(`${green} Stored user_id: ${context.stored_user_id}`);
  console.log(`${green} Stored request_id: ${context.stored_request_id}`);
  console.log(`${green} For username: ${username} with status: ${status}`);
};

export const authenticateUser = async (
  context,
  username,
  password,
  device_id
) => {
  let deviceId = device_id;
  let userExists = false;
  if (!device_id) {
    try {
      const usersService = serviceFactory.getUsersService("iamdb");
      const dbUser = await usersService.getUserByUsername(
        typeof username === "string" ? username.toLowerCase() : username
      );

      if (dbUser) {
        userExists = true;
        const deviceService =
          serviceFactory.getDeviceUserMappingService("devicemanagement");
        const mapping = await deviceService.getDeviceByUserId(dbUser.user_id);
        if (mapping?.device_id) {
          deviceId = mapping.device_id;
        }
      }
    } catch (e) {
      console.log(`${red} Skipping DB lookup: ${e.message}`);
    }
  }

  const endpoint = process.env.LOGIN_ENDPOINT;
  const requestBody = { username, password, device_id: deviceId };
  await makeTimedRequest(context, "post", endpoint, requestBody);
  if (context.response.status == 200) {
    const { data } = context.response;
    if (data && data.jwt.accessToken) {
      context.authToken = `Bearer ${data.jwt.accessToken}`;
      console.log(`Access token saved: ${context.authToken}`);
    } else {
      throw new Error("Access token not found in the response");
    }
  }
};
