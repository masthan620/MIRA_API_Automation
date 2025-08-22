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
  verifySingle,
} from "../helpers/testHelpers.js";

Given(
  /^as a developer, I create (a|an) (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ)$/,
  async function (article, resource_type) {
    let config = getResourceConfig(resource_type);
    let requestBody = getFinalRequestBody(config.baseKey);
    requestBody = injectID(this, resource_type, requestBody);
    await makeTimedRequest(this, "post", config.endpoint, requestBody);
    storeCreatedResource(this, resource_type);
    this.finalRequestBody = requestBody;
    const responseData = getResponseData(this.response);
    if (!this.beforeUpdateData) {
      this.beforeUpdateData = {};
    }
    this.beforeUpdateData[resource_type] = {
      ...responseData.data,
      retrieved_at: new Date().toISOString(),
    };
  }
);
Given(
  /^as a developer, I create (a|an) (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ):$/,
  async function (article, resource_type, table) {
    let config = getResourceConfig(resource_type);
    let requestBody = getFinalRequestBody(config.baseKey, table);
    this.finalRequestBody = requestBody;
    await makeTimedRequest(this, "post", config.endpoint, requestBody);
    storeCreatedResource(this, resource_type);
    const responseData = getResponseData(this.response);
    requestBody = injectID(this, resource_type, requestBody);
    if (!this.beforeUpdateData) {
      this.beforeUpdateData = {};
    }
    this.beforeUpdateData[resource_type] = {
      ...responseData.data,
      retrieved_at: new Date().toISOString(),
    };
  }
);
Given(
  /^as a developer, I update the (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ)(?: with id "([^"]*)")?$/,
  async function (resource_type,custom_id) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const config = getResourceConfig(resource_type);
    const resourceId = custom_id || getCreatedResourceId(this, resource_type);
    const endpoint = `${config.endpoint}/${resourceId}`;
    const updateKey = `${config.baseKey}-update`;
    let requestBody = getFinalRequestBody(updateKey);
    this.expectedUpdateData = requestBody;
    await makeTimedRequest(this, "patch", endpoint, requestBody);
    const responseData = getResponseData(this.response);
    if (!this.afterUpdateData) {
      this.afterUpdateData = {};
    }
    this.afterUpdateData[resource_type] = {
      ...responseData.data,
      retrieved_at: new Date().toISOString(),
    };
  }
);
Given(
  /^as a developer, I update the (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ):$/,
  async function (resource_type,table) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const config = getResourceConfig(resource_type);
    const resourceId = getCreatedResourceId(this, resource_type);
    const endpoint = `${config.endpoint}/${resourceId}`;
    const updateKey = `${config.baseKey}-update`;
    let requestBody = getFinalRequestBody(updateKey, table);

    // Store the original table data (with __REMOVE__ values) for verification
    this.expectedUpdateData = processTableOverrides(table);

    await makeTimedRequest(this, "patch", endpoint, requestBody);
    const responseData = getResponseData(this.response);
    if (!this.afterUpdateData) {
      this.afterUpdateData = {};
    }
    this.afterUpdateData[resource_type] = {
      ...responseData.data,
      retrieved_at: new Date().toISOString(),
    };
    console.log("afterUpdateData", this.afterUpdateData);
  }
);

Given(
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
    await makeTimedRequest(this, "delete", endpoint);
  }
);

Given(
  /^as (a|an) (admin|teacher|developer), I get (?:all )?(FAQ Categories|FAQ Subcategories|Marketing Carousels|Quotes|Issues|FAQs|FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ)(?: with ID "([^"]*)")?$/,
  async function (article, user_type, resource_type, specificId) {
    const isGetAll = isPlural(resource_type);
    const singularResourceType = isGetAll
      ? convertPluralToSingular(resource_type)
      : resource_type;
    const config = getResourceConfig(singularResourceType);
    let endpoint = config.endpoint;
    let resourceId = null;

    if (!isGetAll) {
      if (specificId === undefined || specificId === null) {
        // No ID provided → use the one from create step
        console.log(
          "getCreatedResourceId",
          getCreatedResourceId(this, singularResourceType)
        );
        resourceId = getCreatedResourceId(this, singularResourceType);
        if (!resourceId) {
          throw new Error(`No ${singularResourceType} ID found in context`);
        }
      } else {
        // ID was explicitly given (even if it's "", " ", "null")
        console.log("specificId", specificId);
        resourceId = specificId;
      }

      endpoint = `${config.endpoint}/${encodeURIComponent(resourceId)}`;
    }
    await makeTimedRequest(this, "get", endpoint);
    this.finalRequestBody = getResponseData(this.response).data;
  }
);

Given(
  /^as (a|an) (admin|teacher|developer), I get (?:all )?(FAQ Categories|FAQ Subcategories|Marketing Carousels|Quotes|Issues|FAQs|FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ) with (path parameters|query parameters|parameters):$/,
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
    await makeTimedRequest(this, "get", endpoint);
    this.finalRequestBody = getResponseData(this.response).data;
  }
);

Then(
  /^I verify the (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ) has been updated correctly$/,
  async function (resource_type) {
    const beforeData = this.beforeUpdateData?.[resource_type];
    const afterData = this.afterUpdateData?.[resource_type];
    const expectedData = this.expectedUpdateData;

    verifyUpdatedFields(expectedData, afterData);
    verifyUnchangedFields(beforeData, afterData, expectedData);
    verifyTimestamps(beforeData, afterData);

    console.log(`${green} ✅ ${resource_type} data updated correctly`);
  }
);

Then(
  /^I verify the (FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ) was created by the logged-in user$/,
  async function (resource_type) {
    const { created_by } = getResponseData(this.response).data;
    if (!created_by) throw new Error(`${resource_type} response missing created_by`);

    const { current_username } = this;
    const mapping = global.testData?.user_id_to_username_mapping;
    if (!current_username || !mapping) throw new Error("Missing login context or user mapping");

    const expectedUserId = Object.entries(mapping).find(([, u]) => u === current_username)?.[0];
    if (!expectedUserId) throw new Error(`No user ID for username: ${current_username}`);

    if (created_by !== expectedUserId)
      throw new Error(`${resource_type} created_by mismatch. Expected: ${expectedUserId} (${current_username}), Got: ${created_by}`);

    console.log(`${green} ✅ ${resource_type} created_by matches logged-in user: ${current_username} (${expectedUserId})`);
  }
);

Then(
  /^as a developer, I verify (?:the (created|received) )?(all )?(FAQ Categories|FAQ Subcategories|Marketing Carousels|Quotes|Issues|FAQs|FAQ Category|FAQ Subcategory|Marketing Carousel|Quote|Issue|FAQ)(?: in (database|response match database records))?$/,
  async function (_action, allFlag, resourceType, location) {
    const isGetAll = !!allFlag;
    const singular = isGetAll
      ? convertPluralToSingular(resourceType)
      : resourceType;

    const { endpoint, idField } = getResourceConfig(singular);
    const tableName = getTableNameForResource(singular);
    const dbName = "support_engagement";

    if (isGetAll) {
      const apiRecords = getResponseData(this.response).data;
      await verifyAll(singular, idField, dbName, tableName, apiRecords);
    } else {
      let resourceId;
      let apiRecord = getResponseData(this.response).data;

      // If it's a "received" resource (from GET request), get ID from response
      if (action === "received") {
        // Handle case where response data is an array (GET all with filter)
        if (Array.isArray(apiRecord) && apiRecord.length > 0) {
          apiRecord = apiRecord[0]; // Take the first item from the array
        }

        resourceId = apiRecord[idField];
        if (!resourceId) {
          throw new Error(`No ${idField} found in response for ${singular}`);
        }
      } else {
        // For "created" resources, get ID from context
        resourceId = getCreatedResourceId(this, singular);
      }

      await verifySingle(
        singular,
        idField,
        dbName,
        tableName,
        apiRecord,
        resourceId
      );
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
        `Active date validation failed for ${resourceType}:\n${validationErrors.join("\n")}`
      );
    }

    console.log(`${green} ✅ All ${items.length} ${resourceType} are currently active`);
  }
);