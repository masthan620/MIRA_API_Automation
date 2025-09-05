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
        if (!results || !results.stats) {
            console.warn('Invalid results object structure. Using default values.');
            return [{
                "Sl No": 1,
                "Spec File Name": "Unknown",
                "🔢 Total TC": 0,
                "✅ Passed TC": 0,
                "❌ Failed TC": 0,
                "⏭️ Skipped TC": 0
            }];
        }

        const { stats } = results;
        const specs = results.specs || results.suites || [];
        const format = [];

        try {
            // Debug logging to understand the structure
            console.log('Results structure debug:', {
                hasSpecs: !!results.specs,
                hasSuites: !!results.suites,
                specsLength: specs.length,
                statsKeys: Object.keys(stats),
                firstSpec: specs[0] ? Object.keys(specs[0]) : 'No specs'
            });

            specs.forEach((spec, index) => {
                const specFile = spec.file || spec.title || spec.name || 'Unknown';
                const specName = specFile.includes('/') || specFile.includes('\\') 
                    ? path.basename(specFile, path.extname(specFile))
                    : specFile;

                // Handle the data structure from buildResultsFromAllure()
                let totalTests = spec.total || 0;
                let passedTests = spec.passes || 0;
                let failedTests = spec.failures || 0;
                let skippedTests = spec.skipped || spec.pending || 0;

                // If direct properties are not available, try alternative approaches
                if (totalTests === 0 && spec.tests && Array.isArray(spec.tests)) {
                    totalTests = spec.tests.length;
                    passedTests = spec.tests.filter(t => t && (t.state === 'passed' || t.status === 'passed')).length;
                    failedTests = spec.tests.filter(t => t && (t.state === 'failed' || t.status === 'failed')).length;
                    skippedTests = spec.tests.filter(t => t && (t.state === 'skipped' || t.state === 'pending' || t.status === 'skipped')).length;
                }

                // Fallback: try other property variations
                if (totalTests === 0) {
                    totalTests = spec.tests?.length || spec.suites?.length || 
                               (passedTests + failedTests + skippedTests);
                    passedTests = passedTests || spec.passed || 0;
                    failedTests = failedTests || spec.failed || spec.errors || 0;
                    skippedTests = skippedTests || spec.skip || 0;
                }

                // Ensure we have valid numbers
                totalTests = Math.max(0, parseInt(totalTests) || 0);
                passedTests = Math.max(0, parseInt(passedTests) || 0);
                failedTests = Math.max(0, parseInt(failedTests) || 0);
                skippedTests = Math.max(0, parseInt(skippedTests) || 0);

                // If totalTests is still 0, calculate from other counts
                if (totalTests === 0) {
                    totalTests = passedTests + failedTests + skippedTests;
                }

                console.log(`Spec ${index + 1} (${specName}):`, {
                    original: spec,
                    calculated: {
                        total: totalTests,
                        passed: passedTests,
                        failed: failedTests,
                        skipped: skippedTests
                    }
                });

                format.push({
                    "Sl No": index + 1,
                    "Spec File Name": specName,
                    "🔢 Total TC": totalTests,
                    "✅ Passed TC": passedTests, 
                    "❌ Failed TC": failedTests,
                    "⏭️ Skipped TC": skippedTests
                });
            });

            // Calculate totals from specs or use stats
            let totalSpecTests = 0, totalSpecPassed = 0, totalSpecFailed = 0, totalSpecSkipped = 0;
            format.forEach(row => {
                if (row["Sl No"] !== "--") {
                    totalSpecTests += row["🔢 Total TC"] || 0;
                    totalSpecPassed += row["✅ Passed TC"] || 0;
                    totalSpecFailed += row["❌ Failed TC"] || 0;
                    totalSpecSkipped += row["⏭️ Skipped TC"] || 0;
                }
            });

            // Use stats if available, otherwise use calculated totals
            const totalTests = stats.tests || stats.total || totalSpecTests;
            const totalPassed = stats.passes || stats.passed || totalSpecPassed;
            const totalFailed = stats.failures || stats.failed || stats.errors || totalSpecFailed;
            const totalSkipped = stats.skipped || stats.pending || stats.skip || totalSpecSkipped;

            format.push({
                "Sl No": "--",
                "Spec File Name": "Total",
                "🔢 Total TC": totalTests,
                "✅ Passed TC": totalPassed,
                "❌ Failed TC": totalFailed,
                "⏭️ Skipped TC": totalSkipped
            });

            console.log('Final formatted results:', format);
            return format;
        } catch (error) {
            console.error('Error formatting results:', error);
            console.error('Results object:', JSON.stringify(results, null, 2));
            return [{
                "Sl No": 1,
                "Spec File Name": "Error",
                "🔢 Total TC": 0,
                "✅ Passed TC": 0,
                "❌ Failed TC": 0,
                "⏭️ Skipped TC": 0
            }];
        }
    }

    /**
     * Creates message body for Cliq
     */
    createMessageBody(results) {
        const format = this.formatResults(results);
        const isFailed = results.stats && results.stats.failures > 0;
        const totalTests = results.stats ? results.stats.tests : 0;
        const totalFailures = results.stats ? results.stats.failures : 0;
        const totalPassed = results.stats ? results.stats.passes : 0;
        const totalSkipped = results.stats ? (results.stats.skipped || results.stats.pending || 0) : 0;

        // Create a single, clean message
        const statusIcon = isFailed ? '⚠️' : '✅';
        const statusText = isFailed ? 'completed with issues' : 'completed successfully';
        
        const messageText = `${statusIcon} **Test execution ${statusText} for ${this.options.testEnv}**\n\n` +
            `📊 **Summary:** ${totalPassed}/${totalTests} tests passed` +
            (totalFailures > 0 ? ` • ${totalFailures} failed` : '') +
            (totalSkipped > 0 ? ` • ${totalSkipped} skipped` : '');
        
        const cardTheme = isFailed ? 'prompt' : 'modern-inline';
        const cardTitle = `Test Results - ${this.options.testEnv}`;

        return {
            "text": messageText,
            "bot": {
                "name": this.options.botName,
                "image": this.options.botImage
            },
            "card": {
                "title": cardTitle,
                "theme": cardTheme
            },
            "slides": [
                {
                    "type": "table",
                    "title": "📋 Detailed Execution Results",
                    "data": {
                        "headers": [
                            "Sl No",
                            "Spec File Name",
                            "🔢 Total TC",
                            "✅ Passed TC",
                            "❌ Failed TC",
                            "⏭️ Skipped TC"
                        ],
                        "rows": format
                    }
                }
            ]
        };
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