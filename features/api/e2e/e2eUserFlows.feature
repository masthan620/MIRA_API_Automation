Feature: End to End Scenarios
  
  @e2e
  Scenario: Verify End-to-End Device Registration, Mapping, and Student Login Process
    Given register device
    Then the response status code should be 200
    Then response should have fields "device_id, message"
    When i login as a admin using user "David.Athaide1"
    And map the device to school
    Then the response status code should be 200
    And response should have fields "device_color, message, device_no"
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
      And As a teacher, I get all the "password_reset" requests for the school "8435958"
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
      When i login as a admin using user "David.Athaide1"
      Then the response status code should be 200
      And As an admin, I get all the "password_reset" requests for the school "8435958"
      And store user_id and request_id for the user "vijay.prajapati" with status "pending"
      Then as an admin, I approve password reset request for the user "vijay.prajapati"
      And as an admin, I reset password for "vijay.prajapati"
      Then the response status code should be 200
      And response should have the following properties:
        | success | success_flag                   |
        | message | password_reset_success_message |
      When i login as a teacher using user "vijay.prajapati"
      Then the response status code should be 200
