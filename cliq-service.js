import CliqReporter from './wdio-cliq-reporter.js';
import fs from 'fs';
import path from 'path';

class CliqService {
    constructor(options) {
        this.options = options;
        this.reporter = new CliqReporter(options);
    }

    // Hook that runs after all tests are completed
    async onComplete(exitCode, config, capabilities, results) {
        console.log('Sending test results to Cliq channel...');

        try {
            // If results is undefined or missing stats, try to generate results from allure-results
            if (!results || !results.stats) {
                console.log('Test results not available, attempting to build results from allure data...');

                // Create a mock results object based on allure-results directory
                const mockResults = await this.buildResultsFromAllure();
                if (mockResults) {
                    await this.reporter.sendMessageToCliq(mockResults);
                } else {
                    console.error('Could not generate results from allure data');
                }
            } else {
                // If results are properly structured, use them
                await this.reporter.sendMessageToCliq(results);
            }
        } catch (error) {
            console.error('Failed to send message to Cliq:', error.message);
        }
    }

    /**
     * Build a results object from allure-results if available
     */
    async buildResultsFromAllure() {
        try {
            const allureResultsDir = './allure-results';

            if (!fs.existsSync(allureResultsDir)) {
                console.error('Allure results directory not found');
                return null;
            }

            const files = fs.readdirSync(allureResultsDir);
            const resultFiles = files.filter(file => file.endsWith('-result.json'));
            const containerFiles = files.filter(file => file.endsWith('-container.json'));

            const featureMap = new Map();
            const testIdToFeatureMap = new Map();

            // Process containers to find feature-to-test relationships
            containerFiles.forEach(file => {
                try {
                    const container = JSON.parse(fs.readFileSync(path.join(allureResultsDir, file), 'utf8'));

                    if (container.children && container.children.length > 0) {
                        const featureName = container.name || 'Unknown Feature';

                        if (!featureMap.has(featureName)) {
                            featureMap.set(featureName, {
                                file: container.name,
                                tests: [],
                                passes: 0,
                                failures: 0,
                                skipped: 0,
                                pending: 0,
                                total: 0
                            });
                        }

                        container.children.forEach(testId => {
                            testIdToFeatureMap.set(testId, featureName);
                        });
                    }
                } catch (err) {
                    console.error(`Error processing container file ${file}:`, err);
                }
            });

            // Process test result files
            let totalPasses = 0;
            let totalFailures = 0;
            let totalSkipped = 0;
            let totalDuration = 0;

            resultFiles.forEach(file => {
                try {
                    const testResult = JSON.parse(fs.readFileSync(path.join(allureResultsDir, file), 'utf8'));
                    const testId = testResult.uuid;
                    const testName = testResult.name || 'Unknown test';
                    const status = testResult.status;
                    let duration = 0;

                    if (testResult.time && testResult.time.duration) {
                        duration = testResult.time.duration;
                        totalDuration += duration;
                    }

                    const isPassed = status === 'passed';
                    const isFailed = status === 'failed' || status === 'broken';
                    const isSkipped = status === 'skipped' || status === 'pending';

                    if (isPassed) totalPasses++;
                    if (isFailed) totalFailures++;
                    if (isSkipped) totalSkipped++;

                    const featureName = testIdToFeatureMap.get(testId) || 'Device Management';

                    if (!featureMap.has(featureName)) {
                        featureMap.set(featureName, {
                            file: featureName,
                            tests: [],
                            passes: 0,
                            failures: 0,
                            skipped: 0,
                            pending: 0,
                            total: 0
                        });
                    }

                    const feature = featureMap.get(featureName);
                    feature.total++;
                    if (isPassed) feature.passes++;
                    if (isFailed) feature.failures++;
                    if (isSkipped) {
                        feature.skipped++;
                        feature.pending++;
                    }

                    feature.tests.push({
                        name: testName,
                        status: status,
                        state: isPassed ? 'passed' : (isFailed ? 'failed' : 'skipped'),
                        duration: duration
                    });

                } catch (err) {
                    console.error(`Error processing result file ${file}:`, err);
                }
            });

            // Fallback: No features found, create default one
            if (featureMap.size === 0) {
                const testObjects = [];

                for (let i = 0; i < totalPasses; i++) {
                    testObjects.push({ 
                        name: `Passed Test ${i+1}`,
                        state: 'passed',
                        status: 'passed',
                        duration: 0 
                    });
                }

                for (let i = 0; i < totalFailures; i++) {
                    testObjects.push({ 
                        name: `Failed Test ${i+1}`,
                        state: 'failed',
                        status: 'failed',
                        duration: 0 
                    });
                }

                for (let i = 0; i < totalSkipped; i++) {
                    testObjects.push({ 
                        name: `Skipped Test ${i+1}`,
                        state: 'skipped',
                        status: 'skipped',
                        duration: 0 
                    });
                }

                featureMap.set('Device Management', {
                    file: 'Device Management',
                    tests: testObjects,
                    passes: totalPasses,
                    failures: totalFailures,
                    skipped: totalSkipped,
                    pending: totalSkipped,
                    total: totalPasses + totalFailures + totalSkipped
                });
            }

            const specs = Array.from(featureMap.values());

            console.log('Built results from Allure (Cucumber format):', {
                stats: {
                    tests: totalPasses + totalFailures + totalSkipped,
                    passes: totalPasses,
                    failures: totalFailures,
                    pending: totalSkipped,
                    skipped: totalSkipped,
                    duration: totalDuration
                },
                specs: specs
            });

            return {
                stats: {
                    tests: totalPasses + totalFailures + totalSkipped,
                    passes: totalPasses,
                    failures: totalFailures,
                    pending: totalSkipped,
                    skipped: totalSkipped,
                    duration: totalDuration
                },
                specs: specs
            };

        } catch (error) {
            console.error('Error building results from allure:', error);
            return null;
        }
    }
}

export default CliqService;
