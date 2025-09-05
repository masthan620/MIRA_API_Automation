import { Given, Then, Before } from "@wdio/cucumber-framework";
import serviceFactory from "../../services/service-factory";
import { getResponseData } from "../helpers/responseValidator.js";

import {
  getFinalRequestBody,
  buildEndpoint,
  addQueryParams,
  waitFor,
  resolveValue,
  isPathParamKey,
  processParams,
  processTableOverrides,
  verifyUpdatedFields,
  verifyUnchangedFields,
  verifyTimestamps,
} from "../helpers/stepHelpers.js";
import {
  red,
  green,
  yellow,
  reset,
  makeTimedRequest,
} from "../../utils/apiClient.js";
import {
  getResourceConfig,
  injectID,
  storeCreatedResource,
  getCreatedResourceId,
  isPlural,
  convertPluralToSingular,
  getTableNameForResource,
  fieldMappings,
  verifyAll,
  verifyAllByQuery,
  verifyRecords,
  getResourceIdAndEndpoint,
  getUpdateKey,
  storeUpdateData,
  storeBeforeUpdateData,
} from "../helpers/testHelpers.js";
import { fetchUsername,getUserDetails } from "../helpers/userResolver.js";

// Create resource step (without table)
Then(
  /^as a (developer|admin|teacher), I create (a|an) (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ)$/,
  async function (user_type, article, resource_type) {
    const config = getResourceConfig(resource_type);
    const requestBody = getFinalRequestBody(config.baseKey);
    const finalRequestBody = injectID(this, resource_type, requestBody, true);

    this.response = await makeTimedRequest(
      this,
      "post",
      config.endpoint,
      finalRequestBody
    );
    const responseData = getResponseData(this.response);

    this.finalRequestBody = finalRequestBody;
    storeCreatedResource(this, resource_type);
    storeBeforeUpdateData(this, resource_type, responseData);
  }
);

// Create resource step (with table)
Then(
  /^as a (developer|admin|teacher), I create (a|an) (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ):$/,
  async function (user_type, article, resource_type, table) {
    const config = getResourceConfig(resource_type);
    const requestBody = getFinalRequestBody(config.baseKey, table);
    const finalRequestBody = injectID(this, resource_type, requestBody, true);

    this.response = await makeTimedRequest(
      this,
      "post",
      config.endpoint,
      finalRequestBody
    );
    const responseData = getResponseData(this.response);

    this.finalRequestBody = finalRequestBody;
    storeCreatedResource(this, resource_type);
    storeBeforeUpdateData(this, resource_type, responseData);
  }
);

// Update resource step (without table)
Then(
  /^as a (developer|admin|teacher), I update the (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ|FAQ Likes|Resource Likes)(?: with id "([^"]*)")?$/,
  async function (user_type, resource_type, custom_id) {
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const { resourceId, endpoint, method } = getResourceIdAndEndpoint(
      resource_type,
      custom_id,
      this
    );
    const updateKey = getUpdateKey(resource_type);
    const requestBody = getFinalRequestBody(updateKey);
    const finalRequestBody = injectID(this, resource_type, requestBody);

    this.expectedUpdateData = finalRequestBody;
    this.actualRequestBody = finalRequestBody;

    this.response = await makeTimedRequest(
      this,
      method,
      endpoint,
      finalRequestBody
    );
    const responseData = getResponseData(this.response);
    storeUpdateData(this, resource_type, responseData);
  }
);

// Update resource step (with table)
Then(
  /^as a (developer|admin|teacher), I update the (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ|FAQ Likes|Resource Likes):$/,
  async function (user_type, resource_type, table) {
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const { resourceId, endpoint, method } = getResourceIdAndEndpoint(
      resource_type,
      null,
      this
    );
    const updateKey = getUpdateKey(resource_type);
    const requestBody = getFinalRequestBody(updateKey, table);
    const finalRequestBody = injectID(this, resource_type, requestBody);

    this.expectedUpdateData = finalRequestBody;
    this.actualRequestBody = finalRequestBody;

    this.response = await makeTimedRequest(
      this,
      method,
      endpoint,
      finalRequestBody
    );
    const responseData = getResponseData(this.response);
    storeUpdateData(this, resource_type, responseData);
    console.log("afterUpdateData", this.afterUpdateData);
  }
);

Then(
  /^as a developer, I delete the (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ)(?: with id "([^"]*)")?$/,
  async function (resource_type, custom_id) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const config = getResourceConfig(resource_type);

    let resourceId;
    if (custom_id) {
      resourceId = custom_id;
    } else {
      try {
        resourceId = getCreatedResourceId(this, resource_type);
      } catch (error) {
        // If we can't find the created resource ID, try to get it from the last response
        console.log(
          `${yellow} Warning: Could not find created ${resource_type} ID in context, trying to get from last response`
        );
        const lastResponse = getResponseData(this.response);
        if (lastResponse && lastResponse.data) {
          if (
            Array.isArray(lastResponse.data) &&
            lastResponse.data.length > 0
          ) {
            resourceId = lastResponse.data[0][config.idField];
          } else if (lastResponse.data[config.idField]) {
            resourceId = lastResponse.data[config.idField];
          }
        }
        if (!resourceId) {
          throw new Error(
            `No ${resource_type} ID found in context or last response`
          );
        }
      }
    }

    const endpoint = `${config.endpoint}/${resourceId}`;
    this.response = await makeTimedRequest(this, "delete", endpoint);
  }
);

Then(
  /^as (a|an) (admin|teacher|developer), I get (?:all )?(FAQ Categories|FAQ Subcategories|Marketing Carousels|Quotes|Issues|FAQs|Likes|FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ|Resource)(?: with ID "([^"]*)")?$/,
  async function (article, user_type, resource_type, specificId) {
    const isGetAll = isPlural(resource_type);
    const singularResourceType = isGetAll
      ? convertPluralToSingular(resource_type)
      : resource_type;
    const config = getResourceConfig(singularResourceType);
    let endpoint = config.endpoint;
    let resourceId = null;

    if (!isGetAll) {
      if (singularResourceType === "Likes") {
        // For Likes, we need the FAQ resource ID
        resourceId =
          specificId ||
          this.current_resource_id ||
          getCreatedResourceId(this, "FAQ");
        console.log("resourceId", resourceId);
        if (!resourceId) {
          throw new Error(
            "No FAQ resource ID found for Likes. Please create a FAQ first."
          );
        }
      } else if (specificId === undefined || specificId === null) {
        // No ID provided → try to get from created resources first
        try {
          resourceId = getCreatedResourceId(this, singularResourceType);
          console.log("getCreatedResourceId", resourceId);
        } catch (error) {
          // If no created resource found, try to get from the last response
          // This handles cases where the FAQ was retrieved via query parameters
          if (this.lastResponseData && this.lastResponseData.data) {
            const lastData = this.lastResponseData.data;
            if (Array.isArray(lastData) && lastData.length > 0) {
              // Get the first FAQ ID from the last response
              resourceId = lastData[0][config.idField];
              console.log(`Using FAQ ID from last response: ${resourceId}`);
            }
          }

          // Fallback: try to get from the last requested resource ID
          if (!resourceId && this.lastRequestedResourceId) {
            resourceId = this.lastRequestedResourceId;
          }

          if (!resourceId) {
            throw new Error(
              `No ${singularResourceType} ID found in context or last response`
            );
          }
        }
      } else {
        // ID was explicitly given (even if it's "", " ", "null")
        console.log("specificId", specificId);
        resourceId = specificId;
      }

      endpoint = `${config.endpoint}/${encodeURIComponent(resourceId)}`;
    }
    this.response = await makeTimedRequest(this, "get", endpoint);
    const responseData = getResponseData(this.response);

    // Store both the raw data and the FAQ-specific data
    this.finalRequestBody = responseData.data;

    // Store the last response data for potential use in subsequent steps
    this.lastResponseData = responseData;

    // For FAQ responses, also store the FAQ data separately
    if (singularResourceType === "FAQ" && responseData.data?.faq) {
      this.finalRequestBody = responseData.data.faq;
    }

    // Store the resource ID used in the request for later verification
    if (resourceId) {
      this.lastRequestedResourceId = resourceId;
      this.lastRequestedResourceType = singularResourceType;
      console.log(
        `${yellow} Stored requested resource ID: ${resourceId} for ${singularResourceType}`
      );
    }
  }
);

Then(
  /^as (a|an) (admin|teacher|developer), I get (?:all )?(FAQ Categories|FAQ Subcategories|Marketing Carousels|Quotes|Issues|FAQs|FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ|Resource) with (path parameters|query parameters|parameters):$/,
  async function (article, user_type, resource_type, paramType, table) {
    const isGetAll = isPlural(resource_type);
    const singularResource = isGetAll
      ? convertPluralToSingular(resource_type)
      : resource_type;

    const config = getResourceConfig(singularResource);
    let endpoint = config.endpoint;

    // Process params using shared utility
    const { pathParams, queryParams } = processParams(this, table, paramType);

    if (!isGetAll && Object.keys(pathParams).length > 0) {
      endpoint = buildEndpoint(endpoint, pathParams);
    }

    if (Object.keys(queryParams).length > 0) {
      endpoint = addQueryParams(endpoint, queryParams);
      this.lastRequestQueryParams = { ...queryParams };
      console.log(
        `${yellow} Stored query params:`,
        this.lastRequestQueryParams
      );
    }
    this.response = await makeTimedRequest(this, "get", endpoint);
    const responseData = getResponseData(this.response);

    // Store both the raw data and the FAQ-specific data
    this.finalRequestBody = responseData.data;

    // Store the last response data for potential use in subsequent steps
    this.lastResponseData = responseData;

    // For FAQ responses, also store the FAQ data separately
    if (singularResource === "FAQ" && responseData.data?.faq) {
      this.finalRequestBody = responseData.data.faq;
    }

    // Store the resource ID from the response for later verification
    // For query parameter requests, we need to extract the ID from the response data
    if (
      responseData.data &&
      Array.isArray(responseData.data) &&
      responseData.data.length > 0
    ) {
      const firstItem = responseData.data[0];
      const config = getResourceConfig(singularResource);
      if (firstItem[config.idField]) {
        this.lastRequestedResourceId = firstItem[config.idField];
        console.log(
          `${yellow} Stored requested resource ID: ${this.lastRequestedResourceId} for ${singularResource} from query response`
        );
      }
    }
  }
);

Then(
  /^I verify the (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ) has been updated correctly$/,
  async function (resource_type) {
    const beforeData = this.beforeUpdateData?.[resource_type];
    const afterData = this.afterUpdateData?.[resource_type];
    const expectedData = this.expectedUpdateData;
    const actualRequestBody = this.actualRequestBody;

    verifyUpdatedFields(expectedData, afterData);
    verifyUnchangedFields(
      beforeData,
      afterData,
      expectedData,
      actualRequestBody
    );
    verifyTimestamps(beforeData, afterData);

    console.log(`${green} ✅ ${resource_type} data updated correctly`);
  }
);

Then(
  /^as a developer, I verify the (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ) was created by the logged-in user$/,
  async function (resource_type) {
    let responseData;

    // Check if we have userIssues (from fetch issues by user step)
    if (
      this.userIssues &&
      Array.isArray(this.userIssues) &&
      this.userIssues.length > 0
    ) {
      responseData = this.userIssues[0]; // Take first issue
    } else {
      // Fall back to regular response data
      responseData = getResponseData(this.response).data;

      // Handle nested issues array structure
      if (
        responseData &&
        responseData.issues &&
        Array.isArray(responseData.issues) &&
        responseData.issues.length > 0
      ) {
        responseData = responseData.issues[0]; // Take first issue from nested array
      }
    }

    const { created_by } = responseData;
    if (!created_by)
      throw new Error(`${resource_type} response missing created_by`);

    const { current_username } = this;
    const mapping = getUserDetails(current_username);

    const expectedUserId = mapping.user_id;

    if (created_by !== expectedUserId)
      throw new Error(
        `${resource_type} created_by mismatch. Expected: ${expectedUserId} (${current_username}), Got: ${created_by}`
      );

    console.log(
      `${green} ✅ ${resource_type} created_by matches logged-in user: ${current_username} (${expectedUserId})`
    );
  }
);

Then(
  /^as a developer, I verify (?:the (created|received) )?(all )?(FAQ Categories|FAQ Subcategories|Marketing Carousels|Quotes|Issues|FAQs|FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ)(?: in (database|response match database records))?$/,
  async function (action, allFlag, resourceType, location) {
    const isGetAll = !!allFlag;
    const singular = isGetAll
      ? convertPluralToSingular(resourceType)
      : resourceType;

    const { endpoint, idField } = getResourceConfig(singular);
    const tableName = getTableNameForResource(singular);
    const dbName = "support_engagement";

    if (isGetAll) {
      const responseData = getResponseData(this.response);
      const apiRecords = responseData.data;

      // For received resources with query parameters, use verifyRecords with stored query params
      if (
        action === "received" &&
        this.lastRequestQueryParams &&
        Object.keys(this.lastRequestQueryParams).length > 0
      ) {
        await verifyRecords({
          resourceName: singular,
          idField,
          dbName,
          tableName,
          apiRecords,
          queryParams: this.lastRequestQueryParams,
        });
      } else {
        await verifyAll(singular, idField, dbName, tableName, apiRecords);
      }
    } else {
      let resourceId;
      let apiRecord;

      // If it's a "received" resource (from GET request), get ID from response
      if (action === "received") {
        apiRecord = getResponseData(this.response).data;

        // Handle case where response data is an array (GET all with filter)
        if (Array.isArray(apiRecord) && apiRecord.length > 0) {
          // For array responses, we need to verify all items, not just one
          // Store the array for verification and use the first item's ID for database lookup
          const firstItem = apiRecord[0];
          resourceId = firstItem[idField];

          // If we have an array response, we should verify all items, not just one
          if (!resourceId) {
            // For individual GET requests, the response might not include the ID field
            // Use the last requested resource ID if available
            if (this.lastRequestedResourceId) {
              resourceId = this.lastRequestedResourceId;
            } else {
              throw new Error(
                `No ${idField} found in first array item for ${singular}. First item: ${JSON.stringify(
                  firstItem
                )}`
              );
            }
          }

          // For array responses, we should verify the first item exists in the database
          // This ensures we're checking a real FAQ that was returned by the API
        } else {
          // Single item response
          resourceId = apiRecord[idField];
        }

        // If not found in response, try to get from context (for individual GET requests)
        if (!resourceId) {
          // First try to get from the last requested resource ID (for GET requests)
          if (this.lastRequestedResourceId) {
            resourceId = this.lastRequestedResourceId;
            console.log(
              `${yellow} Using last requested resource ID: ${resourceId} for ${singular}`
            );
          } else {
            // Try to get from created resources as a fallback
            try {
              resourceId = getCreatedResourceId(this, singular);
            } catch (error) {
              // For received resources, if we still don't have an ID, try to get it from the current response context
              // This handles cases where the response doesn't include the ID field
              console.log(
                `${yellow} Warning: Could not get resource ID from context, trying response data`
              );

              // Try to extract ID from the current response
              if (this.response && this.response.data) {
                const currentResponseData = getResponseData(this.response);
                if (currentResponseData && currentResponseData.data) {
                  if (
                    Array.isArray(currentResponseData.data) &&
                    currentResponseData.data.length > 0
                  ) {
                    resourceId = currentResponseData.data[0][idField];
                    console.log(
                      `Using ID from current response: ${resourceId}`
                    );
                  } else if (currentResponseData.data[idField]) {
                    resourceId = currentResponseData.data[idField];
                    console.log(
                      `Using ID from current response data: ${resourceId}`
                    );
                  }
                }
              }

              if (!resourceId) {
                throw new Error(
                  `No ${idField} found in response or context for ${singular}. Response data: ${JSON.stringify(
                    apiRecord
                  )}`
                );
              }
            }
          }
        }
      } else {
        // For "created" resources, get ID from context
        resourceId = getCreatedResourceId(this, singular);
        apiRecord = getResponseData(this.response).data;

        // Handle nested FAQ response structure (data.faq)
        if (singular === "FAQ" && apiRecord && apiRecord.faq) {
          apiRecord = apiRecord.faq;
        }
      }

      const apiRecordsArray = Array.isArray(apiRecord)
        ? apiRecord
        : [apiRecord];
      // For array responses, we want to verify all records exist in the database
      // For single responses, we can use the specific ID filter
      if (Array.isArray(apiRecord) && apiRecord.length > 0) {
        // Check if we have stored query parameters from the GET request
        let dbQueryParams = {};
        if (
          this.lastRequestQueryParams &&
          Object.keys(this.lastRequestQueryParams).length > 0
        ) {
          // Use the stored query parameters for database verification
          // This ensures we're checking the same subset of data that was returned by the API
          dbQueryParams = { ...this.lastRequestQueryParams };
          console.log(
            `${yellow} Using stored query params for DB verification:`,
            dbQueryParams
          );
        } else {
          // Fallback: Use the first item's ID as a starting point for database lookup
          const firstItemId = apiRecord[0][idField];
          if (firstItemId) {
            dbQueryParams = { [idField]: firstItemId };
          }
        }

        await verifyRecords({
          resourceName: singular,
          idField,
          dbName,
          tableName,
          apiRecords: apiRecordsArray,
          queryParams: dbQueryParams,
        });
      } else {
        // Single record - use specific ID filter
        await verifyRecords({
          resourceName: singular,
          idField,
          dbName,
          tableName,
          apiRecords: apiRecordsArray,
          queryParams: { [idField]: resourceId },
        });
      }
    }
  }
);

// Verify record is deleted from database
Then(
  /^I verify the (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ) is deleted from database$/,
  async function (resource_type) {
    const config = getResourceConfig(resource_type);
    const dbName = "support_engagement";
    const tableName = getTableNameForResource(resource_type);
    const resourceId = getCreatedResourceId(this, resource_type);
    const idField = config.idField;
    const results = await serviceFactory.queryTable(dbName, tableName, {
      [idField]: resourceId,
    });

    if (results && results.length > 0) {
      throw new Error(
        `${resource_type} with ${idField} "${resourceId}" was not deleted from database`
      );
    }
  }
);

// Helper function to map placeholder names to resource types
function getResourceTypeFromPlaceholder(placeholder) {
  const placeholderMap = {
    category_id: "FAQ Category",
    sub_category_id: "FAQ Subcategory",
    faq_id: "FAQ",
    quote_id: "Quote",
    issue_id: "Issue",
    carousel_id: "Marketing Carousel",
    resource_id: "Resource",
    banner_id: "Banner",
  };

  return placeholderMap[placeholder] || null;
}

// Helper function to check if a date is within active range
function isDateInActiveRange(activeFrom, activeTo) {
  const currentDate = new Date();
  const fromDate = new Date(activeFrom);
  const toDate = new Date(activeTo);

  return currentDate >= fromDate && currentDate <= toDate;
}

// Validate that all returned items are currently active based on active_from and active_to dates
Then(
  /^I verify all returned (FAQ Categories|FAQ Subcategories|Marketing Carousels|Quotes|Issues|FAQs|FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ) are currently active$/,
  async function (resourceType) {
    const responseData = getResponseData(this.response);
    const items = responseData.data;

    if (!Array.isArray(items)) {
      throw new Error(`Response data is not an array for ${resourceType}`);
    }

    if (items.length === 0) {
      console.log(`${yellow} No ${resourceType} returned to validate`);
      return;
    }

    const currentDate = new Date();

    // Validation helper
    const validateItem = (item, index) => {
      const itemId = item.carousel_item_id || item.id || `item_${index}`;
      const { active_from, active_to } = item;

      if (!active_from || !active_to) {
        return `${resourceType} ${itemId} missing active_from or active_to dates`;
      }

      const fromDate = new Date(active_from);
      const toDate = new Date(active_to);

      if (fromDate >= toDate) {
        return `${resourceType} ${itemId} has invalid date range. active_from (${active_from}) should be before active_to (${active_to})`;
      }
      if (currentDate < fromDate) {
        return `${resourceType} ${itemId} is not yet active. active_from: ${active_from}, current: ${currentDate.toISOString()}`;
      }
      if (currentDate > toDate) {
        return `${resourceType} ${itemId} has expired. active_to: ${active_to}, current: ${currentDate.toISOString()}`;
      }

      return null; // valid
    };

    const validationErrors = items
      .map((item, index) => validateItem(item, index))
      .filter(Boolean);

    if (validationErrors.length > 0) {
      throw new Error(
        `Active date validation failed for ${resourceType}:\n${validationErrors.join(
          "\n"
        )}`
      );
    }
  }
);

// Step to fetch today's quote with is_shuffle parameter
Then(
  /^as a (developer|admin|teacher), I fetch today's quote(?: with is_shuffle "([^"]*)")?$/,
  async function (user_type, is_shuffle) {
    const config = getResourceConfig("Today Quote");
    let endpoint = config.endpoint;
    if (is_shuffle !== undefined) {
      endpoint += `?is_shuffle=${is_shuffle}`;
    }
    this.response = await makeTimedRequest(this, "get", endpoint);
  }
);

// Step to create a quote with current date
Then(
  /^as a (developer|admin|teacher), I create a quote with current date$/,
  async function (user_type) {
    const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    const baseKey = "quote";
    const requestBody = getFinalRequestBody(baseKey);

    // Update the quote_date to current date
    requestBody.quote_date = currentDate;

    const config = getResourceConfig("Quote");
    this.response = await makeTimedRequest(
      this,
      "post",
      config.endpoint,
      requestBody
    );

    // Store the created quote ID for later use
    const responseData = getResponseData(this.response);
    storeCreatedResource(this, "Quote");
  }
);

Then(
  /^as a (developer|admin|teacher), I fetch issues created by user "([^"]*)"$/,
  async function (user_type, username_variable) {
    if (!process.env.ISSUES_BY_USER_ENDPOINT) {
      throw new Error(
        "ISSUES_BY_USER_ENDPOINT environment variable is not defined"
      );
    }
    let user_details = getUserDetails(username_variable);
    console.log("user_details", user_details);
    let user_id = user_details.user_id;
    const endpoint = buildEndpoint(process.env.ISSUES_BY_USER_ENDPOINT, {
      user_id,
    });
    this.response = await makeTimedRequest(this, "get", endpoint);
    const responseData = getResponseData(this.response);
    this.userIssues = responseData.data || [];
  }
);

