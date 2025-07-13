// wdio-cliq-reporter.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ZohoCliqClient from './utils/ZohoCliqClient.js';

class CliqReporter {
    constructor(options = {}) {
        this.options = {
            channelName: options.channelName || 'default-channel',
            reportDir: options.reportDir || './reports',
            reportFile: options.reportFile || 'index.html',
            testEnv: options.testEnv || 'Test Environment',
            botName: options.botName || 'WebdriverIO Reporter',
            botImage: options.botImage || 'https://webdriver.io/img/webdriverio.png'
        };

        // Initialize the shared Cliq client
        this.cliqClient = new ZohoCliqClient();
    }

    /**
     * Formats test results for Cliq message
     */
    formatResults(results) {
        if (!results || !results.stats || !results.specs) {
            console.warn('Invalid results object structure. Using default values.');
            return [{
                "Sl No": 1,
                "Spec File Name": "Unknown",
                "Total TC": 0,
                "Total Passed TC": 0,
                "Total Failed TC": 0,
                "Total Skipped TC": 0
            }];
        }

        const { stats, specs } = results;
        const format = [];

        try {
            specs.forEach((spec, index) => {
                const specFile = spec.file || 'Unknown';
                const specName = specFile.includes('/') || specFile.includes('\\') 
                    ? path.basename(specFile, path.extname(specFile))
                    : specFile;

                let totalTests = spec.total !== undefined ? spec.total : (spec.tests || []).length;
                let passedTests = spec.passes !== undefined ? spec.passes : (spec.tests || []).filter(t => t && t.state === 'passed').length;
                let failedTests = spec.failures !== undefined ? spec.failures : (spec.tests || []).filter(t => t && t.state === 'failed').length;
                let skippedTests = spec.skipped !== undefined ? spec.skipped : (spec.tests || []).filter(t => t && (t.state === 'skipped' || t.state === 'pending')).length;

                totalTests = isNaN(totalTests) ? 0 : totalTests;
                passedTests = isNaN(passedTests) ? 0 : passedTests;
                failedTests = isNaN(failedTests) ? 0 : failedTests;
                skippedTests = isNaN(skippedTests) ? 0 : skippedTests;

                format.push({
                    "Sl No": index + 1,
                    "Spec File Name": specName,
                    "Total TC": totalTests,
                    "Total Passed TC": passedTests, 
                    "Total Failed TC": failedTests,
                    "Total Skipped TC": skippedTests
                });
            });

            let totalSpecTests = 0, totalSpecPassed = 0, totalSpecFailed = 0, totalSpecSkipped = 0;
            format.forEach(row => {
                if (row["Sl No"] !== "--") {
                    totalSpecTests += row["Total TC"];
                    totalSpecPassed += row["Total Passed TC"];
                    totalSpecFailed += row["Total Failed TC"];
                    totalSpecSkipped += row["Total Skipped TC"];
                }
            });

            const totalTests = stats.tests || totalSpecTests;
            const totalPassed = stats.passes || totalSpecPassed;
            const totalFailed = stats.failures || totalSpecFailed;
            const totalSkipped = (stats.skipped || stats.pending || totalSpecSkipped);

            format.push({
                "Sl No": "--",
                "Spec File Name": "Total",
                "Total TC": totalTests,
                "Total Passed TC": totalPassed,
                "Total Failed TC": totalFailed,
                "Total Skipped TC": totalSkipped
            });

            return format;
        } catch (error) {
            console.error('Error formatting results:', error);
            return [{
                "Sl No": 1,
                "Spec File Name": "Error",
                "Total TC": 0,
                "Total Passed TC": 0,
                "Total Failed TC": 0,
                "Total Skipped TC": 0
            }];
        }
    }

    /**
     * Creates message body for Cliq
     */
    createMessageBody(results) {
        const format = this.formatResults(results);
        const isFailed = results.stats && results.stats.failures > 0;

        if (isFailed && results.stats.tests === (results.stats.failures + results.stats.skipped) && results.stats.failures === 1) {
            return {
                "text": `Pre-validation failure for ${this.options.testEnv}. Basic test scenario failed.`,
                "bot": {
                    "name": this.options.botName,
                    "image": this.options.botImage
                },
                "card": {
                    "theme": "prompt",
                    "title": "Alert! -- Test Failure in " + this.options.testEnv
                }
            };
        } else {
            return {
                "text": `Hi Team! Test execution results for ${this.options.testEnv}`,
                "bot": {
                    "name": this.options.botName,
                    "image": this.options.botImage
                },
                "card": {
                    "title": this.options.testEnv,
                    "theme": "modern-inline"
                },
                "slides": [
                    {
                        "type": "table",
                        "title": "Details of Execution",
                        "data": {
                            "headers": [
                                "Sl No",
                                "Spec File Name",
                                "Total TC",
                                "Total Passed TC",
                                "Total Failed TC",
                                "Total Skipped TC"
                            ],
                            "rows": format
                        }
                    }
                ]
            };
        }
    }

    /**
     * Get test summary for notifications
     */
    getTestSummary(results) {
        if (!results || !results.stats) {
            return 'Test execution completed (no stats available)';
        }

        const { stats } = results;
        const total = stats.tests || 0;
        const passed = stats.passes || 0;
        const failed = stats.failures || 0;
        const skipped = stats.skipped || stats.pending || 0;

        if (failed === 0) {
            return `✅ All ${total} tests passed! Environment: ${this.options.testEnv}`;
        } else {
            return `⚠️ ${failed} of ${total} tests failed in ${this.options.testEnv}. ${passed} passed, ${skipped} skipped.`;
        }
    }

    /**
     * Main method: Send test results and HTML report to Cliq
     */
    async sendMessageToCliq(results) {
        try {
            console.log(`📢 Starting Cliq report for channel: ${this.options.channelName}`);
            
            // Test connection first
            const connectionOk = await this.cliqClient.testConnection();
            if (!connectionOk) {
                throw new Error('Connection test failed');
            }
            
            // Send test results message with rich formatting
            const messageBody = this.createMessageBody(results);
            await this.cliqClient.sendMessage(this.options.channelName, messageBody);
            
            // Upload HTML report if it exists
            const reportPath = path.join(this.options.reportDir, this.options.reportFile);
            if (fs.existsSync(reportPath)) {
                const fileName = `${this.options.testEnv}_report.html`;
                await this.cliqClient.uploadFile(
                    this.options.channelName, 
                    reportPath, 
                    { filename: fileName }
                );
                console.log('🎉 Test results and HTML report sent to Cliq successfully');
            } else {
                console.warn(`⚠️ Report file not found: ${reportPath}`);
                console.log('✅ Test results sent to Cliq (without HTML report)');
            }
            
        } catch (error) {
            console.error('💥 Failed to send message to Cliq:', error.message);
            
            // Try to send error notification
            try {
                await this.cliqClient.sendNotification(
                    this.options.channelName,
                    'error',
                    `Failed to send test report: ${error.message}`
                );
            } catch (notificationError) {
                console.error('❌ Failed to send error notification:', notificationError.message);
            }
            
            throw error;
        }
    }

    /**
     * Send only test results (no file upload)
     */
    async sendResultsOnly(results) {
        try {
            console.log(`📊 Sending test results to channel: ${this.options.channelName}`);
            
            const messageBody = this.createMessageBody(results);
            await this.cliqClient.sendMessage(this.options.channelName, messageBody);
            
            console.log('✅ Test results sent to Cliq');
        } catch (error) {
            console.error('💥 Failed to send results:', error.message);
            throw error;
        }
    }

    /**
     * Send only HTML report (no test results message)
     */
    async sendReportOnly() {
        try {
            console.log(`📁 Sending HTML report to channel: ${this.options.channelName}`);
            
            const reportPath = path.join(this.options.reportDir, this.options.reportFile);
            if (!fs.existsSync(reportPath)) {
                throw new Error(`Report file not found: ${reportPath}`);
            }

            const fileName = `${this.options.testEnv}_report.html`;
            await this.cliqClient.uploadFile(
                this.options.channelName, 
                reportPath, 
                { filename: fileName }
            );
            
            console.log('✅ HTML report sent to Cliq');
        } catch (error) {
            console.error('💥 Failed to send report:', error.message);
            throw error;
        }
    }

    /**
     * Send simple notification with test summary
     */
    async sendSummaryNotification(results) {
        try {
            const summary = this.getTestSummary(results);
            const notificationType = (results.stats && results.stats.failures > 0) ? 'warning' : 'success';
            
            await this.cliqClient.sendNotification(
                this.options.channelName, 
                notificationType, 
                summary
            );
            
            console.log('✅ Summary notification sent to Cliq');
        } catch (error) {
            console.error('💥 Failed to send summary notification:', error.message);
            throw error;
        }
    }

    /**
     * Send test start notification
     */
    async sendTestStartNotification() {
        try {
            await this.cliqClient.sendNotification(
                this.options.channelName,
                'info',
                `🚀 Starting test execution for ${this.options.testEnv}...`
            );
            
            console.log('✅ Test start notification sent');
        } catch (error) {
            console.error('💥 Failed to send start notification:', error.message);
            throw error;
        }
    }

    /**
     * Send custom message
     */
    async sendCustomMessage(message, type = 'info') {
        try {
            await this.cliqClient.sendNotification(this.options.channelName, type, message);
            console.log('✅ Custom message sent to Cliq');
        } catch (error) {
            console.error('💥 Failed to send custom message:', error.message);
            throw error;
        }
    }

    /**
     * Send multiple files (e.g., screenshots, logs, reports)
     */
    async sendMultipleFiles(filePaths, message = null) {
        try {
            const initialMessage = message || `📎 Uploading ${filePaths.length} files for ${this.options.testEnv}`;
            
            await this.cliqClient.uploadMultipleFiles(
                this.options.channelName,
                filePaths,
                initialMessage
            );
            
            console.log('✅ Multiple files sent to Cliq');
        } catch (error) {
            console.error('💥 Failed to send multiple files:', error.message);
            throw error;
        }
    }
}

export default CliqReporter;