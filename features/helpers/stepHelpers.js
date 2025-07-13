import { green, red, yellow } from "../../utils/apiClient.js";
import { applyOverrides, loadRequestBody } from "../helpers/utilityCommands.js";

export function getFinalRequestBody(bodyKey, table = null) {
  let base = {};
  if (bodyKey) {
    base = loadRequestBody(bodyKey);
    base = JSON.parse(JSON.stringify(base)); // Deep clone to avoid mutation
  }

  if (table) {
    const overrides = processTableOverrides(table);
    return applyOverrides(base, overrides);
  }

  return base;
}

// Common function for processing table overrides
export function processTableOverrides(table) {
  if (!table || !table.raw || typeof table.raw !== "function") {
    throw new Error(
      "Table must be a valid Cucumber DataTable with raw() method"
    );
  }

  const rawTable = table.raw();

  if (!Array.isArray(rawTable) || rawTable.length === 0) {
    throw new Error("Table data must be a non-empty array");
  }

  // Convert table rows to key-value pairs
  const overrides = {};
  for (const [key, value] of rawTable) {
    if (key && value !== undefined) {
      // Try to parse JSON values, otherwise keep as string
      try {
        overrides[key] = JSON.parse(value);
      } catch {
        overrides[key] = value;
      }
    }
  }

  return overrides;
}

// Common function for endpoint template replacement
export function buildEndpoint(template, replacements = {}) {
  if (!template || typeof template !== "string") {
    throw new Error("Endpoint template must be a valid non-empty string");
  }
  if (!replacements || typeof replacements !== "object") {
    throw new Error("Replacements must be a valid object");
  }

  let endpoint = template;
  console.log(`${yellow} Building endpoint from template: ${template}`);
  console.log(`${yellow} Replacements:`, JSON.stringify(replacements, null, 2));

  // Replace placeholders (including empty strings for testing)
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (value === undefined || value === null) {
      console.warn(
        `⚠️ Replacement value for '${placeholder}' is ${value}, skipping`
      );
      continue;
    }

    // Handle empty strings explicitly for testing scenarios
    let encodedValue;
    if (value === "") {
      console.log(
        `${yellow} Empty string detected for placeholder '${placeholder}' - allowing for test scenario`
      );
      encodedValue = ""; // Keep as empty string for testing
    } else {
      encodedValue = encodeURIComponent(value);
    }

    const oldEndpoint = endpoint;
    endpoint = endpoint.replace(`{${placeholder}}`, encodedValue);
    console.log(
      `${yellow} Replaced '{${placeholder}}' with '${encodedValue}': ${oldEndpoint} → ${endpoint}`
    );
  }

  // For testing purposes, just warn about unreplaced placeholders instead of throwing
  const unreplacedPlaceholders = endpoint.match(/\{[^}]+\}/g);
  if (unreplacedPlaceholders) {
    console.warn(
      `⚠️ Unreplaced placeholders found in endpoint '${endpoint}': ${unreplacedPlaceholders.join(
        ", "
      )}`
    );
  }

  console.log(`${yellow} Final built endpoint: ${endpoint}`);
  return endpoint;
}

// Common function for adding query parameters
export function addQueryParams(endpoint, params = {}) {
  if (!endpoint || typeof endpoint !== "string") {
    throw new Error("Endpoint must be a valid non-empty string");
  }

  if (!params || typeof params !== "object") {
    throw new Error("Parameters must be a valid object");
  }

  const queryParams = [];

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      );
    }
  }

  if (queryParams.length > 0) {
    const separator = endpoint.includes("?") ? "&" : "?";
    endpoint += `${separator}${queryParams.join("&")}`;
  }

  return endpoint;
}

// Common function for waiting/delays
export async function waitFor(milliseconds) {
  if (!Number.isInteger(milliseconds) || milliseconds < 0) {
    throw new Error("Milliseconds must be a non-negative integer");
  }

  if (milliseconds > 0) {
    console.log(`${yellow} Waiting ${milliseconds}ms...`);
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
    console.log(`${green} Wait completed`);
  }
}

// Utility function for retrying operations
export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  if (typeof operation !== "function") {
    throw new Error("Operation must be a function");
  }

  if (!Number.isInteger(maxRetries) || maxRetries < 1) {
    throw new Error("Max retries must be a positive integer");
  }

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${yellow} Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`${red} Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        await waitFor(delay);
      }
    }
  }

  throw new Error(
    `Operation failed after ${maxRetries} attempts. Last error: ${lastError.message}`
  );
}
