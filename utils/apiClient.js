import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const red = "\x1b[31m";
export const green = "\x1b[32m";
export const yellow = "\x1b[33m";
export const reset = "\x1b[0m";

const instance = axios.create({
  baseURL: process.env.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Common function for making API requests with timing
export async function makeTimedRequest(
  context,
  method,
  endpoint,
  requestBody = null,
  headers = {},
  authRequired = true
) {
  // Input validation
  if (typeof endpoint !== "string" || !endpoint.trim()) {
    throw new Error("Endpoint must be a valid non-empty string");
  }

  if (!context || typeof context !== "object") {
    throw new Error("Context must be a valid object");
  }

  const validMethods = ["get", "post", "patch", "put", "delete"];
  if (!validMethods.includes(method.toLowerCase())) {
    throw new Error(
      `Unsupported HTTP method: ${method}. Supported methods: ${validMethods.join(
        ", "
      )}`
    );
  }

  // Add auth token if available in context
  if (authRequired) {
    if (context.authToken) {
      headers["Authorization"] = context.authToken;
    }
  }
  console.log(
    `${green} Making ${method.toUpperCase()} request to: ${endpoint}`
  );

  const startTime = Date.now();

  try {
    let response;

    switch (method.toLowerCase()) {
      case "get":
        response = await ApiClient.get(endpoint, headers);
        break;
      case "post":
        response = await ApiClient.post(endpoint, requestBody, headers);
        break;
      case "patch":
        response = await ApiClient.patch(endpoint, requestBody, headers);
        break;
      case "put":
        response = await ApiClient.put(endpoint, requestBody, headers);
        break;
      case "delete":
        response = await ApiClient.delete(endpoint, headers);
        break;
      default:
        throw new Error(`HTTP method ${method} is not implemented`);
    }

    context.response = response;
    console.log(
      `${green} ${method.toUpperCase()} request successful - Status: ${
        response.status
      }`
    );
  } catch (error) {
    context.response = error.response;
    context.error = error;

    console.log(`${red} ${method.toUpperCase()} request failed:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      endpoint: endpoint,
    });
  }

  const endTime = Date.now();
  context.responseTime = endTime - startTime;
  console.log(`${green} Request took ${context.responseTime}ms`);

  return context.response;
}

class ApiClient {
  static async get(endpoint, headers = {}) {
    const start = Date.now();
    try {
      const response = await instance.get(endpoint, { headers });
      const duration = Date.now() - start;
      console.log(`${green}GET ${endpoint} took ${duration}ms${reset}`);
      console.log(
        `${yellow}Response:${reset} ${JSON.stringify(response.data)}`
      );
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(
        `${red}GET ${endpoint} failed after ${duration}ms:${reset} ${error.message}`
      );
      if (error.response) {
        console.error(
          `${red}Status ${error.response.status}:${reset} ${JSON.stringify(
            error.response.data
          )}`
        );
      }
      return error.response;
    }
  }

  static async post(endpoint, data = {}, headers = {}) {
    const start = Date.now();
    try {
      const response = await instance.post(endpoint, data, { headers });
      const duration = Date.now() - start;
      console.log(`${green}POST ${endpoint} took ${duration}ms${reset}`);
      console.log(
        `${yellow}Response:${reset} ${JSON.stringify(response.data)}`
      );
      console.log(
        `${yellow}Device_id:${reset} ${JSON.stringify(response.data.device_id)}`
      );
      console.log(`${yellow}Response type:`, typeof this.response);
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(
        `${red}POST ${endpoint} failed after ${duration}ms:${reset} ${error.message}`
      );
      console.error(
        `${red}Request Body:${reset} ${JSON.stringify(data, null, 2)}`
      );

      if (error.response) {
        // Log the error response details
        console.error(
          `${red}Status ${error.response.status}:${reset} ${JSON.stringify(
            error.response.data
          )}`
        );
        // Return the error response object
        return error.response;
      }

      // Return a standardized error response for network errors or other issues
      return {
        status: 600, // Custom status code to indicate a non-HTTP error
        data: {
          status: false,
          message: error.message || "Unknown error occurred",
          code: "NETWORK_ERROR",
        },
      };
    }
  }

  static async put(endpoint, data = {}, headers = {}) {
    const start = Date.now();
    try {
      const response = await instance.put(endpoint, data, { headers });
      const duration = Date.now() - start;
      console.log(`${green}PUT ${endpoint} took ${duration}ms${reset}`);
      console.log(
        `${yellow}Response:${reset} ${JSON.stringify(response.data)}`
      );
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(
        `${red}PUT ${endpoint} failed after ${duration}ms:${reset} ${error.message}`
      );
      console.error(
        `${red}Request Body:${reset} ${JSON.stringify(data, null, 2)}`
      );
      if (error.response) {
        console.error(
          `${red}Status ${error.response.status}:${reset} ${JSON.stringify(
            error.response.data
          )}`
        );
      }
      throw error;
    }
  }

  static async delete(endpoint, headers = {}) {
    const start = Date.now();
    try {
      const response = await instance.delete(endpoint, { headers });
      const duration = Date.now() - start;
      console.log(`${green}DELETE ${endpoint} took ${duration}ms${reset}`);
      console.log(
        `${yellow}Response:${reset} ${JSON.stringify(response.data)}`
      );
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(
        `${red}DELETE ${endpoint} failed after ${duration}ms:${reset} ${error.message}`
      );
      if (error.response) {
        console.error(
          `${red}Status ${error.response.status}:${reset} ${JSON.stringify(
            error.response.data
          )}`
        );
      }
      throw error;
    }
  }
  static async patch(endpoint, data = {}, options = {}) {
    const start = Date.now();
    try {
      // Handle both old format (headers as second param) and new format (options object)
      const config = options.headers ? options : { headers: options };
      const response = await instance.patch(endpoint, data, config);
      const duration = Date.now() - start;
      console.log(`${green}PATCH ${endpoint} took ${duration}ms${reset}`);
      console.log(
        `${yellow}Response:${reset} ${JSON.stringify(response.data)}`
      );
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(
        `${red}PATCH ${endpoint} failed after ${duration}ms:${reset} ${error.message}`
      );
      console.error(
        `${red}Request Body:${reset} ${JSON.stringify(data, null, 2)}`
      );
      if (error.response) {
        console.error(
          `${red}Status ${error.response.status}:${reset} ${JSON.stringify(
            error.response.data
          )}`
        );
        return error.response;
      }
      return {
        status: 600,
        data: {
          status: false,
          message: error.message || "Unknown error occurred",
          code: "NETWORK_ERROR",
        },
      };
    }
  }
}

export default ApiClient;
