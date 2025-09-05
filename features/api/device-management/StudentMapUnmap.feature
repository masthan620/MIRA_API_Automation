
Feature: Student Mapping and Unmapping to Device

  @map_students_to_device
  Rule: Map Students to Device Testcases
    @1496
    Scenario: MIRA-1496 - Map Students to Devices - Verify the API for successful mapping of students to device
      When I delete test devices with mobile number "9876543210"
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device
      Then the response status code should be 200
      And response should have fields "message, success, failure"
      And response should have the following properties:
        | message | Usermap_Success_msg |
      And verify success array matches sent users
      And verify all success entries have correct device_id
      And verify failure array is empty
      

    Scenario: MIRA-4003 - Map Students to Device - Verify successful single student mapping
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device:
        | user_ids | single_student_user_ids |
      Then the response status code should be 200
      And response should have fields "message, success, failure"
      And response should have the following properties:
        | message | Usermap_Success_msg |
      And verify success array matches sent users
      And verify all success entries have correct device_id
      And verify failure array is empty

    Scenario: MIRA-1497 - Map Students to Devices - Verify the API for Empty device_id
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device:
        | device_id | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg2 |


    Scenario: MIRA-1497 - Map Students to Devices - Verify the API for Empty organisation_code
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device:
        | organisation_code | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg2 |

    Scenario: MIRA-4004 - Map Students to Device - Verify invalid authentication token returns 401
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      When i have invalid authentication token
      And map students to device
      Then the response status code should be 401
      And response should have the following properties:
        | message | Auth_token_error_Msg |

    Scenario: MIRA-4005 - Map Students to Device - Verify empty authentication token returns 401
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      When i have empty authentication token
      And map students to device
      Then the response status code should be 401
      And response should have the following properties:
        | message | Auth_token_error_Msg |
        
    Scenario: MIRA-1496 - Map Students to Devices - Verify API returns 409 when device not mapped to organization 
      Given register device
      Then the response status code should be 200
      And map students to device
      Then the response status code should be 409
      And response should have the following properties:
        | status | status_false |
      And response should have fields "code, correlationId"
      Then response message should contain "Invalid organisation code"
      Then response message should contain "is not mapped to the organisation"
  
    Scenario: MIRA-1479 - Map Students to Device - Verify the API for device_id not mapped to same organisation
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device:
        | organisation_code | invalid_school_code_unmap |
      Then the response status code should be 409
      And response should have fields "code, correlationId"
      Then response message should contain "Invalid organisation code"
      Then response message should contain "is not mapped to the organisation"

    Scenario Outline: MIRA-4006 - Map Students to Device -  Verify API for invalid device_id <test_case_id>
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device:
        | device_id | <device_id> |
      Then the response status code should be 400
      And response should have fields "code, correlationId"
      And response should have the following properties:
        | message | invalid_device_not_registered_msg2 |
      Examples:
        | test_case_id           | device_id          |
        | Special Characters     | str_with_special_char |
        | Spaces                 | str_with_spaces   |
        | only Spaces            | only_spaces_str  |
     
    Scenario Outline: Map Students to Device -  Verify API for invalid organisation_code <test_case_id>
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device:
        | organisation_code | <organisation_code> |
      Then the response status code should be 400
      And response should have fields "code, correlationId"
      And response should have the following properties:
        | message | org_code_must_be_number_msg |
      Examples:
        | test_case_id           | organisation_code         |
        | Special Characters     | str_with_special_char     |
        | Spaces                 | str_with_spaces           |
        | only Spaces            | only_spaces_str           |

    Scenario: Map Students to Device -  Verify API for empty user_ids
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device:
        | user_ids | empty_str1 |
      Then the response status code should be 400
      And response should have fields "code, correlationId"
      And response should have the following properties:
        | message | user_ids_required_msg |
    Scenario Outline: Map Students to Device -  Verify API for invalid user_ids <test_case_id>
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device:
        | user_ids | <user_ids> |
      Then the response status code should be 400
      And response should have fields "code, correlationId"
      And response should have the following properties:
        | message | <message> |
      Examples:
        | test_case_id           | user_ids                  | message                       |   
        | Special Characters     | specialCharUsername       | errorMsg_specialCharUsername  |
        | Spaces                 | str_with_spaces_username  | errorMsg_specialCharUsername        |  
        | only Spaces            | only_spaces_str_Username  | user_ids_required_msg   |
        | nullvalues user_ids    | str_with_null             | error_msg_Username_null  |

  @unmap_students_to_device
  Rule: UnMap Students to Device Testcases 
    Scenario: MIRA-1498 - UnMap Students from Devices - Verify the API for successful unmapping of students from device
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device
      Then the response status code should be 200
      And response should have fields "message, success, failure"
      And response should have the following properties:
        | message | Usermap_Success_msg |
      And verify success array matches sent users
      And verify all success entries have correct device_id
      And verify failure array is empty
      Then unmap students from device
      Then the response status code should be 200
      And response should have the following properties:
        | message | Student_Unmap_Success_msg |
   
    Scenario: Map two students and unmap one student from device
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device
      Then the response status code should be 200
      And response should have fields "message, success, failure"
      And response should have the following properties:
       | message | Usermap_Success_msg |
      And verify success array matches sent users
      And verify all success entries have correct device_id
      And verify failure array is empty   
        # Unmap only one student (first student from the list)
      Then unmap students from device:
       | user_ids | single_student_user_ids |
      Then the response status code should be 200
      And response should have the following properties:
       | message | Student_Unmap_Success_msg |

    Scenario: MIRA-1520 - Map students to device in one organization and try to unmap from different organization
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device
      Then the response status code should be 200
      And response should have fields "message, success, failure"
      And response should have the following properties:
        | message | Usermap_Success_msg |
      And verify success array matches sent users
      And verify all success entries have correct device_id
      And verify failure array is empty
      # Try to unmap from different organization (should fail)
      Then unmap students from device:
        | organisation_code | invalid_school_code_unmap |
      Then the response status code should be 404
      And response should have fields "code, correlationId"
      Then response message should contain "Invalid organisation code"
      Then response message should contain "is not mapped to the organisation"  


    Scenario: MIRA-1499 - UnMap Students from Devices - Verify the API for Empty device_id
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And unmap students from device:
        | device_id | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg2 | 

    Scenario: MIRA-1499 - UnMap Students from Devices - Verify the API for Empty organisation_code
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And unmap students from device:
        | organisation_code | empty_str |
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_msg2 |      
    Scenario: MIRA-4007 - UnMap Students from Device - Verify invalid authentication token returns 401
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device
      Then the response status code should be 200
      When i have invalid authentication token
      And unmap students from device
      Then the response status code should be 401
      And response should have the following properties:
        | message | Auth_token_error_Msg |    

    Scenario: MIRA-4008 - UnMap Students from Device - Verify empty authentication token returns 401
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200 
      And map students to device
      Then the response status code should be 200
      When i have empty authentication token
      And unmap students from device
      Then the response status code should be 401
      And response should have the following properties:
        | message | Auth_token_error_Msg |       

    Scenario Outline: MIRA-4009 - UnMap Students from Device -  Verify API for invalid device_id <test_case_id>
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device
      Then the response status code should be 200
      And unmap students from device:
        | device_id | <device_id> |
      Then the response status code should be 400
      And response should have fields "code, correlationId"
      And response should have the following properties:
        | message | invalid_device_not_registered_msg2 |
      Examples:
        | test_case_id           | device_id          |
        | Special Characters     | str_with_special_char |
        | Spaces                 | str_with_spaces   |
        | only Spaces            | only_spaces_str  |

    Scenario Outline: UnMap Students from Device -  Verify API for invalid organisation_code <test_case_id>
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device
      Then the response status code should be 200
      And unmap students from device:
        | organisation_code | <organisation_code> |
      Then the response status code should be 400
      And response should have fields "code, correlationId"
      And response should have the following properties:
        | message | org_code_must_be_number_msg |
      Examples:
        | test_case_id           | organisation_code         |
        | Special Characters     | str_with_special_char     |
        | Spaces                 | str_with_spaces           |
        | only Spaces            | only_spaces_str           |

    Scenario: UnMap Students from Device -  Verify API for empty user_ids
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And map students to device
      Then the response status code should be 200
      And unmap students from device:
        | user_ids | empty_str1 |
      Then the response status code should be 400
      And response should have fields "code, correlationId"
      And response should have the following properties:
        | message | user_ids_required_msg |  

    Scenario Outline: UnMap Students from Device -  Verify API for invalid user_ids <test_case_id>
      Given register device
      Then the response status code should be 200
      And map the device to school  
      Then the response status code should be 200
      And map students to device
      Then the response status code should be 200
      And unmap students from device:
        | user_ids | <user_ids> |
      Then the response status code should be 400
      And response should have fields "code, correlationId"
      And response should have the following properties:
        | message | <message> |
      Examples:
        | test_case_id           | user_ids                  | message                       |   
        | Special Characters     | specialCharUsername       | errorMsg_specialCharUsername  |
        | Spaces                 | str_with_spaces_username  | errorMsg_specialCharUsername        |  
        | only Spaces            | only_spaces_str_Username  | user_ids_required_msg   |
        | nullvalues user_ids    | str_with_null             | error_msg_Username_null |       




  

