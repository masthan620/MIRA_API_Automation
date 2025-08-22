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


// Utility to resolve {placeholders} from multiple sources
export function resolveValue(ctx, key, value) {
  if (!(value.startsWith("{") && value.endsWith("}"))) {
    console.log(`${yellow} Using hardcoded value for ${key}: ${value}`);
    return value;
  }

  const savedKey = value.slice(1, -1);
  const sources = [
    ctx.created_resources,
    ctx.finalRequestBody,
    ctx,
    global.testData,
  ];

  for (const source of sources) {
    if (source && savedKey in source) {
      const resolved = source[savedKey];
      console.log(`${yellow} Resolved ${key} from saved value ${savedKey}: ${resolved}`);
      return resolved;
    }
  }
  throw new Error(`Could not resolve saved value: ${savedKey}`);
}

// Utility to check if key should be path param
export function isPathParamKey(key) {
  return /^(id|resource_id|carousel_id|category_id|subcategory_id|quote_id|issue_id|faq_id|user_id|device_id)$/i.test(
    key
  );
}

// Process raw table into { pathParams, queryParams }
export function processParams(ctx, table, paramType) {
  const pathParams = {};
  const queryParams = {};

  if (!table?.raw) return { pathParams, queryParams };

  for (const [key, rawValue] of table.raw()) {
    const value = resolveValue(ctx, key, rawValue);
    const usePath = paramType === "path parameters" || isPathParamKey(key);

    if (usePath) {
      pathParams[key] = value;
      console.log(`${green} Added ${key} as path parameter: ${value}`);
    } else {
      queryParams[key] = value;
      console.log(`${green} Added ${key} as query parameter: ${value}`);
    }
  }

  return { pathParams, queryParams };
}


// Utility: compare arrays
function verifyArray(field, expected, actual) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${field} not updated correctly. Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`
    );
  }
}

// Utility: compare booleans
function verifyBoolean(field, expected, actual) {
  if (actual !== expected) {
    throw new Error(`${field} not updated correctly. Expected: ${expected}, Got: ${actual}`);
  }
}

// Utility: compare date fields (ignoring timezones)
function verifyDate(field, expected, actual) {
  const expectedDatePart = expected.split(" ")[0];
  const actualDatePart = actual.split("T")[0];

  if (expectedDatePart !== actualDatePart) {
    throw new Error(
      `${field} date part not updated correctly. Expected: ${expectedDatePart}, Got: ${actualDatePart}`
    );
  }
  console.log(`${green} ✅ Date field ${field} matches: ${expectedDatePart}`);
}

// Utility: compare primitive values
function verifyPrimitive(field, expected, actual) {
  if (expected !== actual) {
    throw new Error(`${field} not updated correctly. Expected: ${expected}, Got: ${actual}`);
  }
}

// Main field verification
export function verifyUpdatedFields(expectedData, afterData) {
  for (const field in expectedData) {
    if (!(field in afterData)) continue;

    const expected = expectedData[field];
    const actual = afterData[field];

    // Skip __REMOVE__ fields - they are handled by verifyUnchangedFields
    if (expected === "__REMOVE__") continue;

    if (Array.isArray(expected)) verifyArray(field, expected, actual);
    else if (typeof expected === "boolean")
      verifyBoolean(field, expected, actual);
    else if (/_from$|_to$|_at$|date/.test(field))
      verifyDate(field, expected, actual);
    else verifyPrimitive(field, expected, actual);
  }
}

// Verify unchanged fields
export function verifyUnchangedFields(beforeData, afterData, expectedData) {
  // Only check fields that are explicitly mentioned in the table
  // This prevents checking fields that come from the base template but weren't in the test table
  for (const field in expectedData) {
    // Skip metadata fields
    if (["retrieved_at", "updated_at"].includes(field)) continue;

    // If field was marked for removal (__REMOVE__), verify it became null
    if (expectedData[field] === "__REMOVE__") {
      if (afterData[field] !== null) {
        throw new Error(
          `${field} should be null after removal. Got: ${afterData[field]}`
        );
      }
      console.log(
        `${green} ✅ Field ${field} was successfully removed (set to null)`
      );
    }
  }

  // For fields not explicitly mentioned in the table, verify they remained unchanged
  for (const field in beforeData) {
    // Skip metadata fields
    if (["retrieved_at", "updated_at"].includes(field)) continue;

    // Skip fields that were explicitly mentioned in the table
    if (field in expectedData) continue;

    // For fields not in the update request, verify they remained unchanged
    if (beforeData[field] !== afterData[field]) {
      throw new Error(
        `${field} should remain unchanged. Before: ${beforeData[field]}, After: ${afterData[field]}`
      );
    }
    console.log(`${green} ✅ Field ${field} remained unchanged: ${beforeData[field]}`);
  }
}

// Verify metadata timestamps
export function verifyTimestamps(beforeData, afterData) {
  if ("created_at" in beforeData && "created_at" in afterData) {
    if (afterData.created_at !== beforeData.created_at) {
      throw new Error(
        `created_at should not change. Before: ${beforeData.created_at}, After: ${afterData.created_at}`
      );
    }
  }

  if ("updated_at" in beforeData && "updated_at" in afterData) {
    if (afterData.updated_at === beforeData.updated_at) {
      throw new Error(
        `updated_at should change. Before: ${beforeData.updated_at}, After: ${afterData.updated_at}`
      );
    }

    if ("created_at" in afterData) {
      const createdDate = new Date(afterData.created_at);
      const updatedDate = new Date(afterData.updated_at);
      if (updatedDate <= createdDate) {
        throw new Error(
          `updated_at should be more recent than created_at. created_at: ${afterData.created_at}, updated_at: ${afterData.updated_at}`
        );
      }
    }
  }
}