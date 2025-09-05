/**
 * 🎯 Simplified Enhanced Allure Helper for WebdriverIO + Cucumber
 * Optimized for your existing MIRA API test framework
 * File: utils/allure-helper.js
 */
import allureReporter from '@wdio/allure-reporter';

class AllureHelper {
  static verbosity = process.env.ALLURE_VERBOSITY || 'standard'; // standard | detailed
  static sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'bearer', 'refresh_token', 'access_token'];

  /**
   * 📡 API Call Documentation - Integrates with your existing makeTimedRequest
   * @param {Object} context - Your test context (this)
   * @param {string} stepName - Step description
   * @param {Object} requestDetails - Detailed request information
   */
  static attachApiCall(context, stepName, requestDetails) {
    try {
      console.log(`🎯 AllureHelper.attachApiCall called with stepName: ${stepName}`);
      
      const requestData = this.maskSensitive({
        method: requestDetails.method,
        endpoint: requestDetails.endpoint,
        requestUrl: requestDetails.requestUrl,
        host: requestDetails.host,
        headers: requestDetails.headers,
        body: requestDetails.body,
        timestamp: requestDetails.timestamp,
        testData: global.testData ? 'loaded' : 'not-available'
      });

      const responseData = this.maskSensitive({
        statusCode: context.response?.status,
        statusText: context.response?.statusText,
        responseTime: context.responseTime || 0,
        responseBody: context.response?.data || {},
        timestamp: new Date().toISOString()
      });

      // Add attachments directly to the current test step
      console.log(`🎯 Adding attachments directly to current step for: ${stepName}`);
      
      // Individual attachments as shown in the screenshot
      allureReporter.addAttachment(
        `Request URL - ${stepName}`,
        requestData.requestUrl,
        'text/plain'
      );
      console.log(`🎯 Added Request URL attachment`);

      if (requestData.headers && Object.keys(requestData.headers).length > 0) {
        // Separate Authorization from other headers for clarity
        if (requestData.headers.Authorization) {
          allureReporter.addAttachment(
            `Authorization - ${stepName}`,
            requestData.headers.Authorization,
            'text/plain'
          );
        }
        
        allureReporter.addAttachment(
          `Headers - ${stepName}`,
          JSON.stringify(requestData.headers, null, 2),
          'application/json'
        );
      }

      allureReporter.addAttachment(
        `Host - ${stepName}`,
        requestData.host,
        'text/plain'
      );

      if (requestData.body) {
        allureReporter.addAttachment(
          `Body - ${stepName}`,
          JSON.stringify(requestData.body, null, 2),
          'application/json'
        );
      }

      if (responseData.responseBody) {
        allureReporter.addAttachment(
          `Response Body - ${stepName}`,
          JSON.stringify(responseData.responseBody, null, 2),
          'application/json'
        );
      }

      // Enhanced HTML Summary for visual overview
      const htmlSummary = this.generateApiSummaryHtml(requestData, responseData);
      allureReporter.addAttachment(
        `API Call Summary - ${stepName}`,
        htmlSummary,
        'text/html'
      );
      console.log(`🎯 Completed all attachments for: ${stepName}`);

    } catch (error) {
      console.error('❌ Error attaching API details:', error);
    }
  }

  /**
   * 🎨 Generate Detailed HTML Summary like Postman/API Client
   */
  static generateApiSummaryHtml(request, response) {
    const statusColor = this.getStatusColor(response.statusCode);
    const perfColor = this.getPerformanceColor(response.responseTime);
    
    // Format headers for display
    const headersHtml = Object.entries(request.headers || {})
      .map(([key, value]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">${key}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e9ecef; word-break: break-all;">${value}</td>
        </tr>
      `).join('');

    // Format request body
    const requestBodyHtml = request.body 
      ? `<pre style="background: #f8f9fa; padding: 15px; border-radius: 6px; overflow-x: auto; margin: 0; font-size: 12px; border: 1px solid #e9ecef;">${JSON.stringify(request.body, null, 2)}</pre>`
      : '<span style="color: #6c757d; font-style: italic;">No body</span>';

    // Format response body
    const responseBodyHtml = response.responseBody 
      ? `<pre style="background: #f8f9fa; padding: 15px; border-radius: 6px; overflow-x: auto; margin: 0; font-size: 12px; border: 1px solid #e9ecef;">${JSON.stringify(response.responseBody, null, 2)}</pre>`
      : '<span style="color: #6c757d; font-style: italic;">No response body</span>';
    
    return `
      <div style="font-family: 'Segoe UI', sans-serif; margin: 15px; padding: 0; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        
        <!-- Header Section -->
        <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; font-size: 18px;">🌐 ${request.method} ${request.endpoint}</h3>
            <span style="background: ${statusColor}; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 14px;">${response.statusCode}</span>
          </div>
          <div style="margin-top: 10px; font-size: 14px; opacity: 0.9;">
            ${request.requestUrl}
          </div>
        </div>

        <!-- Quick Stats -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0; border-bottom: 1px solid #e9ecef;">
          <div style="padding: 15px; text-align: center; border-right: 1px solid #e9ecef;">
            <div style="font-size: 24px; font-weight: bold; color: ${perfColor};">${response.responseTime}ms</div>
            <div style="font-size: 12px; color: #6c757d; text-transform: uppercase;">Response Time</div>
          </div>
          <div style="padding: 15px; text-align: center; border-right: 1px solid #e9ecef;">
            <div style="font-size: 16px; font-weight: bold; color: ${statusColor};">${response.statusCode}</div>
            <div style="font-size: 12px; color: #6c757d; text-transform: uppercase;">${response.statusText || 'Status'}</div>
          </div>
          <div style="padding: 15px; text-align: center;">
            <div style="font-size: 14px; font-weight: bold; color: #495057;">${request.host}</div>
            <div style="font-size: 12px; color: #6c757d; text-transform: uppercase;">Host</div>
          </div>
        </div>

        <!-- Request Details Section -->
        <div style="padding: 20px;">
          
          <!-- Request URL -->
          <div style="margin-bottom: 25px;">
            <h4 style="margin: 0 0 10px 0; color: #007bff; font-size: 16px; border-bottom: 2px solid #007bff; padding-bottom: 5px;">📡 Request URL</h4>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; border: 1px solid #e9ecef; word-break: break-all;">
              ${request.requestUrl}
            </div>
          </div>

          <!-- Headers -->
          <div style="margin-bottom: 25px;">
            <h4 style="margin: 0 0 10px 0; color: #007bff; font-size: 16px; border-bottom: 2px solid #007bff; padding-bottom: 5px;">🔑 Request Headers</h4>
            ${headersHtml ? `
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e9ecef; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; color: #495057;">Header</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; color: #495057;">Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${headersHtml}
                </tbody>
              </table>
            ` : '<span style="color: #6c757d; font-style: italic;">No headers</span>'}
          </div>

          <!-- Request Body -->
          <div style="margin-bottom: 25px;">
            <h4 style="margin: 0 0 10px 0; color: #007bff; font-size: 16px; border-bottom: 2px solid #007bff; padding-bottom: 5px;">📄 Request Body</h4>
            ${requestBodyHtml}
          </div>

          <!-- Response Body -->
          <div style="margin-bottom: 10px;">
            <h4 style="margin: 0 0 10px 0; color: #28a745; font-size: 16px; border-bottom: 2px solid #28a745; padding-bottom: 5px;">📊 Response Body</h4>
            ${responseBodyHtml}
          </div>

        </div>
      </div>
    `;
  }

  /**
   * 🚨 Error Documentation
   * @param {Object} context - Test context
   * @param {Error} error - Error object
   * @param {string} stepName - Step description
   */
  static attachError(context, error, stepName = 'API Error') {
    try {
      const errorInfo = {
        name: error.name,
        message: error.message,
        timestamp: new Date().toISOString(),
        httpStatus: context.response?.status || 'N/A',
        endpoint: context.endpoint || 'unknown',
        responseTime: context.responseTime || 0,
        testContext: {
          hasTestData: !!global.testData,
          hasAuthToken: !!context.authToken,
          environment: process.env.BASE_URL
        }
      };

      allureReporter.addStep(`🚨 ${stepName}`, () => {
        allureReporter.addAttachment(
          '❌ Error Details',
          JSON.stringify(errorInfo, null, 2),
          'application/json'
        );

        // Simplified error HTML
        const errorHtml = `
          <div style="font-family: 'Segoe UI', sans-serif; margin: 15px; padding: 20px; border: 2px solid #dc3545; border-radius: 8px; background: #f8d7da;">
            <h3 style="color: #721c24; margin-bottom: 15px;">🚨 ${error.name}</h3>
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <strong>Message:</strong> ${error.message}<br>
              <strong>HTTP Status:</strong> ${errorInfo.httpStatus}<br>
              <strong>Response Time:</strong> ${errorInfo.responseTime}ms<br>
              <strong>Timestamp:</strong> ${errorInfo.timestamp}
            </div>
          </div>
        `;
        
        allureReporter.addAttachment(
          '🔍 Error Summary',
          errorHtml,
          'text/html'
        );
      });
    } catch (err) {
      console.error('❌ Failed to attach error details:', err);
    }
  }

  /**
   * 📊 Test Step with Metadata
   * @param {string} stepName - Step name
   * @param {Object} metadata - Additional metadata
   */
  static addStepWithMetadata(stepName, metadata = {}) {
    try {
      const enrichedMetadata = {
        ...metadata,
        timestamp: new Date().toISOString(),
        environment: process.env.BASE_URL,
        testData: global.testData ? 'available' : 'not-loaded',
        nodeVersion: process.version,
        platform: process.platform
      };

      allureReporter.addStep(`🏷️ ${stepName}`, () => {
        allureReporter.addAttachment(
          '📋 Step Context',
          JSON.stringify(enrichedMetadata, null, 2),
          'application/json'
        );
      });
    } catch (error) {
      console.error('❌ Error adding step metadata:', error);
    }
  }

  /**
   * 📈 Performance Summary
   * @param {Object} context - Test context with response time
   * @param {string} operation - Operation description
   */
  static attachPerformance(context, operation) {
    try {
      const performanceData = {
        operation: operation,
        responseTime: context.responseTime || 0,
        performanceGrade: this.getPerformanceGrade(context.responseTime),
        timestamp: new Date().toISOString(),
        endpoint: context.endpoint || 'unknown',
        status: context.response?.status || 'unknown'
      };

      allureReporter.addStep(`⚡ Performance: ${operation}`, () => {
        allureReporter.addAttachment(
          '📊 Performance Metrics',
          JSON.stringify(performanceData, null, 2),
          'application/json'
        );
      });
    } catch (error) {
      console.error('❌ Error attaching performance data:', error);
    }
  }

  /**
   * 💡 Console Logs Capture
   * @param {string} stepName - Step name
   * @param {Array} logs - Array of log messages
   */
  static attachConsoleLogs(stepName, logs) {
    try {
      if (!logs || logs.length === 0) return;

      const logData = {
        stepName: stepName,
        timestamp: new Date().toISOString(),
        totalLogs: logs.length,
        logs: logs.map((log, index) => ({
          index: index + 1,
          message: log,
          timestamp: new Date().toISOString()
        }))
      };

      allureReporter.addStep(`💡 Console Logs: ${stepName}`, () => {
        allureReporter.addAttachment(
          '📝 Console Output',
          JSON.stringify(logData, null, 2),
          'application/json'
        );

        // HTML formatted logs
        const logHtml = `
          <div style="font-family: 'Segoe UI', sans-serif; margin: 15px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h4 style="color: #495057; margin-bottom: 15px;">💡 Console Logs (${logs.length} entries)</h4>
            ${logs.map((log, i) => `
              <div style="background: white; margin: 5px 0; padding: 10px; border-radius: 4px; border-left: 3px solid #007bff;">
                <strong>${i + 1}.</strong> ${log}
              </div>
            `).join('')}
          </div>
        `;

        allureReporter.addAttachment(
          '📋 Formatted Console Logs',
          logHtml,
          'text/html'
        );
      });
    } catch (error) {
      console.error('❌ Error attaching console logs:', error);
    }
  }

  // ===================
  // Utility Methods
  // ===================

  static maskSensitive(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const masked = JSON.parse(JSON.stringify(obj));
    
    const maskRecursively = (item) => {
      if (Array.isArray(item)) {
        return item.map(maskRecursively);
      }
      
      if (item && typeof item === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(item)) {
          const shouldMask = this.sensitiveKeys.some(sensitive => 
            key.toLowerCase().includes(sensitive.toLowerCase())
          );
          result[key] = shouldMask ? '***MASKED***' : maskRecursively(value);
        }
        return result;
      }
      
      return item;
    };

    return maskRecursively(masked);
  }

  static getStatusColor(statusCode) {
    if (statusCode >= 200 && statusCode < 300) return '#28a745';
    if (statusCode >= 300 && statusCode < 400) return '#ffc107';
    if (statusCode >= 400 && statusCode < 500) return '#fd7e14';
    if (statusCode >= 500) return '#dc3545';
    return '#6c757d';
  }

  static getPerformanceColor(responseTime) {
    if (responseTime < 200) return '#28a745';
    if (responseTime < 500) return '#ffc107';
    if (responseTime < 1000) return '#fd7e14';
    return '#dc3545';
  }

  static getPerformanceGrade(responseTime) {
    if (responseTime < 200) return 'Excellent';
    if (responseTime < 500) return 'Good';
    if (responseTime < 1000) return 'Average';
    return 'Poor';
  }
}

export default AllureHelper;
