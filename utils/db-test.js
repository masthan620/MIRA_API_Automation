const SnowflakeService = require('../services/snowflake-service');

async function testSnowflakeConnection() {
  const snowflakeService = new SnowflakeService();
  
  try {
    console.log('Testing Snowflake connection...');
    
    // Test connection
    await snowflakeService.connect();
    console.log('✅ Connection successful');
    
    // Test simple query
    const result = await snowflakeService.executeQuery('SELECT CURRENT_VERSION()');
    console.log('✅ Query execution successful');
    console.log('Snowflake version:', result[0]['CURRENT_VERSION()']);
    
    // Test table query (replace with your actual table)
    // const tableData = await snowflakeService.getTableData('YOUR_TABLE_NAME', '*', '', 5);
    // console.log('✅ Table data retrieval successful');
    // console.log('Sample data:', tableData);
    
    await snowflakeService.disconnect();
    console.log('✅ Disconnection successful');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test if file is executed directly
if (require.main === module) {
  testSnowflakeConnection();
}

module.exports = testSnowflakeConnection;