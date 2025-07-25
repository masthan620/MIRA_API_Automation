Feature: Verify and Authenticate User

  Rule: Verification of User API
  As a system
  I want to verify and retrieve user information
  So that I can validate user details and access levels

    Background:
      Given i have valid authentication token

    @MIRA-1130
    Scenario: MIRA-1130 Successful Verification of User Existence and Data Integrity
      When i verify user "akshay.basu"
      Then the response status code should be 200
      And response should have fields "username,password_type,user_type,school_code"
      And validate response data against database
      And the response time should be less than 3000 milliseconds

    @MIRA-1131
    Scenario Outline: MIRA-1131 Validate Case Insensitivity for Username
      When i verify user "<username_variant>"
      Then the response status code should be 200
      And response should have fields "username,password_type,user_type,school_code"
      And validate response data against database

      Examples:
        | username_variant |
        | gaurav.iyer      |
        | Gaurav.iyer      |
        | GAURAV.IYER      |
        | gAuRav.iYer      |

    @MIRA-1132
    Scenario: MIRA-1132 Verify user details retrieval for another valid username
      When i verify user "krish.tiwari"
      Then the response status code should be 200
      And response should have fields "username,password_type,user_type,school_code"
      And validate response data against database
      And the response time should be less than 3000 milliseconds

    @MIRA-1133
    Scenario Outline: MIRA-1133 Verify response when an invalid username is provided
      When i verify user "<invalid_username>"
      Then the response status code should be 404
      And response should contain request data as specified:
        | message | User not found: {<invalid_username>}. Please check and try again. |

      Examples:
        | invalid_username                       |
        | nonexistent.user                       |
        | invalid@user.com                       |
        |                              123456789 |
        | special!@#$chars                       |
        | user.with.longname.that.exceeds.limits |

    @MIRA-1134
    Scenario: MIRA-1134 Verify response when username path parameter is missing
      When I send a GET request to "/api/authX/v1/users/"
      Then the response status code should be 404
      And response should have the following properties:
        | message | resource_not_found_message |

  Rule: Authenticate User API
  As a user
  I want to authenticate with username and password
  So that I can access the system and get authentication tokens

    Background:
      Given i have valid authentication token

    @MIRA-1149
    Scenario: MIRA-1149 Verify successful login with valid credentials after password reset
      Given as a user, I reset password for "krish.tiwari"
      Then the response status code should be 200
      When i login as a student using user "krish.tiwari"
      Then the response status code should be 200
      And response should have the following properties:
        | message | login_success_message |
      And response should have fields "accessToken,refreshToken"
      And the response time should be less than 3000 milliseconds

    @MIRA-1151
    Scenario Outline: MIRA-1151 Verify login allows case-insensitive username
      Given as a user, I reset password for "krish.tiwari"
      Then the response status code should be 200
      When i login as a student using user "<username_variant>"
      Then the response status code should be 200
      And response should have the following properties:
        | message | login_success_message |
      And response should have fields "accessToken,refreshToken"

      Examples:
        | username_variant |
        | krish.tiwari     |
        | KRISH.TIWARI     |
        | Krish.Tiwari     |
        | kRiSh.TiWaRi     |

    @MIRA-1152
    Scenario: MIRA-1152 Verify response for invalid username
      Given as a user, I reset password for "krish.tiwari"
      Then the response status code should be 200
      When i login as a student using user "invalid.username"
      Then the response status code should be 404
      And response should have the following properties:
        | message | user_invalid_message |

    @MIRA-1153
    Scenario: MIRA-1153 Verify response for incorrect password
      Given as a user, I reset password for "krish.tiwari"
      Then the response status code should be 200
    # Use wrong password instead of reset password
      When i login as a student using user:
        | username | krish.tiwari     |
        | password | wrongpassword123 |
      Then the response status code should be 401
      And response should have the following properties:
        | message | incorrect_password_message |

    @MIRA-1156
    Scenario: MIRA-1156 Verify response for empty request body
      When I send a POST request to "/authX/v1/login" using "loginEmptyBody" request body
      Then the response status code should be 400
      And response should have the following properties:
        | message | missing_parameters_message |
