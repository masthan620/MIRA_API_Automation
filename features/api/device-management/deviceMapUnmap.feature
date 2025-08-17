Feature: Device Mapping to School

  Rule: Device Mapping To School Testcases

    @map_deviceto_Org @device_management
    Scenario: MIRA-1379 - Map Device to School - Verify successful mapping of a device with valid inputs
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database

    @map_deviceto_Org @device_management
    Scenario: MIRA-1380 - Map Device to School - Verify device already mapped
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database "true"
      And map the device to school
      Then the response status code should be 200
      And response should have the following properties:
        | message | already_mapped_msg |

  Rule: Device Mapping To School Testcases - Negative Scenarios

    @map_deviceto_Org @device_management
    Scenario: MIRA-1386 - Map Device to School - Verify invalid device ID returns 404
      Given map the device to school:
        | device_id | invalid_device_id_test |
      Then the response status code should be 404
      And response should have the following properties:
        | status  | status_false              |
        | message | device_not_registered_msg |
      And response should have fields "code, correlationId"

    @map_deviceto_Org @device_management
    Scenario: MIRA-1387 - Map Device to School - Verify empty device ID returns 404
      Given map the device to school:
        | device_id | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg2 |

    @map_deviceto_Org @device_management
    Scenario: MIRA-1394 - Map Device to School - Verify device ID with special characters
      Given register device
      Then the response status code should be 200
      And map the device to school:
        | device_id | str_with_special_char |
      Then the response status code should be 400
      And response should have the following properties:
        | status  | status_false                      |
        | message | invalid_device_not_registered_msg |
      And response should have fields "code, correlationId"

    @map_deviceto_Org @device_management
    Scenario: MIRA-1388 - Map Device to School - Verify empty organisation code returns 404
      Given register device
      Then the response status code should be 200
      And map the device to school:
        | organisation_code | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg2 |

    @map_deviceto_Org @device_management
    Scenario Outline: Map Device to School - Verify API Fails with Invalid Organisation Code <test_case_id>
      Given register device
      Then the response status code should be 200
      And map the device to school:
        | organisation_code | <organisation_code> |
      Then the response status code should be 400
      And response should have the following properties:
        | status  | status_false       |
        | message | <expected_message> |
      And response should have fields "code, correlationId"

      Examples:
        | test_case_id                              | organisation_code              | expected_message              |
        | Alpha Characters in Organisation Code     | str_with_alphanumeric          | org_code_must_be_number_msg   |
        | Organisation Code with Spaces             | str_with_spaces                | org_code_must_be_number_msg   |
        | Alphanumeric Special Characters in Code   | alphanumeric_special_org_code  | org_code_must_be_number_msg   |

    @map_deviceto_Org @device_management
    Scenario: MIRA-1381 - Map Device to School - Verify unauthorized access returns 401
      Given i do not have authentication token
      And register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 401
      And response should have the following properties:
        | message | invalid_token_message |




Rule: Get Device Details API Testcases

    @get_device @get_device_Positive @MIRA-2001
    Scenario: MIRA-2001 - Get Device Details - Verify successful retrieval of mapped device details
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And get device details
      Then the response status code should be 200
      And response should be an array with device mappings
      And response should have fields "organisation_code, device_color, device_no"

    @get_device @get_device_Negative @MIRA-2004
    Scenario: MIRA-2004 - Get Device Details - Verify registered but unmapped device returns empty array
      Given register device
      Then the response status code should be 200
      And get device details
      Then the response status code should be 404
      And response should have the following properties:
        | status  | status_false              |
        | message | device_notfound_error_msg |
      And response should have fields "code, correlationId"

    @get_device @get_device_Negative @MIRA-2007
    Scenario Outline: Get Device Details - Verify API Fails with Invalid Device ID <test_case_id>
      Given get device details:
        | device_id | <device_id_value> |
      Then the response status code should be 400
      And response should have the following properties:
        | status | status_false                    |
        | message | <expected_error_message>        |
      And response should have fields "code, correlationId"
      Examples:
        | test_case_id                     | device_id_value         | expected_error_message           |
        | Device ID with Special Characters| str_with_special_char   | invalid_device_not_registered_msg  |
        | Device ID with Spaces            | str_with_spaces         | invalid_device_not_registered_msg  |


    @get_device @get_device_Negative @MIRA-2008
    Scenario: MIRA-2008 - Get Device Details - Verify empty device ID returns 400
      Given get device details:
        | device_id | empty_str |
      Then the response status code should be 405
      And response should have the following properties:
        | error   |  method_not_allow_error_meg  |


