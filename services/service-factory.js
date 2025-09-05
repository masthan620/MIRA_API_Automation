import BaseDbService from './base-db-service.js';
import dbFactory from './db-factory.js';

// Cache for the created services
const serviceCache = {};

class ServiceFactory {
  /**
   * Query a table with WHERE conditions using Knex
   * @param {string} dbName - Database name
   * @param {string} tableName - Table name
   * @param {Object} whereConditions - WHERE conditions as key-value pairs
   * @returns {Promise<Array>} - Query results
   */
  async queryTable(dbName, tableName, whereConditions = {}) {
    try {
      const knexInstance = dbFactory.getConnection(dbName);

      let query = knexInstance(tableName).select("*");

      // Add WHERE conditions
      Object.entries(whereConditions).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.where(key, value);
        }
      });

      console.log("Query:", query.toString());
      console.log("Where conditions:", whereConditions);

      const result = await query;
      return result;
    } catch (error) {
      console.error("Query failed:", error.message);
      throw error;
    }
  }
  /**
   * Get a general database service for any database and table
   * @param {string} dbName - Database name
   * @param {string} tableName - Table name
   * @returns {BaseDbService} - Database service for the specified table
   */
  getDbService(dbName, tableName) {
    const serviceKey = `${dbName}.${tableName}`;

    if (!serviceCache[serviceKey]) {
      serviceCache[serviceKey] = new BaseDbService(dbName, tableName);
    }

    return serviceCache[serviceKey];
  }

  /**
   * Get a service for devices table in any database
   * @param {string} dbName - Database name
   */
  getDevicesService(dbName = "devicemanagement") {
    const baseService = this.getDbService(dbName, "devices");

    // Extend with device-specific methods
    baseService.getDeviceBySerialNumber = async function (serialNumber) {
      return this.query().where("serial_number", serialNumber).first();
    };

    baseService.deviceExists = async function (deviceId) {
      const result = await this.query()
        .where("id", deviceId)
        .count("id as count")
        .first();
      return parseInt(result.count) > 0;
    };

    return baseService;
  }

  /**
   * Get a service for users table in any database
   * @param {string} dbName - Database name
   */
  getUsersService(dbName = "usermanagement") {
    const baseService = this.getDbService(dbName, "users");

    // Extend with user-specific methods
    baseService.getUserByEmail = async function (email) {
      return this.query().where("email", email).first();
    };

    baseService.getUserByUsername = async function (username) {
      return this.query().where("username", username).first();
    };

    return baseService;
  }
  getPasswordResetService(dbName = "iamdb") {
    const baseService = this.getDbService(dbName, "password_reset_requests");

    // Extend with password reset specific methods
    baseService.getPendingRequestByUserId = async function (userId) {
      // Ensure userId is a simple value
      const cleanUserId = String(userId);
      console.log(
        `🔍 DB Query: Looking for user_id="${cleanUserId}" with status="pending"`
      );

      return this.query()
        .where("user_id", "=", cleanUserId)
        .where("status", "=", "pending")
        .orderBy("id", "desc")
        .first();
    };

    baseService.getAllRequestsByUserId = async function (userId) {
      const cleanUserId = String(userId);
      return this.query()
        .where("user_id", "=", cleanUserId)
        .orderBy("id", "desc");
    };

    baseService.getRequestsByStatus = async function (status) {
      const cleanStatus = String(status);
      return this.query()
        .where("status", "=", cleanStatus)
        .orderBy("id", "desc");
    };

    return baseService;
  }
  getDeviceUserMappingService(dbName = "devicemanagement") {
    const baseService = this.getDbService(dbName, "device_user_mapping");

    // Extend with device mapping specific methods
    baseService.getDeviceByUserId = async function (userId) {
      return this.query()
        .where("user_id", userId)
        .where("active", true)
        .orderBy("id", "asc")
        .first();
    };

    baseService.getAllDevicesByUserId = async function (userId) {
      return this.query()
        .where("user_id", userId)
        .where("active", true)
        .orderBy("id", "asc");
    };

    baseService.getUserByDeviceId = async function (deviceId) {
      return this.query()
        .where("device_id", deviceId)
        .where("active", true)
        .first();
    };

    return baseService;
  }
  /**
   * Get user validation service for cross-database validation
   */
  getUserValidationService(
    iamDbName = "iamdb",
    profileDbName = "usermanagement"
  ) {
    const self = this;

    return {
      validateUserResponse: async function (username, apiData) {
        const usersService = self.getUsersService(iamDbName);
        const dbUser = await usersService.getUserByUsername(username);

        if (!dbUser) {
          throw new Error(`User ${username} not found in ${iamDbName}`);
        }

        const profileService = self.getDbService(profileDbName, "user_profile");
        const dbProfile = await profileService
          .query()
          .where("user_id", dbUser.user_id)
          .first();

        // Validate core fields
        if (
          apiData.username?.toLowerCase() !== dbUser.username?.toLowerCase()
        ) {
          throw new Error(
            `Username mismatch: API="${apiData.username}" vs DB="${dbUser.username}"`
          );
        }

        if (apiData.password_type !== dbUser.password_type) {
          throw new Error(
            `Password type mismatch: API="${apiData.password_type}" vs DB="${dbUser.password_type}"`
          );
        }

        if (dbProfile) {
          if (
            apiData.user_type &&
            apiData.user_type.toLowerCase() !==
              dbProfile.user_type?.toLowerCase()
          ) {
            throw new Error(
              `User type mismatch: API="${apiData.user_type}" vs DB="${dbProfile.user_type}"`
            );
          }
        }

        console.log("✅ Database validation passed");
        return { dbUser, dbProfile };
      },
    };
  }
  getSupportEngagementService(dbName = "support_engagement") {
    const categoryService = this.getDbService(dbName, "faq_categories");
    const subcategoryService = this.getDbService(dbName, "faq_subcategories");
    const resourcesService = this.getDbService(dbName, "faq_resources");
    const carouselService = this.getDbService(dbName, "marketing_carousel");
    const quoteService = this.getDbService(dbName, "quote_of_the_day");
    const issueService = this.getDbService(dbName, "issues");
    const faqService = this.getDbService(dbName, "faqs");
    const likesService = this.getDbService(dbName, "likes");

    return {
      categoryService,
      subcategoryService,
      resourcesService,
      carouselService,
      quoteService,
      issueService,
      faqService,
      likesService,
    };
  }
  fetchUserProfileByUserID(dbName = "usermanagement") {
    const baseService = this.getDbService(dbName, "user_profile");

    baseService.getUserByUserID = async function (user_id) {
      return this.query().where("user_id", user_id).first();
    };

    return baseService;
  }
}

const serviceFactory = new ServiceFactory();
export default serviceFactory;
