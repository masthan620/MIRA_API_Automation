Feature: Support and Engagement - Tickets, FAQs and Resources

  Rule: Create Tickets API  

    @MIRA-8841 @MIRA-8848
    Scenario: MIRA-8841, MIRA-8848 Create Ticket API – Verify with valid category, description, and file
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue
      Then the response status code should be 200
      Then response should have fields "data,issue_id,category,description,status,priority,assigned_to,created_by,created_at,updated_at"
      And as a developer, I verify the Issue was created by the logged-in user
      And as a developer, I verify the created Issue in database
      Then as a developer, I delete the Issue

    @MIRA-8842
    Scenario: MIRA-8842 Create Ticket API – Verify with valid category and description (no file)
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue:
        | file | __REMOVE__ |
      Then the response status code should be 200
      Then response should have fields "data,issue_id,category,description,status,priority,assigned_to,created_by,created_at,updated_at"
      And as a developer, I verify the Issue was created by the logged-in user
      And as a developer, I verify the created Issue in database
      Then as a developer, I delete the Issue

    @MIRA-8843
    Scenario: MIRA-8843 Create Ticket API – Verify response with empty category
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue:
        | category | __REMOVE__ |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false           |
        | message | category_empty_message |

    @MIRA-8844
    Scenario: MIRA-8844 Create Ticket API – Verify response with empty description
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue:
        | description | __REMOVE__ |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false         |
        | message | description_required |

    @MIRA-8845
    Scenario: MIRA-8845 Create Ticket API – Verify response with null category and description
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue:
        | category    | __REMOVE__ |
        | description | __REMOVE__ |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false                           |
        | message | category_and_description_empty_message |

    @MIRA-8846
    Scenario: MIRA-8846 Create Ticket API – Verify behavior with invalid file type
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue:
        | file | new file |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false              |
        | message | file_invalid_type_message |

    @MIRA-8847
    Scenario: MIRA-8847 Create Ticket API – Verify response with very long category, description  some many files upload
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue:
        | category    | "12345678901234567890123456789012345678901234567890123456789012345678901234567890" |
        | description | "12345678901234567890123456789012345678901234567890123456789012345678901234567890" |
      Then the response status code should be 200

  Rule: Get All Tickets API

    @MIRA-8697 @MIRA-8700
    Scenario: MIRA-8697, MIRA-8700 Fetch all tickets API - Verify successful response with valid JWT token
      Given i login as a admin using user "admin_2"
      Then as a developer, I get all Issues
      Then the response status code should be 200
      And as a developer, I verify all Issues in database
      Then the response time should be less than 5000 milliseconds

    @MIRA-8698
    Scenario: MIRA-8698 Fetch all tickets API - Verify response when JWT token is missing and Empty
      Given i do not have authentication token
      Then as a developer, I get all Issues
      Then the response status code should be 401
      Then response should have the following properties:
        | message | authorization_header_message |

    @MIRA-8699
    Scenario: MIRA-8699 Fetch all tickets API - Verify response with invalid JWT token format
      Given i have invalid authentication token
      Then as a developer, I get all Issues
      Then the response status code should be 401
      Then response should have the following properties:
        | message | authorization_header_message |

  Rule: Get Ticket by ID API

    @MIRA-11310 @MIRA-11313
    Scenario: MIRA-11310, MIRA-11313 Verify GET Support Ticket Details by Valid Ticket ID
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue
      Then the response status code should be 200
      And as a developer, I get Issue
      Then response should have fields "data,issue_id,category,description,status,priority,assigned_to,created_by,created_at,updated_at"
      And the response time should be less than 5000 milliseconds
      Then as a developer, I delete the Issue

    @MIRA-11311
    Scenario: MIRA-11311 Verify GET Support Ticket Details by Invalid Ticket ID Format
      Given i login as a admin using user "admin_2"
      Then as a developer, I get Issue with ID "100"
      Then the response status code should be 404
      Then response should have the following properties:
        | message | ticket_not_found_message |

    @MIRA-11312
    Scenario: MIRA-11312 Verify Get Support Ticket Details By Missing Ticket ID in URL
      Given i login as a admin using user "admin_2"
      Then as a developer, I get Issue with ID ""
      Then the response status code should be 200
      And as a developer, I verify all Issues in database

  Rule: Update Tickets API

    @MIRA-11317
    Scenario: MIRA-11317 Update Issue - Valid Request with All Fields
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue
      Then the response status code should be 200
      And as a developer, I update the Issue
      Then the response status code should be 200
      And I verify the Issue has been updated correctly
      Then as a developer, I delete the Issue

    @MIRA-11318
    Scenario: MIRA-11318 Update Issue - Partial Field Update
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue
      Then the response status code should be 200
      And as a developer, I update the Issue:
        | description | __REMOVE__ |
        | file        | __REMOVE__ |
      Then the response status code should be 200
      And I verify the Issue has been updated correctly
      Then as a developer, I delete the Issue

    @MIRA-11319
    Scenario: MIRA-11319 Update Issue - Non-existent Issue ID
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue
      Then the response status code should be 200
      And as a developer, I update the Issue with id "100"
      Then the response status code should be 404
      Then response should have the following properties:
        | message | ticket_not_found_message |
      Then as a developer, I delete the Issue

    @MIRA-11320
    Scenario: MIRA-11320 Update Issue - Invalid Request Body
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue
      Then as a developer, I update the Issue:
        | unknown_field | invalid_value |
      Then the response status code should be 400
      Then response should have the following properties:
        | message | unknown_field_message |

    @MIRA-11321
    Scenario: MIRA-11321 Update Issue - Missing Authentication
      Given i do not have authentication token
      Then as a developer, I update the Issue with id "100"
      Then the response status code should be 401
      Then response should have the following properties:
        | message | authorization_header_message |

    @MIRA-11322
    Scenario: MIRA-11322 Update Issue - Empty Request Body
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue
      Then the response status code should be 200
      And as a developer, I update the Issue:
        | category    | __REMOVE__ |
        | description | __REMOVE__ |
        | attachments | __REMOVE__ |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false               |
        | message | empty_request_body_message |
      Then as a developer, I delete the Issue

  Rule: Delete Tickets API

    @MIRA-8764
    Scenario: MIRA-8764 Delete tickets by TicketId API - Verify successful response with valid userId and token
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an Issue
      Then the response status code should be 200
      And as a developer, I delete the Issue
      Then the response status code should be 200
      Then response should have the following properties:
        | message | ticket_deleted_message |

    @MIRA-8765
    Scenario: MIRA-8765 Delete tickets by TicketId API - Invalid TicketId format
      Given i login as a admin using user "admin_2"
      Then as a developer, I delete the Issue with id "TICKET100"
      Then the response status code should be 404
      Then response should have the following properties:
        | status  | status_false             |
        | message | ticket_not_found_message |

    @MIRA-8766
    Scenario: MIRA-8766 Delete tickets by TicketId API - Verify with Empty TicketId
      Given i login as a admin using user "admin_2"
      Then as a developer, I delete the Issue with id " "
      Then the response status code should be 405
      Then response should have the following properties:
        | error   | method_not_allowed_error          |
        | message | delete_method_not_allowed_message |

    @MIRA-8767
    Scenario: MIRA-8767 Delete tickets by TicketId API - Verify with Missing JWT token in Headers
      Given i do not have authentication token
      Then as a developer, I delete the Issue with id "100"
      Then the response status code should be 401
      Then response should have the following properties:
        | message | authorization_header_message |

  Rule: Create FAQ and Resource API

    @MIRA-8508 @MIRA-6509 @MIRA-6523
    Scenario: MIRA-8508, MIRA-6509, MIRA-6523 Creates FAQ And Resource – Verify API Successfully Creates an FAQ with Valid Data
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then response should have fields "data,faq_id,question,answer,created_at,updated_at,sub_category_id,is_popular,resource_id,resource_type,resource_url"
      Then as a developer, I delete the FAQ

    @MIRA-6510
    Scenario: MIRA-6510 Creates FAQ and Resource – Verify FAQ Can Be Created Without is_popular Field (Optional Field)
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ:
        | is_popular | __REMOVE__ |
      Then the response status code should be 200
            # Then response should have fields "data,faq_id,question,answer,created_at,updated_at,sub_category_id,is_popular,resource_id,resource_type,resource_url"
      Then as a developer, I delete the FAQ

    @MIRA-6511
    Scenario: MIRA-6511 Creates FAQ and Resource – Verify API Accepts Maximum Allowed Character Length for 'question' and 'answer' Fields
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ:
        | question | "12345678901234567890123456789012345678901234567890123456789012345678901234567890" |
        | answer   | "12345678901234567890123456789012345678901234567890123456789012345678901234567890" |
      Then the response status code should be 200
      Then response should have fields "data,faq_id,question,answer,created_at,updated_at,sub_category_id,is_popular,resource_id,resource_type,resource_url"
      Then as a developer, I delete the FAQ

    @MIRA-6513
    Scenario: MIRA-6513 Creates FAQ and Resource – Verify API Returns 400 Bad Request for Missing Required Fields
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ:
        | question | __REMOVE__ |
        | answer   | __REMOVE__ |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false                         |
        | message | question_and_answer_required_message |

    @MIRA-6514
    Scenario: MIRA-6514 Creates FAQ and Resource – Verify API Returns 400 Bad Request for Empty Request Body
      Given i login as a admin using user "admin_2"
      And as a developer, I create an FAQ:
        | sub_category_id | __REMOVE__ |
        | question        | __REMOVE__ |
        | answer          | __REMOVE__ |
        | is_popular      | __REMOVE__ |
        | resources       | __REMOVE__ |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false                  |
        | message | faq_request_body_null_message |

    @MIRA-6515
    Scenario: MIRA-6515 Creates FAQ and Resource – Verify API Returns 400 Bad Request for Invalid sub_category_id Format
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ:
        | sub_category_id | invalid |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false                    |
        | message | invalid_sub_category_id_message |

  Rule: Get FAQ by ID API

    @MIRA-7886 @MIRA-7890 @MIRA-7893 @MIRA-7894
    Scenario: MIRA-7886, MIRA-7890, MIRA-7893, MIRA-7894 Get FAQ by faqId - Verify FAQ is Retrieved Successfully for Valid faqId
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then as a developer, I get FAQ
      Then the response status code should be 200
      And the response time should be less than 5000 milliseconds
      Then response should have fields "data,question,answer,sub_category_id,is_popular,resources"
      Then as a developer, I delete the FAQ

    @MIRA-7887
    Scenario: MIRA-7887 Get FAQ by faqId – Verify Error When faqId is Invalid
      Given i login as a admin using user "admin_2"
      Then as a developer, I get FAQ with ID "invali"
      Then the response status code should be 404
      Then response should have the following properties:
        | status  | status_false         |
        | message | no_faq_found_message |

    @MIRA-7888
    Scenario: MIRA-7888 Get FAQ by faqId – Verify Behavior When Authorization Header Is Missing
      Given i do not have authentication token
      Then as a developer, I get FAQ with ID "100"
      Then the response status code should be 401
      Then response should have the following properties:
        | message | authorization_header_message |

    @MIRA-7891
    Scenario: MIRA-7891 Get FAQ by faqId – Verify API Returns 400 for Empty faqId
      Given i login as a admin using user "admin_2"
      Then as a developer, I get FAQ with ID ""
      Then the response status code should be 200

  Rule: Get FAQ by Subcategory ID API

    @MIRA-6530 @MIRA-6531 @MIRA-6534 @MIRA-6540 @MIRA-6544
    Scenario: MIRA-6530, MIRA-6531, MIRA-6534, MIRA-6540, MIRA-6544 Get FAQ by Subcategory ID – Verify API Returns 200 for Valid Subcategory ID
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then as a developer, I get all FAQs with query parameters:
        | sub_category_id | {sub_category_id} |
      Then the response status code should be 200
      And the response time should be less than 5000 milliseconds
      Then response should have fields "data,faq_id,question,answer,sub_category_id,is_popular,resources"
      And as a developer, I verify the received FAQ in database
      Then as a developer, I delete the FAQ

    @MIRA-6532
    Scenario: MIRA-6532 Get FAQ by Popularity - Verify API Returns FAQs Successfully When Filtering by is_popular = true
      Given i login as a admin using user "admin_2"
      Then as a developer, I get all FAQs with query parameters:
        | is_popular | true |
      Then the response status code should be 200
      Then as a developer, I verify the received all FAQs in database

    @MIRA-6533
    Scenario: MIRA-6533 Get FAQ - Verify API Works Correctly When Multiple Query Parameters Are Passed Together
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then as a developer, I get all FAQs with query parameters:
        | sub_category_id | {sub_category_id} |
        | is_popular      | true              |
      Then the response status code should be 200
      And as a developer, I verify the received FAQ in database
      Then as a developer, I delete the FAQ

    @MIRA-6535
    Scenario: MIRA-6535 Get FAQ By Category - Verify API Returns 400 Bad Request for an Invalid sub_category_id Format
      Given i login as a admin using user "admin_2"
      Then as a developer, I get all FAQs with query parameters:
        | sub_category_id | invalid |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false                          |
        | message | invalid_query_sub_category_id_message |

    @MIRA-6536
    Scenario: MIRA-6536 Get FAQ By Category - Verify API Returns 400 Bad Request for an Invalid is_popular Value
      Given i login as a admin using user "admin_2"
      Then as a developer, I get all FAQs with query parameters:
        | is_popular | invalid |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false                           |
        | message | invalid_query_is_popular_value_message |

    @MIRA-6537
    Scenario: MIRA-6537 Get FAQ By Category - Verify API Returns 404 Not Found When No FAQs Match the Search Criteria
      Given i login as a admin using user "admin_2"
      Then as a developer, I get all FAQs with query parameters:
        | sub_category_id | 123456 |
      Then the response status code should be 404
      Then response should have the following properties:
        | status  | status_false          |
        | message | no_faqs_found_message |

    @MIRA-6538
    Scenario: MIRA-6538 Get FAQ By Category - Verify API Returns 401 Unauthorized if Bearer Token is Missing
      Given i do not have authentication token
      Then as a developer, I get all FAQs with query parameters:
        | sub_category_id | 123456 |
      Then the response status code should be 401
      Then response should have the following properties:
        | message | authorization_header_message |

  Rule: Update FAQ API

    @MIRA-7901 @MIRA-7902 @MIRA-7903
    Scenario: MIRA-7901, MIRA-7902, MIRA-7903 Update FAQ by faqId - Verify the API with Updated FAQ Question and Answer
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then as a developer, I update the FAQ
      Then the response status code should be 200
      And I verify the FAQ has been updated correctly
      Then as a developer, I delete the FAQ

    @MIRA-7904
    Scenario: MIRA-7904 Update FAQ by faqId – Verify Partial Update with Only is_popular Field
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then as a developer, I update the FAQ:
        | question | __REMOVE__ |
        | answer | __REMOVE__ |
        | resources | __REMOVE__ |
      Then the response status code should be 200
      And I verify the FAQ has been updated correctly
      Then as a developer, I delete the FAQ

    @MIRA-7905
    Scenario: MIRA-7905 Update FAQ by faqId – Verify API for Updating Resource Without Optional Field resource_type
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then as a developer, I update the FAQ:
        | resources | __REMOVE__ |
      Then the response status code should be 200
      And I verify the FAQ has been updated correctly
      Then as a developer, I delete the FAQ

    @MIRA-7907
    Scenario: MIRA-7907 Update FAQ by faqId – Verify API with Empty Payload
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then as a developer, I update the FAQ:
        | question   | __REMOVE__ |
        | answer     | __REMOVE__ |
        | resources  | __REMOVE__ |
        | is_popular | __REMOVE__ |
      Then the response status code should be 400
      And response should have the following properties:
        | status  | status_false               |
        | message | empty_request_body_message |
      Then as a developer, I delete the FAQ

    @MIRA-7908
    Scenario: MIRA-7908 Update FAQ by faqId – Verify API with Invalid Data Type for is_popular
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then as a developer, I update the FAQ:
        | is_popular | invalid |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false                     |
        | message | invalid_is_popular_value_message |

    @MIRA-7909
    Scenario: MIRA-7909 Update FAQ by faqId – Verify API with Invalid faqId Format
      Given i login as a admin using user "admin_2"
      Then as a developer, I update the FAQ with id "invalid"
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false           |
        | message | invalid_faq_id_message |

    @MIRA-7910
    Scenario: MIRA-7910 Update FAQ by faqId – Verify API Without Authorization
      Given i do not have authentication token
      Then as a developer, I update the FAQ with id "123"
      Then the response status code should be 401
      Then response should have the following properties:
        | message | authorization_header_message |

    @MIRA-7911
    Scenario: MIRA-7911 Update FAQ by faqId – Verify API with Expired or Invalid Token
      Given i have invalid authentication token
      Then as a developer, I update the FAQ with id "123"
      Then the response status code should be 401
      Then response should have the following properties:
        | message | authorization_header_message |

    @MIRA-7915
    Scenario: MIRA-7915 Update FAQ by faqId – Verify API for Update FAQ with Null Values for Optional Fields
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then as a developer, I update the FAQ:
        | answer | null |
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false           |
        | message | invalid_answer_message |
      Then as a developer, I delete the FAQ

    @MIRA-7916
    Scenario: MIRA-7916 Update FAQ by faqId – Verify API for Update Resource with Missing Description
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then as a developer, I update the FAQ:
        | resources[0].description | __REMOVE__ |
        | resources[1].description | __REMOVE__ |
      Then the response status code should be 200
      And I verify the FAQ has been updated correctly
      Then as a developer, I delete the FAQ

  Rule: Delete FAQ API

    @MIRA-7857 @MIRA-7859 @MIRA-7864
    Scenario: MIRA-7857, MIRA-7859, MIRA-7864 Delete FAQ by faqId – Verify successful deletion of an existing FAQ
      Given i login as a admin using user "admin_2"
      Then as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      Then as a developer, I delete the FAQ
      Then the response status code should be 200
      Then response should have the following properties:
        | message | delete_FAQ_success_message |
      And the response time should be less than 5000 milliseconds
      Then as a developer, I delete the FAQ
      Then the response status code should be 404
      Then response should have the following properties:
        | message | faq_not_found_message |

    @MIRA-7858
    Scenario: MIRA-7858 Delete FAQ by faqId – Verify response for invalid FAQ ID
      Given i login as a admin using user "admin_2"
      Then as a developer, I delete the FAQ with id "invalid"
      Then the response status code should be 400
      Then response should have the following properties:
        | status  | status_false           |
        | message | invalid_faq_id_message |

    @MIRA-7860
    Scenario: MIRA-7860 Delete FAQ by faqId – Verify response for Empty FAQ ID
      Given i login as a admin using user "admin_2"
      Then as a developer, I delete the FAQ with id " "
      Then the response status code should be 405
      Then response should have the following properties:
        | message | delete_method_not_allowed_message |

    @MIRA-7861
    Scenario: MIRA-7861 Delete FAQ by faqId – Verify error when Authorization header is missing
      Given i do not have authentication token
      Then as a developer, I delete the FAQ with id "123"
      Then the response status code should be 401
      Then response should have the following properties:
        | message | authorization_header_message |

    @MIRA-7862
    Scenario: MIRA-7862 Delete FAQ by faqId – Verify error with invalid JWT token
      Given i have invalid authentication token
      Then as a developer, I delete the FAQ with id "123"
      Then the response status code should be 401
      Then response should have the following properties:
        | message | authorization_header_message |

  Rule: Insert/Update like/dislike info

    @MIRA-8685
    Scenario: MIRA-8685 Insert/Update like/dislike info API - Should return 200 and create new like/dislike entry for new resourceId
      Given i login as a admin using user "admin_2"
      And as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      And as a developer, I update the FAQ Likes
      Then the response status code should be 200
      Then response should have fields "like_id,user_id,resource_id,source,is_liked,created_at,updated_at"
      Then as a developer, I delete the FAQ

    @MIRA-8686
    Scenario: MIRA-8686 Insert/Update like/dislike info API for Resource - Should return 200 and create new like/dislike entry for resource
      Given i login as a admin using user "admin_2"
      And as a developer, I create an FAQ Category
      And as a developer, I create an FAQ Subcategory
      And as a developer, I create an FAQ
      Then the response status code should be 200
      And as a developer, I update the Resource Likes
      Then the response status code should be 200
      Then response should have fields "like_id,user_id,resource_id,source,is_liked,created_at,updated_at"
      Then as a developer, I delete the FAQ
