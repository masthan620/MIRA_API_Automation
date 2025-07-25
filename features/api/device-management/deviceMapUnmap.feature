Feature: Device Mapping and Unmapping

Rule: Device Mapping To School Testcases     
    @map @map_Positive @MIRA-1379 
    Scenario: MIRA-1379 - Map Device to School - Verify successful mapping of a device with valid inputs
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database

    @map @map_Positive @MIRA-1380
    Scenario: MIRA-1380 - Map Device to School - Verify device already mapped
      Given register device
      Then the response status code should be 200
      Given map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database "true"
      And map the device to school
      Then the response status code should be 200
      And response should have the following properties:
        | message | already_mapped_msg |

    @map @MIRA-1383 @map_negative
    Scenario: MIRA-1383 - Map Device to School - Verify API behavior when school_code parameter is empty
      Given register device
      Then the response status code should be 200
      When map the device to school with empty schoolCode
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg |

    @map_negative @device_id_validation @MIRA-1384
    Scenario: MIRA-1384 - Map Device to School - Verify mapping fails with empty device_id 
      Given register device
      Then the response status code should be 200
      And response should have fields "device_id, message"
      When map the device to school with empty device_id
      Then the response status code should be 404
      And response should have the following properties:
        | status  | status_false              |
        | code    | resource_not_found_code   |
        | message | resource_not_found_msg2   |
      And response should have fields "correlationId"
    
    @MIRA-1386 @map_negative @invalid-school @scenario-outline
    Scenario Outline: MIRA-1386 - Verify API Fails with Invalid School Code <test_case_id>
      Given register device
      Then the response status code should be 200
      When map the device to school:
        | school_code | <school_code> |
      Then the response status code should be 400
      And response should have the following properties:
        | status  | status_false   |
        | code    | error_code2    |
        | message | <expected_message> |

      Examples:
        | test_case_id                      | school_code                      | expected_message         |
        | Special Characters in School Code | school_code_special_chars        | invalid_school_code_msg  |
        | School Code with Spaces           | school_code_with_spaces          | invalid_school_code_msg  |
        | Alphanumeric School Code          | invalid_school_code_alphanumeric | invalid_school_code_msg  |

    @MIRA-1387 @map_negative @map 
    Scenario: MIRA-1387 - Map Device to School - Verify API fails with invalid device_id
      Given register device
      Then the response status code should be 200
      When map the device to school with invalid device_id
      Then the response status code should be 404
      And response should have the following properties:
        | status  | status_false               |
        | code    | device_not_registered_code |
        | message | device_not_registered_msg  |
      And response should have fields "correlationId"

      

    


  Rule: Device Unmapping To School Testcases

    @unmap
    Scenario: MIRA-1404 - Unmap Device from School- Verify successful unmapping of a device.
      Given register device
      Then the response status code should be 200
      Given map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database
      When unmap the device from the school
      Then the response status code should be 200
      And response should have the following properties:
        | message | unmap_message |
      And verify the device is unmapped from the school in the database

@unmap @unmap_negative @MIRA-1406 @scenario-outline
    Scenario Outline: MIRA-1406 - Verify Unmap API Fails with Invalid Device ID <test_case_id>
      Given register device
      Then the response status code should be 200
      And response should have fields "device_id, message"
      Given map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database
      When unmap device from school with overrides:
        | device_id | <device_id> |
      Then the response status code should be <status_code>
      And response should have the following properties:
        | status  | status_false         |
        | code    | <error_code>         |
        | message | <expected_message>   |
      And response should have fields "correlationId"

      Examples:
        | test_case_id                    | device_id                        | status_code | error_code                     | expected_message                |
        | Alphanumeric Invalid Device ID  | invalid_device_id_test           | 404         | invalid_device_unmap_error_code| invalid_device_unmap_error_msg  |
        | Special Characters Device ID    | invalid_device_id_special_chars  | 404         | resource_not_found_code        | resource_not_found_msg2         |
        | Empty Device ID                 | empty_str                        | 404         | resource_not_found_code        | resource_not_found_msg2         |
        | invalid device id with spaces   | invalid_device_id_with_spaces    | 404         | resource_not_found_code        | resource_not_found_msg2         |
    @unmap @unmap_negative @MIRA-1406-school @scenario-outline
    Scenario Outline: MIRA-1406 - Verify Unmap API Fails with Invalid School Code <test_case_id>
      Given register device
      Then the response status code should be 200
      And response should have fields "device_id, message"
      Given map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database
      When unmap device from school with overrides:
        | school_code | <school_code> |
      Then the response status code should be <status_code>
      And response should have the following properties:
        | status  | status_false         |
        | code    | <error_code>         |
        | message | <expected_message>   |
      And response should have fields "correlationId"

      Examples:
        | test_case_id                      | school_code                       | status_code | error_code                     | expected_message                 |
        | Special Characters in School Code | school_code_special_chars         | 400         | error_code2                    | invalid_school_code_msg2         |
        | School Code with Spaces           | school_code_with_spaces           | 404         | error_code2                    | invalid_school_code_msg2         |

        @unmap @unmap_negative @MIRA-1406-school-empty
    Scenario: MIRA-1406 - Verify Unmap API Fails with Empty School Code
      Given register device
      Then the response status code should be 200
      And response should have fields "device_id, message"
      Given map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database
      When unmap device from school with overrides:
        | school_code | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg |


       @cleanup @MIRA-1234
      Scenario: MIRA-1234 - Delete auto-created test data from DB
        When I delete test devices with mobile number "9876543210"
