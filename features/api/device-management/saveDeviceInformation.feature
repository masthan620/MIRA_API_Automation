@reg_device
Feature: Save Device Information

  @check
  Scenario: MIRA-1657 - Verify Successful Registration of a Device with Valid Input Data
    Given register device
    Then the response status code should be 200
    Then debug response structure
    Then response should have fields "device_id, message"
    Then verify the device ID from response exists in database
    Then verify that all device input values are correctly stored in the database
    
  Scenario Outline: MIRA-1658 - Verify API Fails with Invalid Country Code <test_case_id>
    Given register device:
      | country_code | <country_code> |
    Then the response status code should be 400
    And response should have the following properties:
      | status  | status_false       |
      | code    | error_code         |
      | message | <expected_message> |

    Examples:
      | test_case_id                   | country_code               | expected_message                  |
      | Empty Country Code             | empty_str                  | empty_country_code_err_msg        |
      | Invalid Country Code Format    | invalid_countryCode_format | invalid_mobile_err_msg    |
      | Special Characters in Code     | countryCode_special_chars  | invalid_mobile_err_msg    |
      | Country Code Without Plus Sign | countryCode_without_plus   | country_code_missing_plus_err_msg |
 
  Scenario: MIRA-1659 - Verify API Response When Unique Device ID Is Empty During Device Registration
    Given register device:
      | unique_device_id |  |
    Then the response status code should be 400
    And response should have the following properties:
      | status  | status_false                   |
      | code    | error_code                     |
      | message | empty_unique_device_id_err_msg |   
  Scenario Outline: MIRA-1660 - Verify Device Registration API Fails with Empty or Invalid Mobile Number <test_case_id>
    Given register device:
      | mobile_number | <mobile_number> |
    Then the response status code should be 400
    And response should have the following properties:
      | status  | status_false       |
      | code    | error_code         |
      | message | <expected_message> |

    Examples:
      | test_case_id                               | mobile_number             | expected_message       |
      | Empty Mobile Number                        | empty_str                 | empty_mobile_err_msg   |
      | Invalid Mobile Number Format (< 10 digits) | 5_digits_str              | invalid_mobile_number_errormesg |
      | Too Long Mobile Number (> 13 digits)       | Long_digit_str            | invalid_mobile_number_errormesg |
      | Alphanumeric MobileNumber                  | str_with_alphanumeric     | invalid_mobile_number_errormesg |
      | Special Characters Mobile Number           | str_with_special_char     |  invalid_mobile_number_errormesg|

  Scenario: MIRA-1661 - Save Device Information - Verify the API for Empty OTP Verified Field
    Given register device:
      | otp_verified |  |
    Then the response status code should be 400
    And response should have the following properties:
      | status  | status_false               |
      | code    | error_code                 |
      | message | empty_otp_verified_err_msg |

  Scenario: MIRA-1662 - Verify API Response When Device Configuration Fields Are Empty
    Given register device:
      | device_configuration.model      |  |
      | device_configuration.os_version |  |
      | device_configuration.battery    |  |
    Then the response status code should be 400
    And response should have the following properties:
      | status  | status_false                |
      | code    | error_code                  |
      | message | empty_config_fields_err_msg |

  Scenario: MIRA-1663 and 7467- Verify API Response When Device Configuration Fields Are Invalid
    Given register device:
      | device_configuration.model      | str_with_special_char  |
      | device_configuration.os_version | str_with_special_char  |
      | device_configuration.battery    | str_with_special_char  |
    Then the response status code should be 400
    And response should have the following properties:
      | status  | status_false                  |
      | code    | error_code                    |
      | message | invalid_config_fields_err_msg |

  Scenario Outline: MIRA-1664 - Verify API Fails with Invalid Email <test_case_id>
    Given register device:
      | email | <email> |
    Then the response status code should be 400
    And response should have the following properties:
      | status  | status_false       |
      | code    | error_code         |
      | message | <expected_message> |

    Examples:
      | test_case_id     | email                   | expected_message        |
      | Empty Email      | empty_str               | empty_email_err_msg     |
      | Missing @ Symbol | invalid_email_no_at     | invalid_email_error_msg |
      | Missing Domain   | invalid_email_no_domain | invalid_email_error_msg |

  Scenario: MIRA-7411 - Save Device Information - Verify the API for Invalid Unique Device ID
    Given register device:
      | unique_device_id | str_with_special_char |
    Then the response status code should be 400
    And response should have the following properties:
      | status  | status_false              |
      | code    | error_code                |
      | message | invalid_device_id_err_msg |
