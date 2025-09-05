import serviceFactory from "../../services/service-factory";
import { getResponseData } from "../helpers/responseValidator.js";
import { red, green, yellow, makeTimedRequest } from "../../utils/apiClient.js";
import { fetchUsername } from "./userResolver.js";

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
  const requests = getResponseData(context.response);
  if (!requests || !Array.isArray(requests)) {
    throw new Error(
      'Response does not contain a valid "data" or "passwordRequests" array'
    );
  }
  console.log("requests", requests);
  const userRequest = requests.find(
    (req) => req.username === username && req.status === status
  );
  console.log("userRequest", userRequest);

  if (!userRequest) {
    const availableRequests = requests.map((r) => ({
      username: r.username,
      status: r.status,
    }));
    expect(userRequest).toBeDefined(
      `No password reset request found for username: ${username} with status: ${status}. Available requests: ${JSON.stringify(
        availableRequests
      )}`
    );
  }

  context.stored_user_id = userRequest.user_id;
  context.stored_request_id = userRequest.id;
  context.stored_username = username;
  context.stored_status = status;

  console.log(`${green} Stored user_id: ${context.stored_user_id}`);
  console.log(`${green} Stored request_id: ${context.stored_request_id}`);
  console.log(`${green} For username: ${username} with status: ${status}`);
};

export const authenticateUser = async (context, username_variable, password) => {
  const endpoint = process.env.LOGIN_ENDPOINT;
  let username = fetchUsername(username_variable);
  const requestBody = { username, password };
  await makeTimedRequest(context, "post", endpoint, requestBody);
  if (context.response.status == 200) {
    const { data } = context.response;
    if (data && data.jwt.accessToken) {
      context.authToken = `Bearer ${data.jwt.accessToken}`;
      context.current_username = username; // Store the logged-in username
      console.log(`Access token saved: ${context.authToken}`);
      console.log(`Logged-in username: ${username}`);
    } else {
      throw new Error("Access token not found in the response");
    }
  }
};
export const getResourceConfig = (resource_type) => {
  const configs = {
    "FAQ Category": {
      endpoint: process.env.CATEGORIES_ENDPOINT,
      baseKey: "categories",
      idField: "category_id",
    },
    "FAQ Subcategory": {
      endpoint: process.env.SUB_CATEGORIES_ENDPOINT,
      baseKey: "sub-category",
      idField: "sub_category_id",
      dependencies: ["category_id"],
    },
    FAQ: {
      endpoint: process.env.FAQ_ENDPOINT,
      baseKey: "faq",
      idField: "faq_id",
      dependencies: ["sub_category_id"],
    },
    Issue: {
      endpoint: process.env.ISSUES_ENDPOINT,
      baseKey: "issue",
      idField: "issue_id",
    },
    Resource: {
      endpoint: process.env.RESOURCES_ENDPOINT,
      baseKey: "resource",
      idField: "resource_id",
    },
    Banner: {
      endpoint: process.env.BANNER_ENDPOINT,
      baseKey: "banner",
      idField: "banner_id",
    },
    Quote: {
      endpoint: process.env.QUOTE_OF_THE_DAY_ENDPOINT,
      baseKey: "quote",
      idField: "quote_id",
    },
    "Today Quote": {
      endpoint: process.env.TODAY_QUOTE_ENDPOINT,
      baseKey: "today-quote",
      idField: "quote_id",
    },
    "Marketing Carousel": {
      endpoint: process.env.MARKETING_CAROUSEL_ENDPOINT,
      baseKey: "marketing-carousel",
      idField: "carousel_item_id",
    },
    "FAQ Likes": {
      endpoint: "/api/support-engagement/v1/like-resources",
      baseKey: "faq-likes",
      idField: "like_id",
      dependencies: ["faq_id"],
    },
    "Resource Likes": {
      endpoint: "/api/support-engagement/v1/like-resources",
      baseKey: "resource-likes",
      idField: "like_id",
      dependencies: ["resource_id"],
    },
    Likes: {
      endpoint: "/api/support-engagement/v1/like-resources",
      baseKey: "likes",
      idField: "like_id",
      dependencies: ["resource_id"],
    },
  };

  return configs[resource_type] || {};
};
export const injectID = (
  context,
  resource_type,
  requestBody,
  isCreation = false
) => {
  const updatedBody = { ...requestBody };
  if (!context.created_resources) return updatedBody;

  // Helper to get ID from normalized resource
  const getStoredId = (type, idField) => {
    const normalizedType = normalizeResourceType(type);
    return context.created_resources[normalizedType]?.[idField];
  };

  // Helper to inject ID if placeholder exists
  const injectIdIfNeeded = (field, value) => {
    const placeholder = `{${field}}`;
    if (!updatedBody[field] || updatedBody[field] === placeholder) {
      if (value) {
        updatedBody[field] = value;
        console.log(`${green} 🔗 Injected ${field}: ${value}`);
      } else {
        console.log(
          `${yellow} Warning: No ${field} found in created resources. Available:`,
          Object.keys(context.created_resources)
        );
      }
    }
  };

  switch (resource_type) {
    case "FAQ Subcategory":
      injectIdIfNeeded(
        "category_id",
        getStoredId("FAQ Category", "category_id")
      );
      break;

    case "FAQ":
      if (isCreation) {
        injectIdIfNeeded(
          "sub_category_id",
          getStoredId("FAQ Subcategory", "sub_category_id")
        );
      }

      // Handle resources array
      if (Array.isArray(updatedBody.resources)) {
        const storedResources = context.created_resources.RESOURCES;
        if (Array.isArray(storedResources)) {
          updatedBody.resources = updatedBody.resources.map(
            (resource, index) => {
              const storedResource = storedResources[index];
              if (
                resource.resource_id === "{resource_id}" &&
                storedResource?.resource_id
              ) {
                return { ...resource, resource_id: storedResource.resource_id };
              }
              return resource;
            }
          );
        }
      }
      break;
  }

  return updatedBody;
};

// Helper to normalize resource type for consistent storage
const normalizeResourceType = (type) => type.toUpperCase().replace(/\s+/g, "_");

export const storeCreatedResource = (context, resource_type) => {
  if (context.response?.status !== 201 && context.response?.status !== 200)
    return;

  // Initialize storage
  if (!context.created_resources) context.created_resources = {};

  const config = getResourceConfig(resource_type);
  const responseData =
    context.response.data?.data ||
    context.response.data ||
    context.response.body;

  // Helper to store a resource
  const storeResource = (data, type) => {
    if (!data || !data[config.idField]) return;
    const normalizedType = normalizeResourceType(type);
    context.created_resources[normalizedType] = {
      ...data,
      primary_id: data[config.idField],
    };
    console.log(`✅ Stored ${type} with ID: ${data[config.idField]}`);
  };

  // Extract main resource data
  const resourceKey = resource_type.toLowerCase();
  const mainData =
    responseData?.data?.[resourceKey] ||
    responseData?.[resourceKey] ||
    responseData;

  // Store main resource
  storeResource(mainData, resource_type);

  // Store any associated resources
  const resources = responseData?.data?.resources || responseData?.resources;
  if (Array.isArray(resources)) {
    const resourcesList = resources
      .filter((r) => r.resource_id)
      .map((r) => ({ ...r, primary_id: r.resource_id }));
    if (resourcesList.length) {
      context.created_resources.RESOURCES = resourcesList;
      console.log(`✅ Stored ${resourcesList.length} resource(s)`);
    }
  }
};
export const getCreatedResourceId = (context, resource_type) => {
  const normalizedType = normalizeResourceType(resource_type);
  if (!context.created_resources?.[normalizedType]?.primary_id) {
    console.log(
      "Available resources:",
      Object.keys(context.created_resources || {})
    );
    throw new Error(
      `No created ID found for ${resource_type}. Please create a ${resource_type} first.`
    );
  }
  return context.created_resources[normalizedType].primary_id;
};

export const isPlural = (resourceType) => {
  const pluralTypes = ["FAQ Categories", "FAQ Subcategories", "Marketing Carousels", "Quotes", "Issues", "FAQs"];
  return pluralTypes.includes(resourceType);
};

export const convertPluralToSingular = (plural) => {
  const conversions = {
    "FAQ Categories": "FAQ Category",
    "FAQ Subcategories": "FAQ Subcategory", 
    "Marketing Carousels": "Marketing Carousel",
    "Quotes": "Quote",
    "Issues": "Issue",
    "FAQs": "FAQ",
  };
  return conversions[plural] || plural;
};

export const getTableNameForResource = (resource_type) =>{
  const tableMap = {
    "FAQ Category": "faq_categories",
    "FAQ Subcategory": "faq_subcategories",
    "FAQ Resource": "faq_resources",
    "Marketing Carousel": "marketing_carousel",
    "Quote": "quote_of_the_day",
    "Issue": "issues",
    "FAQ": "faqs",
    "Likes": "likes"
  };
  return (
    tableMap[resource_type] || resource_type.toLowerCase().replace(/\s+/g, "_")
  );
}


export const fieldMappings = {
  'FAQ Category': {
    primaryFields: ['category_name', 'description'],
    expectedKey: 'categories-update'
  },
  'FAQ Subcategory': {
    primaryFields: ['sub_category_name', 'description'],
    expectedKey: 'sub-category-update'
  },
  'FAQ': {
    primaryFields: ['question', 'answer', 'is_popular'],
    expectedKey: 'faq-update'
  },
  'Issue': {
    primaryFields: ['category', 'description'],
    expectedKey: 'issue-update'
  },
  'Marketing Carousel': {
    primaryFields: ['image_url', 'action_url', 'display_order', 'active_from', 'active_to'],
    expectedKey: 'marketing-carousel-update'
  },
  'Quote': {
    primaryFields: ['quote_text', 'author_name', 'quote_date', 'show_days', 'is_active'],
    expectedKey: 'quote-update'
  }
};

const METADATA_FIELDS = ["created_at", "updated_at", "resources", "has_liked"];
const DATE_FIELD_REGEX =
  /(active_from|active_to|created_at|updated_at|_date)$/i;
// Compare date-only fields (handles timezone differences)
function compareDates(field, apiValue, dbValue, id, errors) {
  try {
    let apiDate, dbDate;

    // Convert API date to local timezone for comparison
    if (apiValue && apiValue.includes("T") && apiValue.includes("Z")) {
      // API date is in UTC, convert to local timezone
      const apiDateObj = new Date(apiValue);
      apiDate = apiDateObj.toLocaleDateString("en-CA"); // Returns YYYY-MM-DD format
    } else {
      apiDate = new Date(apiValue).toLocaleDateString("en-CA");
    }

    // Convert DB date to local timezone for comparison
    if (
      dbValue &&
      typeof dbValue === "string" &&
      dbValue.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      // DB value is already in YYYY-MM-DD format, assume it's in local timezone
      dbDate = dbValue;
    } else {
      dbDate = new Date(dbValue).toLocaleDateString("en-CA");
    }

    if (apiDate !== dbDate) {
      errors.push(
        `${id} field mismatch: ${field} API="${apiDate}" DB="${dbDate}"`
      );
    }
  } catch (error) {
    // If date parsing fails, fall back to string comparison
    if (apiValue !== dbValue) {
      errors.push(
        `${id} field mismatch: ${field} API="${apiValue}" DB="${dbValue}"`
      );
    }
  }
}

function normalizeValue(value) {
  return Array.isArray(value) ? value.join(",") : value;
}

function logMismatch(field, apiVal, dbVal) {
  console.log(`DEBUG: Field ${field} comparison failed:`);
  console.log(
    `  API value: "${apiVal}" (type: ${typeof apiVal}, length: ${
      apiVal?.length
    })`
  );
  console.log(
    `  DB value: "${dbVal}" (type: ${typeof dbVal}, length: ${dbVal?.length})`
  );
  console.log(`  API original: ${JSON.stringify(apiVal)}`);
  console.log(`  DB original: ${JSON.stringify(dbVal)}`);
}

function compareRecord(apiRecord, dbRecord, idField, errors, resourceName) {
  for (const [field, apiValue] of Object.entries(apiRecord)) {
    if (METADATA_FIELDS.includes(field)) continue;

    const dbValue = dbRecord[field];
    if (dbValue === undefined) {
      errors.push(
        `${resourceName} ${apiRecord[idField]} missing field in DB: ${field}`
      );
      continue;
    }

    if (DATE_FIELD_REGEX.test(field)) {
      compareDates(field, apiValue, dbValue, apiRecord[idField], errors);
      continue;
    }

    const apiVal = normalizeValue(apiValue);
    const dbVal = normalizeValue(dbValue);

    if (apiVal !== dbVal) {
      logMismatch(field, apiVal, dbVal);
      errors.push(
        `${resourceName} ${apiRecord[idField]} field mismatch: ${field} API="${apiVal}" DB="${dbVal}"`
      );
    }
  }
}

// Verify all records
export async function verifyAll(resourceName, idField, dbName, tableName, apiRecords) {
  if (!Array.isArray(apiRecords)) throw new Error(`Response is not an array of ${resourceName}`);

  const dbResults = await serviceFactory.queryTable(dbName, tableName, {});
  const errors = [];

  for (const apiRecord of apiRecords) {
    const dbRecord = dbResults.find((r) => r[idField] === apiRecord[idField]);
    if (!dbRecord) {
      errors.push(`${resourceName} ${apiRecord[idField]} not found in DB`);
      continue;
    }
    compareRecord(apiRecord, dbRecord, idField, errors, resourceName);
  }

  // Check missing records in API
  dbResults
    .filter(dbRecord => !apiRecords.find(api => api[idField] === dbRecord[idField]))
    .forEach(r => errors.push(`${resourceName} ${r[idField]} missing from API`));

  if (errors.length) {
    expect(errors).toEqual([], `Verification failed: ${errors.join("; ")}`);
  }
  console.log(`✅ All ${resourceName} match database`);
}
async function normalizeParams(params = {}) {
  const normalized = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string") {
      if (v.toLowerCase() === "true") normalized[k] = true;
      else if (v.toLowerCase() === "false") normalized[k] = false;
      else if (!Number.isNaN(Number(v)) && v.trim() !== "") normalized[k] = Number(v);
      else normalized[k] = v;
    } else normalized[k] = v;
  }
  return normalized;
}

export async function verifyRecords({
  resourceName,
  idField,
  dbName,
  tableName,
  apiRecords,
  queryParams,
  checkCount = false,
}) {
  if (!Array.isArray(apiRecords))
    throw new Error(`Response is not an array of ${resourceName}`);

  const filters = queryParams ? await normalizeParams(queryParams) : {};
  const dbResults = await serviceFactory.queryTable(dbName, tableName, filters);

  if (checkCount && dbResults.length !== apiRecords.length) {
    const apiIds = apiRecords.map((r) => r[idField]).filter(Boolean);
    const dbIds = dbResults.map((r) => r[idField]).filter(Boolean);
    throw new Error(
      `${resourceName} count mismatch for query ${JSON.stringify(filters)}. ` +
        `API=${apiRecords.length}, DB=${dbResults.length}.\n` +
        `Missing from API: ${dbIds.filter((id) => !apiIds.includes(id)).slice(0, 50).join(", ")}\n` +
        `Missing from DB: ${apiIds.filter((id) => !dbIds.includes(id)).slice(0, 50).join(", ")}`
    );
  }

  const errors = [];
  for (const apiRecord of apiRecords) {
    const dbRecord = dbResults.find((r) => r[idField] === apiRecord[idField]);
    if (!dbRecord) {
      errors.push(`${resourceName} ${apiRecord[idField]} not found in DB`);
      continue;
    }
    compareRecord(apiRecord, dbRecord, idField, errors, resourceName);
  }

  if (errors.length) {
    expect(errors).toEqual([], `Verification failed: ${errors.join("; ")}`);
  }
  console.log(
    `✅ ${checkCount ? "Filtered" : "Subset of"} ${resourceName} match DB` +
      (queryParams ? ` using ${JSON.stringify(filters)}` : "")
  );
}

export const verifyAllByQuery = (resourceName, idField, dbName, tableName, apiRecords, queryParams) =>
  verifyRecords({ resourceName, idField, dbName, tableName, apiRecords, queryParams, checkCount: true });


// Helper functions to reduce duplication
export const getResourceIdAndEndpoint = (resourceType, customId, context) => {
  const config = getResourceConfig(resourceType);
  let resourceId,
    endpoint,
    method = "patch";

  if (resourceType === "FAQ Likes") {
    resourceId = customId || getCreatedResourceId(context, "FAQ");
    endpoint = `${config.endpoint}/${resourceId}`;
    method = "post";
    context.current_resource_id = resourceId;
  } else if (resourceType === "Resource Likes") {
    if (
      context.created_resources?.RESOURCES &&
      Array.isArray(context.created_resources.RESOURCES)
    ) {
      resourceId =
        customId || context.created_resources.RESOURCES[0]?.resource_id;
    }
    if (!resourceId) {
      throw new Error(
        "No resource ID found. Please create an FAQ with resources first."
      );
    }
    endpoint = `${config.endpoint}/${resourceId}`;
    method = "post";
    context.current_resource_id = resourceId;
  } else {
    resourceId = customId || getCreatedResourceId(context, resourceType);
    endpoint = `${config.endpoint}/${resourceId}`;
  }

  return { resourceId, endpoint, method };
};

export const getUpdateKey = (resourceType) => {
  if (resourceType === "FAQ Likes") return "faq-likes-update";
  if (resourceType === "Resource Likes") return "resource-likes-update";
  return `${getResourceConfig(resourceType).baseKey}-update`;
};

export const storeUpdateData = (context, resourceType, responseData) => {
  if (!context.afterUpdateData) context.afterUpdateData = {};
  context.afterUpdateData[resourceType] = {
    ...responseData.data,
    retrieved_at: new Date().toISOString(),
  };
};

export const storeBeforeUpdateData = (context, resourceType, responseData) => {
  if (!context.beforeUpdateData) context.beforeUpdateData = {};
  if (context.response?.status === 200 || context.response?.status === 201) {
    context.beforeUpdateData[resourceType] = {
      ...responseData.data,
      retrieved_at: new Date().toISOString(),
    };
  }
};