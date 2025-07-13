Feature: Send OTP API
  As a user
  I want to send OTP to my mobile number or email
  So that I can verify my identity

  @MIRA-708
  Scenario: MIRA-708 Send OTP - Verify Send OTP with Valid Mobile Number
    Given Send an OTP request using "sendOTPValidMobile" request body
    Then the response status code should be 200
    And response should have the following properties:
      | success | otp_success_flag    |
      | message | otp_success_message |

  @MIRA-709
  Scenario: MIRA-709 Send OTP - Verify Send OTP with Valid Email
    Given Send an OTP request using "sendOTPValidEmail" request body
    Then the response status code should be 200
    And response should have the following properties:
      | success | otp_success_flag    |
      | message | otp_success_message |

  @MIRA-1065
  Scenario: MIRA-1065 Send OTP - Verify send OTP API response time
    Given Send an OTP request using "sendOTPValidMobile" request body
    Then the response status code should be 200
    And the response time should be less than 5000 milliseconds
    And response should have the following properties:
      | success | otp_success_flag    |
      | message | otp_success_message |

  @MIRA-710
  Scenario: MIRA-710 Send OTP - Verify Send OTP with Both Email and Mobile Number
    Given Send an OTP request using "sendOTPBothEmailMobile" request body
    Then the response status code should be 200
    And response should have the following properties:
      | success | otp_success_flag    |
      | message | otp_success_message |

  @MIRA-711
  Scenario: MIRA-711 Send OTP - Verify Missing Both Email and Mobile Number
    Given Send an OTP request using "sendOTPEmpty" request body
    Then the response status code should be 400
    And response should have the following properties:
      | status  | otp_failure_flag             |
      | message | missing_mobile_email_err_msg |

  @MIRA-712
  Scenario: MIRA-712 Send OTP - Verify Invalid Mobile Number Format
    Given Send an OTP request using "sendOTPInvalidMobile" request body
    Then the response status code should be 400
    And response should have the following properties:
      | status  | otp_failure_flag                |
      | message | invalid_mobile_number_err_msg_2 |

  @MIRA-713
  Scenario: MIRA-713 Send OTP - Verify send OTP Invalid Email Format
    Given Send an OTP request using "sendOTPValidEmail" request body:
      | email | invalid-email-format |
    Then the response status code should be 400
    And response should have the following properties:
      | status  | otp_failure_flag      |
      | message | invalid_email_err_msg |

  @MIRA-4718
  Scenario: MIRA-4718 Verify send OTP API with only country_code
    Given Send an OTP request using "sendOTPOnlyCountryCode" request body
    Then the response status code should be 400
    And response should have the following properties:
      | status  | otp_failure_flag             |
      | message | missing_mobile_email_err_msg |

  @MIRA-4719
  Scenario: MIRA-4719 Send OTP - Verify with invalid_country_code_err_msg
    Given Send an OTP request using "sendOTPValidMobile" request body:
      | country_code | +00 |
    Then the response status code should be 400
    And response should contain request data as specified:
      | message | Invalid mobile number: {country_code} |
