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
  password
) => {

  const endpoint = process.env.LOGIN_ENDPOINT;
  const requestBody = { username, password};
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
    "Marketing Carousel": {
      endpoint: process.env.MARKETING_CAROUSEL_ENDPOINT,
      baseKey: "marketing-carousel",
      idField: "carousel_item_id",
    },
  };

  return configs[resource_type] || {};
};
export const injectID = (context, resource_type, requestBody) => {
  const updatedBody = { ...requestBody };
  
  switch (resource_type) {
    case "FAQ Subcategory":
      if (context.created_resources?.["FAQ Category"]?.category_id) {
        updatedBody.category_id =
          context.created_resources["FAQ Category"].category_id;
        console.log(
          `${green} 🔗 Injected category_id: ${updatedBody.category_id}`
        );
      }
      break;
      
    case "FAQ":
      if (context.created_resources?.["FAQ Subcategory"]?.sub_category_id) {
        updatedBody.sub_category_id =
          context.created_resources["FAQ Subcategory"].sub_category_id;
        console.log(
          `${green} 🔗 Injected sub_category_id: ${updatedBody.sub_category_id}`
        );
      }
      break;

    default:
      break;
  }

  return updatedBody;
};

export const storeCreatedResource = (context, resource_type) => {
  if (context.response?.status === 201 || context.response?.status === 200) {
    const responseData =
      context.response.data?.data ||
      context.response.data ||
      context.response.body;
    const config = getResourceConfig(resource_type);

    if (!context.created_resources) {
      context.created_resources = {};
    }

    // Handle case where responseData is an array (like FAQ creation)
    if (Array.isArray(responseData) && responseData.length > 0) {
      if (resource_type === "FAQ") {
        // For FAQ creation, store both FAQ and its resources
        const faqData = responseData[0];
        const resourceData = responseData.slice(1); // All objects after the first are resources

        // Store the FAQ
        const faqId = faqData[config.idField];
        if (faqId) {
          context.created_resources[resource_type] = {
            ...faqData,
            primary_id: faqId,
          };
          console.log(`${green} ✅ Stored FAQ with ID: ${faqId}`);

          // Store FAQ resources
          resourceData.forEach((resource, index) => {
            if (resource.resource_id) {
              if (!context.created_resources["FAQ Resource"]) {
                context.created_resources["FAQ Resource"] = [];
              }
              context.created_resources["FAQ Resource"].push({
                ...resource,
                primary_id: resource.resource_id,
              });
              console.log(
                `${green} ✅ Stored FAQ Resource ${index + 1} with ID: ${
                  resource.resource_id
                }`
              );
            }
          });
        }
      } else {
        // For other resource types, store the first item
        const resourceData = responseData[0];
        const resourceId = resourceData[config.idField];
        if (resourceId) {
          context.created_resources[resource_type] = {
            ...resourceData,
            primary_id: resourceId,
          };
          console.log(
            `${green} ✅ Stored ${resource_type} with ID: ${resourceId}`
          );
        }
      }
    } else {
      // Handle single object response
      const resourceId = responseData[config.idField];
      if (resourceId) {
        context.created_resources[resource_type] = {
          ...responseData,
          primary_id: resourceId,
        };
        console.log(
          `${green} ✅ Stored ${resource_type} with ID: ${resourceId}`
        );
      }
    }
  }
};
export const getCreatedResourceId = (context, resource_type) => {
  if (context.created_resources && context.created_resources[resource_type]) {
    return context.created_resources[resource_type].primary_id;
  }
  
  throw new Error(`No created ID found for ${resource_type}. Please create a ${resource_type} first.`);
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

const METADATA_FIELDS = ["created_at", "updated_at", "resources"];
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

// Compare a single record
function compareRecord(apiRecord, dbRecord, idField, errors, resourceName) {
  for (const [field, apiValue] of Object.entries(apiRecord)) {
    if (METADATA_FIELDS.includes(field)) continue; // skip metadata

    const dbValue = dbRecord[field];
    if (dbValue === undefined) {
      errors.push(`${resourceName} ${apiRecord[idField]} missing field in DB: ${field}`);
      continue;
    }

    if (DATE_FIELD_REGEX.test(field)) {
      compareDates(field, apiValue, dbValue, apiRecord[idField], errors);
    } else {
      // Handle array to string conversion for comparison
      let apiValueToCompare = apiValue;
      let dbValueToCompare = dbValue;

      // If API value is an array and DB value is a string, convert array to string
      if (Array.isArray(apiValue) && typeof dbValue === "string") {
        apiValueToCompare = apiValue.join(",");
      }
      // If DB value is an array and API value is a string, convert array to string
      else if (Array.isArray(dbValue) && typeof apiValue === "string") {
        dbValueToCompare = dbValue.join(",");
      }
      // If both are arrays, convert both to strings for comparison
      else if (Array.isArray(apiValue) && Array.isArray(dbValue)) {
        apiValueToCompare = apiValue.join(",");
        dbValueToCompare = dbValue.join(",");
      }

      if (apiValueToCompare !== dbValueToCompare) {
        console.log(`DEBUG: Field ${field} comparison failed:`);
        console.log(
          `  API value: "${apiValueToCompare}" (type: ${typeof apiValueToCompare}, length: ${
            apiValueToCompare?.length
          })`
        );
        console.log(
          `  DB value: "${dbValueToCompare}" (type: ${typeof dbValueToCompare}, length: ${
            dbValueToCompare?.length
          })`
        );
        console.log(`  API original: ${JSON.stringify(apiValue)}`);
        console.log(`  DB original: ${JSON.stringify(dbValue)}`);
        errors.push(
          `${resourceName} ${apiRecord[idField]} field mismatch: ${field} API="${apiValueToCompare}" DB="${dbValueToCompare}"`
        );
      }
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

  if (errors.length) throw new Error(`Verification failed: ${errors.join("; ")}`);
  console.log(`✅ All ${resourceName} match database`);
}

// Verify single record
export async function verifySingle(resourceName, idField, dbName, tableName, apiRecord, resourceId) {
  const results = await serviceFactory.queryTable(dbName, tableName, { [idField]: resourceId });
  if (!results.length) throw new Error(`${resourceName} ${resourceId} not found in DB`);

  const dbRecord = results[0];
  const errors = [];
  compareRecord(apiRecord, dbRecord, idField, errors, resourceName);

  // Validate created_at vs updated_at
  if (new Date(dbRecord.created_at).getTime() !== new Date(dbRecord.updated_at).getTime()) {
    errors.push(`updated_at should match created_at`);
  }

  if (errors.length) throw new Error(`Single record verification failed: ${errors.join("; ")}`);
  console.log(`✅ ${resourceName} ${resourceId} verified successfully`);
}

