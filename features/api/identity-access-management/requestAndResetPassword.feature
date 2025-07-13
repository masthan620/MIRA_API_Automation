Feature: Password Reset Request and change password flow

  Rule: Password Reset Request API
    As a student or authorized user
    I want to request password reset from admin or teacher
    So that I can recover my account access

    Background:
      Given i have valid authentication token

    @MIRA-1208
    Scenario: MIRA-1208 Verify password reset request creation for an admin user with valid inputs
      Given as a student, I send a Reset Password request for user "aarohi.sinha":
        | request_to | admin |
      And verify that there exists a password reset request record with pending status in DB for user "aarohi.sinha"
      Then the response status code should be 200
      And response should have the following properties:
        | success | success_flag                           |
        | message | reset_password_request_success_message |
      Then as an admin, get all password reset requests for school "8435958" and store user_id and request_id for the user "aarohi.sinha" with status "pending"
      And as a Teacher or Admin, I approve password reset request "{stored_request_id}"

    @MIRA-1254
    Scenario: MIRA-1254 Verify password reset request creation for a teacher user with valid inputs
      Given as a student, I send a Reset Password request for user "rahul.patel":
        | request_to | teacher |
      And verify that there exists a password reset request record with pending status in DB for user "rahul.patel"
      Then the response status code should be 200
      And response should have the following properties:
        | success | success_flag                           |
        | message | reset_password_request_success_message |
      Then as an admin, get all password reset requests for school "8435958" and store user_id and request_id for the user "rahul.patel" with status "pending"
      And as a Teacher or Admin, I approve password reset request "{stored_request_id}"

    @MIRA-1257
    Scenario: MIRA-1257 Verify API behavior when the username path parameter is missing
      Given as a student, I send a Reset Password request for user ""
      Then the response status code should be 401
      And response should have the following properties:
        | message | invalid_token_message |

    @MIRA-1258
    Scenario: MIRA-1258 Verify API behavior when an invalid username is provided
      Given as a student, I send a Reset Password request for user "invaliduser123"
      Then the response status code should be 404
      And response should have the following properties:
        | message | user_not_found |

    @MIRA-1259
    Scenario: MIRA-1259 Verify API behavior when the request body is missing
      Given as a student, I send a Reset Password request for user "gaurav.iyer":
        | request_to | __REMOVE__ |
      Then the response status code should be 400
      And response should have the following properties:
        | message | missing_request_to_message |

    @MIRA-1260
    Scenario: MIRA-1260 Verify API behavior when an invalid request_to value is provided
      Given as a student, I send a Reset Password request for user "gaurav.iyer":
        | request_to | invalid_role |
      Then the response status code should be 400
      And response should have the following properties:
        | status  | failure_flag               |
        | message | invalid_request_to_message |

    @MIRA-1263
    Scenario: MIRA-1263 Verify API behavior when the request_to field is provided but left empty
      Given as a student, I send a Reset Password request for user "gaurav.iyer":
        | request_to |  |
      Then the response status code should be 400
      And response should have the following properties:
        | status  | failure_flag               |
        | message | invalid_request_to_message |

    @MIRA-1264
    Scenario: MIRA-1264 Verify API behavior when both username and request_to are missing
      Given as a student, I send a Reset Password request for user ""
      Then the response status code should be 401
      And response should have the following properties:
        | message | invalid_token_message |

  Rule: User Password Reset API
    As a user with approved password reset request or valid token
    I want to reset my password
    So that I can regain access to my account

    Background:
      Given i have valid authentication token

    @MIRA-7420
    Scenario: MIRA-7420 Successfully Reset Password with Valid Data
      Given as a user, I reset password for "krish.tiwari"
      Then the response status code should be 200
      And the response time should be less than 5000 milliseconds
      And response should have the following properties:
        | success | success_flag                   |
        | message | password_reset_success_message |

    @MIRA-7422
    Scenario: MIRA-7422 Verify Reset Password with Incorrect Username
      Given as a user, I reset password for "incorrectuser123"
      Then the response status code should be 404
      And response should have the following properties:
        | message | user_not_found |

    @MIRA-7423
    Scenario: MIRA-7423 Verify Reset Password with Empty Username
      Given as a user, I reset password for ""
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_message |

    @MIRA-7425
    Scenario: MIRA-7425 Verify Reset Password with Case-Sensitive Username
      Given as a user, I reset password for "Krish.tiwari"
      Then the response status code should be 200
      And response should have the following properties:
        | success | success_flag                   |
        | message | password_reset_success_message |
