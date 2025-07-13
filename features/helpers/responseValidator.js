import { expect } from '@wdio/globals';



/**
 * Gets the actual response data from the response object
 * @param {Object} response - The response object
 * @returns {Object} - The response data
 */
function getResponseData(response) {
    return response.body || response.data || response;
}

/**
 * Verifies if a field exists in the response and optionally checks its value
 * @param {Object} responseData - The response data object
 * @param {string} fieldName - The name of the field to check
 * @param {string|undefined} expectedValue - The expected value (optional)
 * @returns {any} - The actual value of the field
 */
function verifyField(responseData, fieldName, expectedValue) {
    // Check if field exists in response
    expect(responseData).toHaveProperty(fieldName);

    // Get the actual value from the response
    const actualValue = responseData[fieldName];

    // If expected value is provided, verify it matches
    if (expectedValue !== undefined && expectedValue !== '') {
        // Check the type of expectedValue
        const expectedType = typeof expectedValue;

        if (expectedType === 'boolean') {
            expect(actualValue).toBe(expectedValue);
        } else if (expectedType === 'number') {
            expect(actualValue).toBe(expectedValue);
        } else if (expectedType === 'string') {
            // Handle boolean strings
            if (expectedValue === 'true' || expectedValue === 'false') {
                expect(actualValue).toBe(expectedValue === 'true');
            }
            // Handle numeric strings
            else if (!isNaN(expectedValue.trim()) && expectedValue.trim() !== '') {
                expect(actualValue).toBe(Number(expectedValue));
            }
            // Handle all other strings
            else {
                expect(String(actualValue)).toBe(expectedValue);
            }
        } else {
            // Fallback for other data types
            expect(actualValue).toBe(expectedValue);
        }

        console.log(`Verified ${fieldName}: ${actualValue} equals expected value: ${expectedValue}`);
    } else {
        console.log(`Found ${fieldName}: ${JSON.stringify(actualValue)}`);
    }

    return actualValue;
}


// Export the functions
export { getResponseData, verifyField };

