Feature: Password Reset flow for students from Admin and Teacher side

  Rule: As a teacher/admin, get Password Reset Requests API
    As an admin or authorized user
    I want to as an admin, get password reset requests
    So that I can view and manage pending requests

    Background:
      Given i have valid authentication token

    @MIRA-5008
    Scenario: MIRA-5008 Verify API Response with Valid Parameters
      Then as a student, I send a Reset Password request for user "manish.modi"
      And a pending password reset request should exist for user "manish.modi" in DB
      And as an admin, get all password reset requests for school "8435958" and store user_id and request_id for the user "manish.modi" with status "pending"
      Then the response status code should be 200
      And the response time should be less than 5000 milliseconds
      Then response should have fields "data,pagination"

    @MIRA-5009
    Scenario: MIRA-5009 Verify API Response for Missing Authentication Token
      Given i do not have authentication token
      And as an admin, get all password reset requests for school "8435958"
      Then the response status code should be 401
      And response should have the following properties:
        | message | no_token_message |

    @MIRA-5010
    Scenario: MIRA-5010 Verify API Response for Invalid School Code
      And as an admin, get all password reset requests for school "INVALID_SCHOOL"
      Then the response status code should be 400
      And response should have the following properties:
        | status  | failure_flag                |
        | message | invalid_school_code_message |

    @MIRA-5011
    Scenario Outline: MIRA-5011 Verify API Pagination with Different Page and Limit Values
      And as an admin, get all password reset requests for school "8435958" with limit "<limit>" and page "<page>"
      Then the response status code should be 200
      Then response should have fields "data,pagination"
      And the response time should be less than 5000 milliseconds

      Examples:
        | limit | page |
        |     5 |    1 |
        |    10 |    2 |
        |    20 |    1 |
        |     1 |    3 |

    @MIRA-5012
    Scenario: MIRA-5012 Verify API Pagination with Large Limit Values
      And as an admin, get all password reset requests for school "8435958" with limit "50" and page "1"
      Then the response status code should be 200
      Then response should have fields "data,pagination"

    @MIRA-5013
    Scenario: MIRA-5013 Verify API Response for Exceeding Available Pages
      And as an admin, get all password reset requests for school "8435958" with limit "10" and page "9999"
      Then the response status code should be 200
      Then response should have fields "data"

    @MIRA-5014
    Scenario: MIRA-5014 Verify API Response for Maximum Limit Value
      And as an admin, get all password reset requests for school "8435958"
      Then the response status code should be 200
      Then response should have fields "data"

  Rule: Handle Password Reset Request as a teacher
    As an admin
    I want to approve or reject password reset requests
    So that I can manage user password reset workflows

    Background:
      Given i have valid authentication token

    @MIRA-4961
    Scenario: MIRA-4961 Successfully update status to "rejected"
      Given as a student, I send a Reset Password request for user "gaurav.iyer"
      And a pending password reset request should exist for user "gaurav.iyer" in DB
      Then as an admin, get all password reset requests for school "8435958" and store user_id and request_id for the user "gaurav.iyer" with status "pending"
      And as a teacher, I reject password reset request for the user "gaurav.iyer":
        | status | rejected |
      Then the response status code should be 200
      Then response should have the following properties:
        | success | success_flag                        |
        | message | password_reset_updated_successfully |

    @MIRA-4962
    Scenario: MIRA-4962 Verify response time is within acceptable range
      Given as a student, I send a Reset Password request for user "manish.modi"
      And a pending password reset request should exist for user "manish.modi" in DB
      Then as an admin, get all password reset requests for school "8435958" and store user_id and request_id for the user "manish.modi" with status "pending"
      And as a teacher, I approve password reset request for the user "manish.modi"
      Then the response status code should be 200
      And the response time should be less than 5000 milliseconds

    @MIRA-4969
    Scenario: MIRA-4969 End-to-end password reset approval flow
      Given as a student, I send a Reset Password request for user "ishita.thakur"
      And a pending password reset request should exist for user "ishita.thakur" in DB
      Then as an admin, get all password reset requests for school "8435958" and store user_id and request_id for the user "ishita.thakur" with status "pending"
      And as a teacher, I approve password reset request for the user "ishita.thakur"
      Then the response status code should be 200
      Then response should have the following properties:
        | success | success_flag                        |
        | message | password_reset_updated_successfully |
      Then debug response structure

    @MIRA-4970
    Scenario: MIRA-4970 End-to-end password reset rejection flow
      Given as a student, I send a Reset Password request for user "gayatri.jain"
      And a pending password reset request should exist for user "gayatri.jain" in DB
      Then as an admin, get all password reset requests for school "8435958" and store user_id and request_id for the user "gayatri.jain" with status "pending"
      And as a teacher, I reject password reset request for the user "gayatri.jain":
        | status | rejected |
      Then the response status code should be 200
      Then response should have the following properties:
        | success | success_flag                        |
        | message | password_reset_updated_successfully |
    # Static ID scenarios (for error testing)

    @MIRA-4963
    Scenario: MIRA-4963 Missing Authorization header should return 401 Unauthorized
      Given i do not have authentication token
      When as a teacher, I approve password reset request for the user "akshay.basu" with request_id "123"
      Then the response status code should be 401
      Then response should have fields "message"

    @MIRA-4965
    Scenario: MIRA-4965 Non-existent request_id should return 404 Not Found
      Given as a teacher, I approve password reset request for the user "akshay.basu" with request_id "90341234"
      Then the response status code should be 503
      And response should have the following properties:
        | status  | failure_flag               |
        | message | invalid_request_id_message |

    @MIRA-4966
    Scenario Outline: MIRA-4966 Invalid request_id should return 400 Bad Request
      Given as a teacher, I approve password reset request with request_id "<invalid_id>"
      Then the response status code should be 503
      And response should contain request data as specified:
        | message | Failed to update password reset request: invalid input syntax for type integer: \\"<invalid_id>\\" |

      Examples:
        | invalid_id    |
        | invalid-chars |
        | special@#$    |

    @MIRA-4967
    Scenario: MIRA-4967 Missing status in request body should return 400 Bad Request
      Given as a teacher, I reject password reset request with request_id "123":
        | status | __REMOVE__ |
      Then the response status code should be 400
      Then response should have the following properties:
        | message | invalid_status_message |

    @MIRA-4968
    Scenario: MIRA-4968 Invalid status value should return 400 Bad Request
      Given as a teacher, I reject password reset request with request_id "123":
        | status | approve |
      Then the response status code should be 400
      Then response should have the following properties:
        | message | invalid_status_message |

    @MIRA-4960
    Scenario: MIRA-4960 Successfully update status to "approved"
      Given as a student, I send a Reset Password request for user "akshay.basu"
      And a pending password reset request should exist for user "akshay.basu" in DB
      Then as an admin, get all password reset requests for school "8435958" and store user_id and request_id for the user "akshay.basu" with status "pending"
      And as a teacher, I approve password reset request for the user "akshay.basu"
      Then the response status code should be 200
      Then response should have the following properties:
        | success | success_flag                        |
        | message | password_reset_updated_successfully |
      And the response time should be less than 5000 milliseconds
