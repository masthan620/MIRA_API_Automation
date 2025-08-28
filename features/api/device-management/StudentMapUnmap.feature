Feature: Studentmapping and Unmapping to Device

@map_students_to_device
Rule: Map Students to Device Testcases
  
  Scenario: MIRA-1496 - Map Students to Devices- Verify the API for successful mapping of students to device
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

  @MIRA-4004
  Scenario: MIRA-1497 - Map Students to Devices- Verify the API for Empty device_id
    Given register device
    Then the response status code should be 200
    And map the device to school
    Then the response status code should be 200
    And map students to device:
      | device_id | empty_str |
    Then the response status code should be 404
    And response should have the following properties:
      | message | resource_not_found_msg2 |

  @MIRA-4005
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

  @MIRA-4005 
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


Rule: UnMap Students to Device Testcases
  @unmapSTD
  Scenario: MIRA-1496 - Map Students to Devices- Verify the API for successful mapping of students to device
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
    Then unmap students to device
    Then the response status code should be 200
    And response should have the following properties:
      | message | Unmap_Success_msg |