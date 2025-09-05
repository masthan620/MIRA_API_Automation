@Ignore
Feature: End to End Scenarios

  @e2e @MIRA-11300 @smoke
  Scenario: MIRA-11300 - Verify End-to-End Device Registration, School Mapping, and Unmapping Process
    # Step 1: Register Device
    Given register device
    Then the response status code should be 200
    And response should have fields "device_id, message"
    Then verify the device ID from response exists in database
    Then verify that all device input values are correctly stored in the database
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
    When i login as a admin using user "admin_4"
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
    Scenario: MIRA-11349 - Verify User Can Successfully Reset Password via Teacher Approval Process
      Given as a student, I send a Reset Password request for user "student_8":
        | request_to | teacher |
      Then the response status code should be 200
      When i login as a teacher using user "teacher_1"
      Then the response status code should be 200
      And As a teacher, I get all the "password_reset" requests for the school "801234"
      And store user_id and request_id for the user "student_8" with status "pending"
      Then as a teacher, I approve password reset request for the user "student_8"
      And as a teacher, I reset password for "student_8"
      Then the response status code should be 200
      And response should have the following properties:
        | success | success_flag                   |
        | message | password_reset_success_message |
      When i login as a student using user "student_8"
      Then the response status code should be 200

    @MIRA-11349 @e2e
    Scenario: VMIRA-11349 - erify User Can Successfully Reset Password via Admin Approval Process
      Given as a teacher, I send a Reset Password request for user "student_9":
        | request_to | admin |
      Then the response status code should be 200
      When i login as a admin using user "admin_4"
      Then the response status code should be 200
      And As an admin, I get all the "password_reset" requests for the school "801234"
      And store user_id and request_id for the user "student_9" with status "pending"
      Then as an admin, I approve password reset request for the user "student_9"
      And as an admin, I reset password for "student_9"
      Then the response status code should be 200
      And response should have the following properties:
        | success | success_flag                   |
        | message | password_reset_success_message |
      When i login as a teacher using user "student_9"
      Then the response status code should be 200

  Rule: Support Engagement Scenarios

    @MIRA-11449 @e2e
    Scenario: MIRA-11449 - Complete Login to Help & Support FAQ System - Popular FAQs, Search, and Category Navigation
      # Step 1: Login as Admin
      Given i login as a admin using user "admin.d"
      Then the response status code should be 200
      
      # Step 2: Create FAQ Category and Subcategory for testing
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      
      # Step 3: Create multiple FAQs with different properties for comprehensive testing
      And as a developer, I create an FAQ:
        | is_popular | true |
      Then the response status code should be 200
      And as a developer, I create an FAQ:
        | is_popular | false |
      Then the response status code should be 200

      When i login as a admin using user "admin.d"
      Then the response status code should be 200
      # Step 4: Test Get All FAQs (General)
      Then as an admin, I get all FAQs
      Then the response status code should be 200
      And response should have fields "data,faq_id,question,answer,sub_category_id,is_popular,resources"
      And as a developer, I verify all FAQs in database
      
      # Step 5: Test Get FAQs by Popularity Filter
      Then as an admin, I get all FAQs with query parameters:
        | is_popular | true |
      Then the response status code should be 200
      And response should have fields "data,faq_id,question"
      
      # Step 6: Test Get FAQs by Subcategory Filter
      Then as an admin, I get all FAQs with query parameters:
        | sub_category_id | {sub_category_id} |
      Then the response status code should be 200
      And response should have fields "data,faq_id,question,answer,sub_category_id,is_popular,resources"
      And as a developer, I verify the received FAQ in database
      
      # Step 7: Test Get Specific FAQ by ID
      Then as an admin, I get FAQ
      Then the response status code should be 200
      And response should have fields "data,question,answer,sub_category_id,is_popular,resources"
      
      # Step 8: Test Get FAQ with Multiple Query Parameters
      Then as an admin, I get all FAQs with query parameters:
        | sub_category_id | {sub_category_id} |
        | is_popular | true |
      Then the response status code should be 200
      And response should have fields "data,faq_id,question,answer,sub_category_id,is_popular,resources"
      
      Then as a developer, I delete the FAQ
      
    @MIRA-11500 @e2e
    Scenario: MIRA-11500 - Complete Login to Help & Support Categories Display and Likes Flow
      # Step 1: Login as Admin
      Given i login as a admin using user "admin_1"
      Then the response status code should be 200
      
      # Step 2: Create FAQ Category, Subcategory and FAQ for testing
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      
      # Step 3: Verify Categories and Subcategories are displayed
      Then as an admin, I get all FAQ Categories
      Then the response status code should be 200
      And response should have fields "data,category_id,category_name,description"
      And as a developer, I verify all FAQ Categories in database
      
      # Step 4: Test Likes functionality - Default dislike
      And as a developer, I update the FAQ Likes
      Then the response status code should be 200
      
      # Step 5: Test Likes functionality - Like the resource
      And as a developer, I update the FAQ Likes:
        | is_liked | true |
      Then the response status code should be 200
      
      # Step 6: Get Likes information
      And as a developer, I get Likes
      Then the response status code should be 200
      And response should have fields "data"
      
      # Step 9: Cleanup
      Then as a developer, I delete the FAQ

    @MIRA-11501 @e2e
    Scenario: MIRA-11501 - Complete Login to Help & Support Sub-Categories Navigation Flow
      # Step 1: Login as Admin
      Given i login as a admin using user "admin_1"
      Then the response status code should be 200
      
      # Step 2 : Verify Categories and Subcategories are displayed
      Then as an admin, I get all FAQ Categories
      Then the response status code should be 200
      And response should have fields "data,category_id,category_name,description"
      And as a developer, I verify all FAQ Categories in database
      
      # Step 3 : Verify Subcategories are displayed
      Then as an admin, I get all FAQ Subcategories
      Then the response status code should be 200
      And response should have fields "data,sub_category_id,sub_category_name,description"
      And as a developer, I verify all FAQ Subcategories in database
    
    @MIRA-11504 @e2e
    Scenario: MIRA-11502 - CComplete Issue Ticket Creation Flow - From Login to Raising Support Ticket
    
      Given i login as a admin using user "admin_2"
      Then as a admin, I create an Issue
      Then the response status code should be 200
      Then response should have fields "data,issue_id,category,description,status,priority,assigned_to,created_by,created_at,updated_at"
      And as a developer, I verify the Issue was created by the logged-in user
      And as a developer, I verify the created Issue in database
      Then as a developer, I delete the Issue
    
    @MIRA-11505 @e2e
    Scenario: MIRA-11505 - Complete View My Support Tickets Flow - From Login to Viewing All Raised Issues
      # Step 1: Login as Admin
      Given i login as a admin using user "admin_2"
      Then the response status code should be 200
      
      # Step 2: Fetch issues created by the logged-in user
      Then as a developer, I fetch issues created by user "admin_2"
      Then the response status code should be 200
      And response should have fields "data,issue_id,category,description,status,priority,assigned_to,created_by,created_at,updated_at"
      And as a developer, I verify the Issue was created by the logged-in user
    
    @MIRA-11498
    Scenario: MIRA-11498 - Complete Login to Homepage Flow - Marketing Carousel and Quote Display
      Given i login as a admin using user "admin_3"
      Then as a developer, I get all Marketing Carousels
      Then the response status code should be 200
      Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
      And as a developer, I verify the received all Marketing Carousels in database
      Given as a developer, I create a quote with current date
      Given as a developer, I fetch today's quote
      Then the response status code should be 200
      Then response should have fields "data,quote_id,quote_text,author_name,quote_date,show_days,is_active,created_at,updated_at"

    @MIRA-11502
    Scenario: MIRA-11502 - Complete FAQ Like/Dislike Functionality Flow - From Login to Rating Articles
      Given i login as a admin using user "admin_3"
      Then the response status code should be 200
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then response should have fields "data,faq_id,question,answer,sub_category_id,is_popular,resources"
      And as a developer, I verify the created FAQ in database
      Then as a admin, I update the FAQ Likes
      Then the response status code should be 200
      Then response should have fields "data,like_id,user_id,resource_id,source,is_liked"
      Then as a developer, I get Likes
      Then the response status code should be 200
      Then as a developer, I delete the FAQ
    
    @MIRA-11503
    Scenario: MIRA-11503 - Complete FAQ Like/Dislike Functionality Flow - From Login to Rating Articles
      Given i login as a admin using user "admin_3"
      Then the response status code should be 200
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then response should have fields "data,faq_id,question,answer,sub_category_id,is_popular,resources"
      And as a developer, I verify the created FAQ in database
      Then as a admin, I update the Resource Likes
      Then the response status code should be 200
      Then response should have fields "data,like_id,user_id,resource_id,source,is_liked"
      Then as a developer, I get Likes
      Then the response status code should be 200
      And response should have fields "data,like_info,count,user_ids,dislike_info"
      Then as a developer, I delete the FAQ