/**
 * 📚 AllureHelper Usage Examples for MIRA API Tests
 * 
 * This file shows you all the different ways to use the simplified AllureHelper
 * in your existing WebdriverIO + Cucumber framework.
 */

import AllureHelper from '../utils/allure-helper.js';
import { makeTimedRequest } from '../utils/apiClient.js';

// =====================================
// 🎯 EXAMPLE 1: Basic API Call Documentation
// =====================================
// This is automatically handled when you use makeTimedRequest()
// But you can also call it manually:

/*
Given(/^I test user login API$/, async function() {
  // Your existing API call
  await makeTimedRequest(this, "post", "/auth/login");
  
  // The AllureHelper.attachApiCall() is automatically called by makeTimedRequest
  // But you can add extra context manually:
  AllureHelper.addStepWithMetadata("User Login Attempt", {
    userType: "admin",
    loginMethod: "email",
    expectedOutcome: "success"
  });
});
*/

// =====================================
// 🎯 EXAMPLE 2: Console Log Capture
// =====================================
// Use the withConsoleCapture utility function in your steps:

/*
Given(/^I debug device creation$/, async function() {
  await withConsoleCapture("Device Creation Debug", async () => {
    console.log("Starting device creation...");
    await makeTimedRequest(this, "post", "/devices");
    console.log("Device creation completed");
    console.log("Response status:", this.response.status);
  });
  // All console.log statements above will be captured and attached to Allure
});
*/

// =====================================
// 🎯 EXAMPLE 3: Manual Error Documentation
// =====================================
// For custom error handling:

/*
Given(/^I handle validation errors$/, async function() {
  try {
    await makeTimedRequest(this, "post", "/users", null, {}, false);
  } catch (error) {
    // Custom error documentation
    AllureHelper.attachError(this, error, "Validation Error During User Creation");
    
    // You can still re-throw the error if needed
    throw error;
  }
});
*/

// =====================================
// 🎯 EXAMPLE 4: Performance Monitoring
// =====================================
// For specific performance checks:

/*
Given(/^I monitor slow API responses$/, async function() {
  await makeTimedRequest(this, "get", "/heavy-report");
  
  // Add custom performance documentation
  if (this.responseTime > 2000) {
    AllureHelper.attachPerformance(this, "Heavy Report Generation");
    
    // Add additional context
    AllureHelper.addStepWithMetadata("Performance Alert", {
      threshold: "2000ms",
      actual: `${this.responseTime}ms`,
      recommendation: "Consider caching or optimization"
    });
  }
});
*/

// =====================================
// 🎯 EXAMPLE 5: Step-by-Step Workflow Documentation
// =====================================
// For complex multi-step scenarios:

/*
Given(/^I perform complete user onboarding$/, async function() {
  // Step 1: Create user
  AllureHelper.addStepWithMetadata("Step 1: User Registration", {
    operation: "create_user",
    stage: "registration"
  });
  await makeTimedRequest(this, "post", "/users");
  
  // Step 2: Verify email
  AllureHelper.addStepWithMetadata("Step 2: Email Verification", {
    operation: "verify_email", 
    stage: "verification"
  });
  await makeTimedRequest(this, "post", "/verify-email");
  
  // Step 3: Setup profile
  AllureHelper.addStepWithMetadata("Step 3: Profile Setup", {
    operation: "setup_profile",
    stage: "onboarding"
  });
  await makeTimedRequest(this, "patch", "/profile");
});
*/

// =====================================
// 🎯 EXAMPLE 6: Environment-Specific Documentation
// =====================================
// Add context based on environment:

/*
Before(function() {
  // Add environment info at the start of each scenario
  AllureHelper.addStepWithMetadata("Test Environment Setup", {
    environment: process.env.NODE_ENV,
    baseUrl: process.env.BASE_URL,
    testDataLoaded: !!global.testData,
    authTokenAvailable: !!process.env.ACCESS_TOKEN
  });
});
*/

// =====================================
// 🎯 EXAMPLE 7: Custom Console Log Categories
// =====================================
// Organize your console logs by category:

/*
Given(/^I debug with categorized logs$/, async function() {
  await withConsoleCapture("API Debug Session", async () => {
    console.log("🔧 SETUP: Preparing request headers");
    console.log("📤 REQUEST: Sending POST to /devices");
    await makeTimedRequest(this, "post", "/devices");
    console.log("📥 RESPONSE: Received response");
    console.log("✅ VALIDATION: Checking response structure");
  });
});
*/

// =====================================
// 🎯 EXAMPLE 8: Database Validation with Logs
// =====================================
// If you're doing database checks:

/*
Given(/^I validate database state$/, async function() {
  await withConsoleCapture("Database Validation", async () => {
    console.log("Connecting to database...");
    const dbService = serviceFactory.getService('database');
    
    console.log("Querying user table...");
    const users = await dbService.query("SELECT * FROM users WHERE id = ?", [this.userId]);
    
    console.log(`Found ${users.length} users in database`);
    console.log("Database validation completed");
  });
  
  AllureHelper.addStepWithMetadata("Database State Validation", {
    table: "users",
    queryType: "SELECT", 
    recordsFound: users?.length || 0
  });
});
*/

// =====================================
// 🎯 EXAMPLE 9: Configuration-Based Verbosity
// =====================================
// Control detail level with environment variables:

/*
// Set ALLURE_VERBOSITY=detailed for more logs
// Set ALLURE_VERBOSITY=standard for basic logs

Given(/^I run configurable logging$/, async function() {
  if (process.env.ALLURE_VERBOSITY === 'detailed') {
    AllureHelper.addStepWithMetadata("Detailed Debug Info", {
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      testStartTime: new Date().toISOString()
    });
  }
  
  await makeTimedRequest(this, "get", "/health");
});
*/

// =====================================
// 🎯 EXAMPLE 10: Reusable Step Enhancement
// =====================================
// Create enhanced versions of common steps:

/*
// Enhanced validation step with logging
Then(/^response should have enhanced validation for "([^"]*)"$/, async function(fieldName) {
  await withConsoleCapture(`Validating ${fieldName}`, async () => {
    const responseData = this.response.body || this.response.data || this.response;
    
    console.log(`Searching for field: ${fieldName}`);
    console.log(`Response keys: ${Object.keys(responseData)}`);
    
    const fieldValue = responseData[fieldName];
    console.log(`Found ${fieldName}: ${fieldValue}`);
    
    expect(fieldValue).toBeDefined();
    this[fieldName] = fieldValue;
  });
  
  AllureHelper.addStepWithMetadata(`Field Validation: ${fieldName}`, {
    fieldName: fieldName,
    fieldValue: this[fieldName],
    fieldType: typeof this[fieldName],
    responseSize: JSON.stringify(this.response).length
  });
});
*/

export {
  // Export any utility functions you create
};

/**
 * 🔧 HOW TO USE IN YOUR EXISTING TESTS:
 * 
 * 1. Import AllureHelper in your step definition files:
 *    import AllureHelper from '../../utils/allure-helper.js';
 * 
 * 2. Your makeTimedRequest() calls now automatically generate rich Allure reports
 * 
 * 3. Use withConsoleCapture() for steps where you want to capture console logs:
 *    await withConsoleCapture("Step Name", async () => { your code here });
 * 
 * 4. Add custom metadata to steps:
 *    AllureHelper.addStepWithMetadata("Description", { key: "value" });
 * 
 * 5. Document errors manually when needed:
 *    AllureHelper.attachError(this, error, "Error Description");
 * 
 * 6. Monitor performance for specific operations:
 *    AllureHelper.attachPerformance(this, "Operation Name");
 * 
 * 💡 BEST PRACTICES:
 * - Use descriptive step names
 * - Include relevant context in metadata
 * - Capture console logs for debugging steps
 * - Document performance for slow operations
 * - Add environment info for different test environments
 */
