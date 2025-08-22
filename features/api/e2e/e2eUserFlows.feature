Feature: End to End Scenarios

  @e2e @MIRA-11300 @smoke
  Scenario: MIRA-11300 - Verify End-to-End Device Registration, School Mapping, and Unmapping Process
    # Step 1: Register Device
    Given register device
    Then the response status code should be 200
    And response should have fields "device_id, message"
    #login as admin to map the device
    When i login as a admin using user "David.Athaide1"
    # Step 2: Map Device to School
    And map the device to school
    Then the response status code should be 200
    And response should have fields "device_color, message, device_no"
    And verify the device is mapped to the school in the database
    # Step 3: Get Device Details (Individual Device)
    And get device details
    Then the response status code should be 200
    And response should be an array with device mappings
    And response should have fields "organisation_code, device_color, device_no"
    # Step 4: Get Organisation Device Details (All Devices for Org)
    When get the organization details for device
    Then the response status code should be 200
    And response should have fields "device_id, device_color, active, user_count"
    # Step 5: Unmap Device from School
    And unmap the device from school
    Then the response status code should be 200
    And response should have the following properties:
      | message | unmap_message |
    And verify device is unmapped in database
    # Step 6: Verify Get Organisation Device Details after Unmap
    When get the organization details for device
    Then the response status code should be 404
    And response should have fields "code, correlationId"
    And response should have the following properties:
      | message | no_device_error_msg |
  
  @e2e
  Scenario: Verify End-to-End Device Registration, Mapping, and Student Login Process
    Given register device
    Then the response status code should be 200
    Then response should have fields "device_id, message"
    When i login as a admin using user "admin.d"
    And map the device to school
    Then the response status code should be 200
    And response should have fields "device_color, message, device_no"
    And verify the device is mapped to the school in the database
    Then map 2 student(s) to device and verify status code 200
    And verify the mapping of students to device
    When i login as a student using user "{mapped_student_1}"
    Then the response status code should be 200
    When i login as a student using user "{mapped_student_2}"
    Then the response status code should be 200

  Rule: Identity Access Management Scenarios

    @MIRA-11349 @e2e
    Scenario: Verify User Can Successfully Reset Password via Teacher Approval Process
      Given as a student, I send a Reset Password request for user "charan.desai":
        | request_to | teacher |
      When i login as a teacher using user "Janani.J"
      Then the response status code should be 200
      And as a teacher, I get all the "password_reset" requests for the school "8435958"
      And store user_id and request_id for the user "charan.desai" with status "pending"
      Then as a teacher, I approve password reset request for the user "charan.desai"
      And as a teacher, I reset password for "charan.desai"
      Then the response status code should be 200
      And response should have the following properties:
        | success | success_flag                   |
        | message | password_reset_success_message |
      When i login as a student using user "charan.desai"
      Then the response status code should be 200

    @MIRA-11349 @e2e
    Scenario: Verify User Can Successfully Reset Password via Admin Approval Process
      Given as a teacher, I send a Reset Password request for user "vijay.prajapati":
        | request_to | admin |
      When i login as a admin using user "admin.d"
      Then the response status code should be 200
      And as an admin, I get all the "password_reset" requests for the school "8435958"
      And store user_id and request_id for the user "vijay.prajapati" with status "pending"
      Then as an admin, I approve password reset request for the user "vijay.prajapati"
      And as an admin, I reset password for "vijay.prajapati"
      Then the response status code should be 200
      And response should have the following properties:
        | success | success_flag                   |
        | message | password_reset_success_message |
      When i login as a teacher using user "vijay.prajapati"
      Then the response status code should be 200
