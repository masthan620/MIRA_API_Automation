import { Given, When, Then, After } from '@wdio/cucumber-framework';
import SnowflakeService from '../../services/snowflake-service.js';
import { expect } from 'chai';

let snowflakeService;
let dbQueryResult;

Given('I establish connection to Snowflake database',{ timeout: 120000 }, async function() {
  snowflakeService = new SnowflakeService();
  try {
    await snowflakeService.connect();
    console.log('Database connection established for test');
  } catch (error) {
    throw new Error(`Failed to connect to Snowflake: ${error.message}`);
  }
});

When('I execute query {string}', async function(query) {
  try {
    dbQueryResult = await snowflakeService.executeQuery(query);
    console.log(`Query executed successfully. Rows returned: ${dbQueryResult.length}`);
  } catch (error) {
    throw new Error(`Query execution failed: ${error.message}`);
  }
});

When('I fetch data from table {string} where {string}', async function(tableName, whereClause) {
  try {
    dbQueryResult = await snowflakeService.getTableData(tableName, '*', whereClause);
    console.log(`Data fetched from ${tableName}. Rows: ${dbQueryResult.length}`);
  } catch (error) {
    throw new Error(`Data fetch failed: ${error.message}`);
  }
});

Then('I should get {int} records from database', function(expectedCount) {
  expect(dbQueryResult).to.have.lengthOf(expectedCount);
});

Then('the database result should contain field {string} with value {string}', function(fieldName, expectedValue) {
  expect(dbQueryResult).to.not.be.empty;
  expect(dbQueryResult[0]).to.have.property(fieldName.toUpperCase());
  expect(dbQueryResult[0][fieldName.toUpperCase()].toString()).to.equal(expectedValue);
});

// Cleanup after each scenario
After(async function() {
  if (snowflakeService) {
    try {
      await snowflakeService.disconnect();
    } catch (error) {
      console.log('Cleanup warning:', error.message);
    }
  }
});