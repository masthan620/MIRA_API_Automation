# MIRA API Test Automation Framework

## Overview
This API test automation framework is built using WebdriverIO with Cucumber for BDD-style API testing. The framework provides comprehensive database integration, service layer architecture, and automated reporting capabilities.

## Technology Stack
- **WebdriverIO**: Core test runner and automation framework
- **Cucumber**: BDD test specification with Gherkin syntax
- **Chai**: Assertion library for test validations
- **PostgreSQL**: Database integration for data validation
- **Node.js**: JavaScript runtime environment
- **Knex.js**: SQL query builder for database operations
- **Zoho Cliq**: Automated test reporting integration

## Prerequisites
- Node.js v20 or higher
- npm v6 or higher
- Access to the application's API endpoints
- Database access credentials (PostgreSQL)
- Zoho Cliq credentials (for reporting)

## Project Setup

### 1. Clone the Repository
```bash
git clone https://<user-name>@bitbucket.org/ei-india-admin/mira-api-tests.git
```

```bash
cd mira-api-tests
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=your_database_host
DB_PORT=5432
DB_USER=your_database_user
DB_PASSWORD=your_database_password
AVAILABLE_DATABASES=devicemanagement,usermanagement,your_other_dbs

# Zoho Cliq Configuration (Optional - for reporting)
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token
```

## Framework Architecture

### Service Layer
The framework implements a service layer pattern for database operations:

- **DatabaseFactory**: Manages database connections and connection pooling
- **ServiceFactory**: Creates and caches service instances for different tables
- **BaseDbService**: Provides common CRUD operations for any table
- **Specialized Services**: Extended services for specific entities (Users, Devices, etc.)

### Key Components

#### Database Services
```javascript
// Get a general database service
const userService = serviceFactory.getDbService('usermanagement', 'users');

// Get specialized services
const deviceService = serviceFactory.getDevicesService('devicemanagement');
const userService = serviceFactory.getUsersService('usermanagement');
```

#### Reporting Integration
- **CliqService**: WebdriverIO service for automated test reporting
- **CliqReporter**: Formats and sends test results to Zoho Cliq channels

## Project Structure
```
mira-api-tests/
├── features/
│   ├── step-definitions/
│   │   └── steps.js              # Cucumber step definitions
│   └── *.feature                 # Gherkin feature files
├── services/
│   ├── db-factory.js             # Database connection factory
│   ├── service-factory.js        # Service creation and caching
│   └── base-db-service.js        # Base database service class
├── reports/                      # Test execution reports
├── allure-results/              # Allure test results
├── cliq-service.js              # Cliq integration service
├── wdio-cliq-reporter.js        # Cliq reporter implementation
├── wdio.conf.js                 # WebdriverIO configuration
├── package.json
└── README.md
```

## Usage

### Running Tests
```bash
npm test
```

### Running Specific Features
```bash
npx wdio run wdio.conf.js --spec features/your-feature.feature
```

### Database Operations in Tests
```javascript
// Example step definition using database services
const { Given, When, Then } = require('@wdio/cucumber-framework');
const serviceFactory = require('../services/service-factory');

Given('a user exists in the database', async function() {
    const userService = serviceFactory.getUsersService('usermanagement');
    const user = await userService.getUserByEmail('test@example.com');
    expect(user).to.exist;
});

When('I create a new device', async function() {
    const deviceService = serviceFactory.getDevicesService('devicemanagement');
    const deviceData = {
        serial_number: 'DEV123456',
        model: 'TestDevice',
        status: 'active'
    };
    this.createdDevice = await deviceService.insert(deviceData);
});

Then('the device should exist in the database', async function() {
    const deviceService = serviceFactory.getDevicesService('devicemanagement');
    const exists = await deviceService.deviceExists(this.createdDevice[0].id);
    expect(exists).to.be.true;
});
```

### Writing Feature Files
```gherkin
Feature: Device Management API
  As a system administrator
  I want to manage devices through the API
  So that I can maintain device inventory

  Scenario: Create a new device
    Given the device management system is available
    When I send a POST request to create a device with serial number "DEV123456"
    Then the response status should be 201
    And the device should exist in the database
    And the device status should be "active"

  Scenario: Retrieve device by serial number
    Given a device with serial number "DEV123456" exists
    When I send a GET request for device "DEV123456"
    Then the response status should be 200
    And the response should contain device details
```

## Configuration

### WebdriverIO Configuration
The framework uses WebdriverIO configuration for test execution. Key configurations include:
- Test specs location
- Cucumber framework setup
- Database service integration
- Cliq reporting service

### Database Configuration
- Supports multiple PostgreSQL databases
- Connection pooling and management
- Environment-based configuration
- Validation of required credentials

## Reporting

### Cliq Integration
The framework automatically sends test results to Zoho Cliq channels:
- Test execution summary
- Pass/fail statistics per feature
- Detailed test results
- Environment information

### Allure Reports
Generate detailed HTML reports:
```bash
npx allure generate allure-results --clean
```

```bash
npx allure open
```

## Best Practices

### Database Testing
1. Use transactions for test isolation
2. Clean up test data after execution
3. Use meaningful test data
4. Validate both API responses and database state

### Step Definitions
1. Keep steps reusable and atomic
2. Use the service layer for database operations
3. Store test context in the Cucumber world object
4. Implement proper error handling

### Feature Files
1. Write clear, business-readable scenarios
2. Use Background steps for common setup
3. Implement data tables for multiple test cases
4. Keep scenarios focused and independent

## Troubleshooting

### Common Issues
1. **Database Connection Errors**: Verify environment variables and database accessibility
2. **Service Creation Failures**: Check database and table names in service factory calls
3. **Cliq Reporting Issues**: Validate Zoho credentials and network connectivity

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

## Contributing
1. Follow the existing code structure and patterns
2. Add appropriate test coverage for new features
3. Update documentation for any new functionality
4. Ensure all tests pass before submitting changes

## Support
For issues and questions, please contact the development team or create an issue in the repository.
