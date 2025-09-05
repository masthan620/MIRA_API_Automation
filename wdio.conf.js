import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import CliqService from './cliq-service.js'; // Update with actual path
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to delete the contents of a folder
const deleteFolderContents = (folderPath) => {
  try {
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        fs.rmSync(filePath, { recursive: true, force: true });
      }
      console.log(`✅ Deleted contents of ${folderPath}`);
    }
  } catch (err) {
    console.error(`❌ Failed to delete contents of ${folderPath}:`, err);
  }
};

// Function to check if we're running in Jenkins
const isJenkins = () => {
  return process.env.JENKINS_URL !== undefined || process.env.JENKINS_HOME !== undefined;
};

// Function to run a shell command and return a Promise
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    console.log(`Executing command: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing "${command}": ${error.message}`);
        reject(error);
      } else if (stderr && !stdout) {
        console.error(`Stderr from "${command}": ${stderr}`);
        reject(new Error(stderr));
      } else {
        console.log(`Command executed: ${command}`);
        if (stdout) console.log(stdout.trim());
        resolve(stdout);
      }
    });
  });
};

// Function to check if the --sendCliq flag is passed
const isCliqEnabled = () => process.argv.includes('--sendCliq');

// Function to parse command line arguments and extract additional parameters
const parseCommandLineArgs = () => {
  const args = process.argv;
  const cliqIndex = args.indexOf('--sendCliq');
  
  if (cliqIndex === -1) {
    return { enabled: false };
  }
  
  const result = { enabled: true };
  
  // Parse arguments after --sendCliq
  for (let i = cliqIndex + 1; i < args.length; i++) {
    const arg = args[i];
    
    // Skip if this is another --flag
    if (arg.startsWith('--')) {
      // Handle --key=value format for compatibility
      if (arg.includes('=')) {
        const [key, value] = arg.split('=', 2);
        result[key.substring(2)] = value;
      } else {
        // Handle --key value format
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith('--') && !nextArg.includes(':')) {
          result[arg.substring(2)] = nextArg;
          i++; // Skip next argument as it's been consumed
        } else {
          result[arg.substring(2)] = true; // Boolean flag
        }
      }
    } else if (arg.includes(':')) {
      // Handle key:value format (preferred)
      const [key, value] = arg.split(':', 2);
      if (key && value) {
        result[key.trim()] = value.trim();
      }
    }
  }
  
  return result;
};

// Function to display usage information for Cliq parameters
const displayCliqUsage = () => {
  console.log(`
📖 Cliq Integration Usage:
wdio run wdio.conf.js --sendCliq [key:value pairs]

Available parameters (key:value format):
  channel:<name>           Cliq channel name (default: automationreports)
  env:<environment>        Test environment name (default: API Testing)
  reportDir:<path>         Report directory path (default: ./allure-single-file-report)
  reportFile:<name>        Report file name (default: index.html)
  botName:<name>           Bot display name
  botImage:<url>           Bot avatar image URL
  clientId:<id>            Zoho client ID (overrides env var)
  clientSecret:<secret>    Zoho client secret (overrides env var)
  refreshToken:<token>     Zoho refresh token (overrides env var)

Examples:
  wdio run wdio.conf.js --sendCliq channel:myteam env:staging
  wdio run wdio.conf.js --sendCliq channel:qa-reports env:"Production Tests"
  wdio run wdio.conf.js --sendCliq env:dev botName:"Dev Test Bot"
  wdio run wdio.conf.js --sendCliq channel:automation env:prod reportDir:./reports

Legacy --key=value format is also supported for compatibility:
  wdio run wdio.conf.js --sendCliq --channel=myteam --env=staging
`);
};

// Parse command line arguments
const cliqArgs = parseCommandLineArgs();

// Display usage if help is requested
if (cliqArgs.enabled && (cliqArgs.help || cliqArgs.h)) {
  displayCliqUsage();
  process.exit(0);
}

// Conditional loading of the Cliq service
const services = [];
if (cliqArgs.enabled) {
  console.log('🔔 Cliq notification enabled');
  console.log('📋 Cliq arguments:', cliqArgs);
  
  // Use command line arguments with fallbacks to environment variables and defaults
  const cliqConfig = {
    channelName: cliqArgs.channel || cliqArgs.channelName || process.env.ZOHO_CHANNEL_NAME || 'automationreports',
    reportDir: cliqArgs.reportDir || './allure-single-file-report',
    reportFile: cliqArgs.reportFile || 'index.html',
    testEnv: cliqArgs.env || cliqArgs.testEnv || cliqArgs.environment || 'API Testing',
    botName: cliqArgs.botName || 'Mira API Test Automation Summary',
    botImage: cliqArgs.botImage || 'https://static-asset.inc42.com/logo/educational-initiatives.png',
    clientId: cliqArgs.clientId || process.env.ZOHO_CLIENT_ID || 'your-client-id',
    clientSecret: cliqArgs.clientSecret || process.env.ZOHO_CLIENT_SECRET || 'your-client-secret',
    refreshToken: cliqArgs.refreshToken || process.env.ZOHO_REFRESH_TOKEN || 'your-refresh-token'
  };
  
  services.push([CliqService, cliqConfig]);
  console.log('✅ Cliq service configured:', {
    channel: cliqConfig.channelName,
    testEnv: cliqConfig.testEnv,
    reportDir: cliqConfig.reportDir
  });
} else {
  console.log('🔕 Cliq notification disabled');
}

export const config = {
  //
  // ====================
  // Runner Configuration
  // ====================
  // WebdriverIO supports running e2e tests as well as unit and component tests.
  runner: 'local',
  //
  // ==================
  // Specify Test Files
  // ==================
  // Define which test specs should run. The pattern is relative to the directory
  // of the configuration file being run.
  //
  // The specs are defined as an array of spec files (optionally using wildcards
  // that will be expanded). The test for each spec file will be run in a separate
  // worker process. In order to have a group of spec files run in the same worker
  // process simply enclose them in an array within the specs array.
  //
  // The path of the spec files will be resolved relative from the directory of
  // of the config file unless it's absolute.
  //
  specs: [
    './features/api/**/*.feature'
  ],
  // Patterns to exclude.
  exclude: [
    // 'path/to/excluded/files'
  ],
  // ============
  // Capabilities
  // ============
  // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
  // time. Depending on the number of capabilities, WebdriverIO launches several test
  // sessions. Within your capabilities you can overwrite the spec and exclude options in
  // order to group specific specs to a specific capability.
  //
  // First, you can define how many instances should be started at the same time. Let's
  // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
  // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
  // files and you set maxInstances to 10, all spec files will get tested at the same time
  // and 30 processes will get spawned. The property handles how many capabilities
  // from the same test should run tests.
  //
  maxInstances: 10,
  //
  // If you have trouble getting all important capabilities together, check out the
  // Sauce Labs platform configurator - a great tool to configure your capabilities:
  // https://saucelabs.com/platform/platform-configurator
  //
  capabilities: [{
    browserName: 'chrome'
  }],
  //
  // ===================
  // Test Configurations
  // ===================
  // Define all options that are relevant for the WebdriverIO instance here
  //
  // Level of logging verbosity: trace | debug | info | warn | error | silent
  logLevel: 'silent',
  //
  // Set specific log levels per logger
  // loggers:
  // - webdriver, webdriverio
  // - @wdio/browserstack-service, @wdio/lighthouse-service, @wdio/sauce-service
  // - @wdio/mocha-framework, @wdio/jasmine-framework
  // - @wdio/local-runner
  // - @wdio/sumologic-reporter
  // - @wdio/cli, @wdio/config, @wdio/utils
  // Level of logging verbosity: trace | debug | info | warn | error | silent
  // logLevels: {
  //     webdriver: 'info',
  //     '@wdio/appium-service': 'info'
  // },
  //
  // If you only want to run your tests until a specific amount of tests have failed use
  // bail (default is 0 - don't bail, run all tests).
  bail: 0,
  //
  // Set a base URL in order to shorten url command calls. If your `url` parameter starts
  // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
  // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
  // gets prepended directly.
  // baseUrl: 'http://localhost:8080',
  //
  // Default timeout for all waitFor* commands.

  waitforTimeout: 10000,
  //
  // Default timeout in milliseconds for request
  // if browser driver or grid doesn't send response
  connectionRetryTimeout: 120000,
  //
  // Default request retries count
  connectionRetryCount: 3,
  //
  // Framework you want to run your specs with.
  // The following are supported: Mocha, Jasmine, and Cucumber
  // see also: https://webdriver.io/docs/frameworks
  //
  // Make sure you have the wdio adapter package for the specific framework installed
  // before running any tests.
  framework: 'cucumber',
  
  // Add the Cliq service to the services array
  //
  // Test runner services
  // Services take over a specific job you don't want to take care of. They enhance
  // your test setup with almost no effort. Unlike plugins, they don't add new
  // commands. Instead, they hook themselves up into the test process.
  services: services, // Use the dynamically created services array
  // services: [
  //   [CliqService, {
  //     channelName: 'automationreports', // Replace with your actual channel name
  //     reportDir: './allure-single-file-report', // Directory where the final report is generated
  //     reportFile: 'index.html', // Main report file name
  //     testEnv: 'API Testing', // Custom name for your test environment
  //     botName: 'Mira WDIO Reporter', // Name shown in Cliq
  //     botImage: 'https://webdriver.io/img/webdriverio.png', // Image URL for bot avatar
  //     // These can be set through environment variables or directly here (not recommended for credentials)
  //     clientId: process.env.ZOHO_CLIENT_ID || 'your-client-id',
  //     clientSecret: process.env.ZOHO_CLIENT_SECRET || 'your-client-secret',
  //     /**
  //      * Zoho refresh token for authentication, sourced from environment variable or a default placeholder.
  //      * @type {string}
  //      * @description Used for obtaining new access tokens when the current token expires.
  //      * @default 'your-refresh-token' - Placeholder value if no environment variable is set
  //      */
  //     refreshToken: process.env.ZOHO_REFRESH_TOKEN || 'your-refresh-token'
  //   }]
  // ], 
  //
  // The number of times to retry the entire specfile when it fails as a whole
  // specFileRetries: 1,
  //
  // Delay in seconds between the spec file retry attempts
  // specFileRetriesDelay: 0,
  //
  // Whether or not retried spec files should be retried immediately or deferred to the end of the queue
  // specFileRetriesDeferred: false,
  //
  // Test reporter for stdout.
  // The only one supported by default is 'dot'
  // see also: https://webdriver.io/docs/dot-reporter
  
  reporters: ['spec', ['allure', {
    outputDir: 'allure-results',
    disableWebdriverStepsReporting: false,
    disableWebdriverScreenshotsReporting: false,
    useCucumberStepReporter: true
  }]],
  // If you are using Cucumber you need to specify the location of your step definitions.
  cucumberOpts: {
    require: ['./features/step-definitions/*.js'],
    // <boolean> show full backtrace for errors
    backtrace: false,
    // <boolean> invoke formatters without executing steps
    dryRun: false,
    // <boolean> abort the run on first failure
    failFast: false,
    // <boolean> fail if there are any undefined or pending steps
    strict: true,
    // <number> timeout for step definitions
    timeout: 60000,
    // <boolean> Enable this config to treat undefined definitions as warnings.
    ignoreUndefinedDefinitions: false
  },
  //
  // =====
  // Hooks
  // =====
  // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
  // it and to build services around it. You can either apply a single function or an array of
  // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
  // resolved to continue.
  /**
   * Gets executed once before all workers get launched.
   * @param {object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   */
  // onPrepare: function (config, capabilities) {
  // },
  /**
   * Gets executed before a worker process is spawned and can be used to initialize specific service
   * for that worker as well as modify runtime environments in an async fashion.
   * @param  {string} cid      capability id (e.g 0-0)
   * @param  {object} caps     object containing capabilities for session that will be spawn in the worker
   * @param  {object} specs    specs to be run in the worker process
   * @param  {object} args     object that will be merged with the main configuration once worker is initialized
   * @param  {object} execArgv list of string arguments passed to the worker process
   */
  // onWorkerStart: function (cid, caps, specs, args, execArgv) {
  // },
  /**
   * Gets executed just after a worker process has exited.
   * @param  {string} cid      capability id (e.g 0-0)
   * @param  {number} exitCode 0 - success, 1 - fail
   * @param  {object} specs    specs to be run in the worker process
   * @param  {number} retries  number of retries used
   */
  // onWorkerEnd: function (cid, exitCode, specs, retries) {
  // },
  /**
   * Gets executed just before initialising the webdriver session and test framework. It allows you
   * to manipulate configurations depending on the capability or spec.
   * @param {object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {Array.<String>} specs List of spec file paths that are to be run
   * @param {string} cid worker id (e.g. 0-0)
   */

  // beforeSession: function () {
  //   try {
  //     deleteFolderContents('./allure-results');
  //     deleteFolderContents('./allure-report');
  //     deleteFolderContents('./allure-single-file-report');
  //     console.log('✅ Cleaned Allure result/report directories');

  //     // Load global test data once for all sessions
  //     const testDataPath = path.resolve(__dirname, './test-data/testData.json');
  //     global.testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
  //     console.log('✅ Loaded global test data:', global.testData);
  //   } catch (error) {
  //     console.error('❌ Error cleaning allure directories:', error);
  //   }
  // }
  beforeSession: function () {
    try {
      deleteFolderContents('./allure-results');
      deleteFolderContents('./allure-report');
      deleteFolderContents('./allure-single-file-report');
      //console.log('✅ Cleaned Allure result/report directories');
  
      // Load global test data once for all sessions
      const testDataPath = path.resolve(__dirname, './test-data/testData.json');
      global.testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
      //console.log('✅ Loaded global test data:', global.testData);
  
      // ✨ Create environment.properties for Allure
      const envProps = [
        //`Platform=API Automation`,
        `Environment=${process.env.BASE_URL}`,
        `Browser=Chrome`,
        //`Build=${new Date().toLocaleString()}`,
        //`BaseURL=${process.env.BASE_URL || 'https://api.example.com'}`
      ];
      const envFilePath = path.join(__dirname, 'allure-results', 'environment.properties');
      fs.mkdirSync(path.dirname(envFilePath), { recursive: true });
      fs.writeFileSync(envFilePath, envProps.join('\n'), 'utf-8');
      console.log('✅ Written environment.properties to Allure results');
    } catch (error) {
      console.error('❌ Error during setup in beforeSession:', error);
    }
  },

  /**
  * Gets executed before test execution begins. At this point you can access to all global
  * variables like `browser`. It is the perfect place to define custom commands.
  * @param {Array.<Object>} capabilities list of capabilities details
  * @param {Array.<String>} specs        List of spec file paths that are to be run
  * @param {object}         browser      instance of created browser/device session
  */
  before: function () {
    const testDataPath = path.resolve(__dirname, './test-data/testData.json');
    global.testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
  },
 /**
  * Runs before a WebdriverIO command gets executed.
  * @param {string} commandName hook command name
  * @param {Array} args arguments that command would receive
  */
 // beforeCommand: function (commandName, args) {
 // },
 /**
  * Cucumber Hooks
  *
  * Runs before a Cucumber Feature.
  * @param {string}                   uri      path to feature file
  * @param {GherkinDocument.IFeature} feature  Cucumber feature object
  */
 // beforeFeature: function (uri, feature) {
 // },
 /**
  *
  * Runs before a Cucumber Scenario.
  * @param {ITestCaseHookParameter} world    world object containing information on pickle and test step
  * @param {object}                 context  Cucumber World object
  */
 // beforeScenario: function (world, context) {
 // },
 /**
  *
  * Runs before a Cucumber Step.
  * @param {Pickle.IPickleStep} step     step data
  * @param {IPickle}            scenario scenario pickle
  * @param {object}             context  Cucumber World object
  */
 // beforeStep: function (step, scenario, context) {
 // },
 /**
  *
  * Runs after a Cucumber Step.
  * @param {Pickle.IPickleStep} step             step data
  * @param {IPickle}            scenario         scenario pickle
  * @param {object}             result           results object containing scenario results
  * @param {boolean}            result.passed    true if scenario has passed
  * @param {string}             result.error     error stack if scenario failed
  * @param {number}             result.duration  duration of scenario in milliseconds
  * @param {object}             context          Cucumber World object
  */
 // afterStep: function (step, scenario, result, context) {
 // },
 /**
  *
  * Runs after a Cucumber Scenario.
  * @param {ITestCaseHookParameter} world            world object containing information on pickle and test step
  * @param {object}                 result           results object containing scenario results
  * @param {boolean}                result.passed    true if scenario has passed
  * @param {string}                 result.error     error stack if scenario failed
  * @param {number}                 result.duration  duration of scenario in milliseconds
  * @param {object}                 context          Cucumber World object
  */
 // afterScenario: function (world, result, context) {
 // },
 /**
  *
  * Runs after a Cucumber Feature.
  * @param {string}                   uri      path to feature file
  * @param {GherkinDocument.IFeature} feature  Cucumber feature object
  */
 // afterFeature: function (uri, feature) {
 // },
 
 /**
  * Runs after a WebdriverIO command gets executed
  * @param {string} commandName hook command name
  * @param {Array} args arguments that command would receive
  * @param {number} result 0 - command success, 1 - command error
  * @param {object} error error object if any
  */
 // afterCommand: function (commandName, args, result, error) {
 // },
 /**
  * Gets executed after all tests are done. You still have access to all global variables from
  * the test.
  * @param {number} result 0 - test pass, 1 - test fail
  * @param {Array.<Object>} capabilities list of capabilities details
  * @param {Array.<String>} specs List of spec file paths that ran
  */
 // after: function (result, capabilities, specs) {
 // },
 /**
  * Gets executed right after terminating the webdriver session.
  * @param {object} config wdio configuration object
  * @param {Array.<Object>} capabilities list of capabilities details
  * @param {Array.<String>} specs List of spec file paths that ran
  */
 // afterSession: function (config, capabilities, specs) {
 // },
 /**
  * Gets executed after all workers got shut down and the process is about to exit. An error
  * thrown in the onComplete hook will result in the test run failing.
  * @param {object} exitCode 0 - success, 1 - fail
  * @param {object} config wdio configuration object
  * @param {Array.<Object>} capabilities list of capabilities details
  * @param {<Object>} results object containing test results
  */
  onComplete: async function (exitCode, config, capabilities, results) {
    // Don't attempt to generate reports from here in Jenkins environment
    // if (isJenkins()) {
    //   console.log('Running in Jenkins environment. Skipping Allure report generation from within Node.js.');
    //   console.log('Reports will be generated by a separate Jenkins build step.');
    //   return;
    // }
    
    try {
      console.log('📄 Generating Allure standard HTML report...');
      // For local development environment only
      try {
        if (process.platform === 'win32') {
          await runCommand('cmd /c allure generate allure-results --clean -o allure-report');
        } else {
          await runCommand('/bin/bash -c "allure generate allure-results --clean -o allure-report"');
        }
        console.log('Report successfully generated to ./allure-report');
      } catch (error) {
        console.error('Failed to generate standard report:', error);
      }
      
      console.log('📄 Generating Allure single HTML file report...');
      try {
        if (process.platform === 'win32') {
          await runCommand('cmd /c allure generate --single-file allure-results --clean -o allure-single-file-report');
        } else {
          await runCommand('/bin/bash -c "allure generate --single-file allure-results --clean -o allure-single-file-report"');
        }
        console.log('Report successfully generated to ./allure-single-file-report');
      } catch (error) {
        console.error('Failed to generate single file report:', error);
      }
      
      console.log('✅ Allure reports generated successfully.');
      
      // The CliqService will handle sending reports to Cliq automatically
      // through the onComplete hook within the service
    } catch (error) {
      console.error('❌ Failed to generate Allure reports:', error);
    }
  }/**
    * Gets executed when a refresh happens.
    * @param {string} oldSessionId session ID of the old session
    * @param {string} newSessionId session ID of the new session
    */
    // onReload: function(oldSessionId, newSessionId) {
    // }
    /**
    * Hook that gets executed before a WebdriverIO assertion happens.
    * @param {object} params information about the assertion to be executed
    */
    // beforeAssertion: function(params) {
    /**
    * Hook that gets executed after a WebdriverIO assertion happened.
    * @param {object} params information about the assertion that was executed, including its results
    */
    // afterAssertion: function(params) {
    // }
};