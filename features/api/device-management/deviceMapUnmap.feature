Feature: Device Management - Device Mapping & Retrieval
  @map
  Rule: Device Mapping To School Testcases
    @smoke
    Scenario: MIRA-1379 - Map Device to School - Verify successful mapping of a device with valid inputs
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database
    @smoke
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

    Scenario: MIRA-1387 - Map Device to School - Verify invalid device ID returns 404
      Given map the device to school:
        | device_id | invalid_device_id_test |
      Then the response status code should be 404
      And response should have the following properties:
        | status  | status_false              |
        | message | device_not_registered_msg |
      And response should have fields "code, correlationId"

    Scenario: MIRA-1384 - Map Device to School - Verify empty device ID returns 404
      Given map the device to school:
        | device_id | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg2 |   

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

    Scenario: MIRA-1383  - Map Device to School - Verify empty organisation code returns 404
      Given register device
      Then the response status code should be 200
      And map the device to school:
        | organisation_code | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg2 |

    Scenario Outline: MIRA-1386 - Map Device to School - Verify API Fails with Invalid Organisation Code <test_case_id>
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
        | test_case_id                           | organisation_code             | expected_message            |
        | Alpha Characters in Organisation Code  | str_with_alphanumeric         | org_code_must_be_number_msg |
        | Organisation Code with Spaces          | str_with_spaces               | org_code_must_be_number_msg |
        | Alphanumeric Special Characters in Code| alphanumeric_special_org_code | org_code_must_be_number_msg |

    
    Scenario: MIRA-1385 - Map Device to School - Verify invalid authentication token returns 401
      Given register device
      Then the response status code should be 200
      When i have invalid authentication token
      And map the device to school
      Then the response status code should be 401
      And response should have the following properties:
     | message | Auth_token_error_Msg |

    Scenario: MIRA-1383 - Map Device to School - Verify empty authentication token returns 401
      Given register device
      Then the response status code should be 200
      When i have empty authentication token
      And map the device to school
      Then the response status code should be 401
      And response should have the following properties:
        | message | Auth_token_error_Msg |


  
  

  @unmap
  Rule: Device Unmapping from Organisation Testcases

    @smoke
    Scenario: MIRA-1404 - Unmap Device from Organisation - Verify successful unmapping of a mapped device
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And unmap the device from school
      Then the response status code should be 200
      And response should have the following properties:
        | message | unmap_message |


    Scenario: MIRA-13008 - Unmap Device from School - Verify invalid authentication token returns 401
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      When i have invalid authentication token
      And unmap the device from school
      Then the response status code should be 401
      And response should have the following properties:
        | message | Auth_token_error_Msg |

  
    Scenario: MIRA-1408 - Unmap Device from School - Verify empty authentication token returns 401
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      When i have empty authentication token
      And unmap the device from school
      Then the response status code should be 401
      And response should have the following properties:
        | message | Auth_token_error_Msg | 


    Scenario: MIRA-1417 - Unmap Device from School - Verify unmapping device from the Organisationdevice that not mapped to the Organisation
      Given register device
      Then the response status code should be 200
      And unmap the device from school
      Then the response status code should be 404
      And response should have the following properties:
        | status | status_false |
      And response should have fields "code, correlationId"
      And response message should contain "Invalid organisation code"
      And response message should contain "is not mapped to the organisation"
  
    Scenario: MIRA-1405 - Unmap Device from School - Verify empty organisation code returns 404
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And unmap the device from school:
        | organisation_code | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg2 |

   
    Scenario Outline: MIRA-1410 - Unmap Device from School - Verify API Fails with Invalid Organisation Code <test_case_id>
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And unmap the device from school:
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

    
    Scenario: MIRA- 13009- Unmap Device from School - Verify device not mapped to specified organisation returns 404
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And unmap the device from school:
        | organisation_code | invalid_school_code_unmap |
      Then the response status code should be 404
      And response should have the following properties:
        | status  | status_false                                     |
      And response should have fields "code, correlationId"
      And response message should contain "Invalid organisation code"
      And response message should contain "is not mapped to the organisation"

    
    Scenario: MIRA-1416 - Unmap Device from School - Verify invalid device ID returns 400
      Given unmap the device from school:
        | device_id | str_with_special_char |
      Then the response status code should be 400
      And response should have the following properties:
        | status  | status_false                      |
        | message | invalid_device_not_registered_msg2 |
      And response should have fields "code, correlationId"

   
    Scenario: MIRA-1406 - Unmap Device from School - Verify empty device ID returns 404
      Given unmap the device from school:
        | device_id | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg2 |

  @GetDeviceDetails
  Rule: Get Device details Testcases
    @smoke
    Scenario: MIRA-2001 - Get Device Details - Verify successful retrieval of mapped device details
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And get device details
      Then the response status code should be 200
      And response should be an array with device mappings
      And response should have fields "organisation_code, device_color, device_no"

    
    Scenario: MIRA-2004 - Get Device Details - Verify registered but unmapped device returns empty array
      Given register device
      Then the response status code should be 200
      And get device details
      Then the response status code should be 404
      And response should have the following properties:
        | status  | status_false              |
        | message | device_notfound_error_msg |
      And response should have fields "code, correlationId"

   
    Scenario Outline: MIRA-2007 - Get Device Details - Verify API Fails with Invalid Device ID <test_case_id>
      Given get device details:
        | device_id | <device_id_value> |
      Then the response status code should be 400
      And response should have the following properties:
        | status  | status_false              |
        | message | <expected_error_message>  |
      And response should have fields "code, correlationId"

      Examples:
        | test_case_id                      | device_id_value       | expected_error_message              |
        | Device ID with Special Characters | str_with_special_char | invalid_device_not_registered_msg   |
        | Device ID with Spaces             | str_with_spaces       | invalid_device_not_registered_msg   |

    
    Scenario: MIRA-2008 - Get Device Details - Verify empty device ID returns 405
      Given get device details:
        | device_id | empty_str |
      Then the response status code should be 405
      And response should have the following properties:
        | error | method_not_allow_error_meg |
   
    Scenario: MIRA-2009 - Get Device Details - Verify invalid authentication token returns 401
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      When i have invalid authentication token
      And get device details
      Then the response status code should be 401
      And response should have the following properties:
        | message | Auth_token_error_Msg |
   
    
    Scenario: MIRA-2010 - Get Device Details - Verify empty authentication token returns 401
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      When i have empty authentication token
      And get device details
      Then the response status code should be 401
      And response should have the following properties:
        | message | Auth_token_error_Msg |

  @GetOrganisationDeviceDetails
  Rule: get the organization details for device
    @smoke
    Scenario: MIRA-1400 - Get Organisation Device - Verify successful retrieval of a mapped device
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      When get the organization details for device
      Then the response status code should be 200
      And response should have fields "device_id, device_color, active, user_count"
      And verify the device is mapped to the school in the database

    
    Scenario: MIRA-1405 - Get Organisation Device - Empty device ID returns all devices
      Given get the organization details for device:
        | device_id | empty_str |
      Then the response status code should be 200
      And response should have fields "devices"

    
    Scenario Outline: MIRA-1402 - Get Organisation Device - Verify API Fails with Invalid Device ID <test_case_id>
      Given get the organization details for device:
        | device_id | <device_id_value> |
      Then the response status code should be 400
      And response should have the following properties:
        | status  | status_false             |
        | message | <expected_error_message> |
      And response should have fields "code, correlationId"

      Examples:
        | test_case_id                      | device_id_value       | expected_error_message              |
        | Device ID with Special Characters | str_with_special_char | invalid_device_not_registered_msg   |
        | Device ID with Spaces             | str_with_spaces       | invalid_device_not_registered_msg   |

    
    Scenario: MIRA-1500 - Get Organisation Device - Empty organisation code
      Given register device
      Then the response status code should be 200
      When get the organization details for device:
        | organisation_code | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg2 |

    
    Scenario: MIRA-1404 - Get Organisation Device - Verify API Fails with another Organisation 
      Given register device
      Then the response status code should be 200
      When get the organization details for device:
        | organisation_code | <organisation_code> |
      Then the response status code should be 400
      And response should have the following properties:
        | status | status_false |
    
    Scenario: MIRA-1501 - Get Organisation Device - Verify invalid authentication token returns 401
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      When i have invalid authentication token
      And get the organization details for device
      Then the response status code should be 401
      And response should have the following properties:
        | message | @GetOrganisationDeviceDetails |

    Scenario: MIRA-1502 - Get Organisation Device - Verify empty authentication token returns 401
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      When i have empty authentication token
      And get the organization details for device
      Then the response status code should be 401
      And response should have the following properties:
        | message | Auth_token_error_Msg |    