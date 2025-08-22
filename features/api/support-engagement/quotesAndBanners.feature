Feature: Support and Engagement - Quotes and Banners

    Rule: Create Banners API

        @MIRA-8704
        Scenario: MIRA-8704 Create Banner Items API – Should create a banner when valid image_url, action_url, display_order, active_from, and active_to are provided
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
            And as a developer, I verify the created Marketing Carousel in database
            Then as a developer, I delete the Marketing Carousel
        
        @MIRA-8705 
        Scenario: MIRA-8705 Create Banner Items API – Should return 400 when image_url is missing from the request
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | image_url | __REMOVE__ |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | image_url_required_message |
        
        @MIRA-8706
        Scenario: MIRA-8706 Create Banner Items API – Should return 400 when action_url is not provided in the payload
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | action_url | __REMOVE__ |
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
            And as a developer, I verify the created Marketing Carousel in database
            Then as a developer, I delete the Marketing Carousel
        
        @MIRA-8707
        Scenario: MIRA-8707 Create Banner Items API – Should return 400 when display_order field is not included    
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | display_order | __REMOVE__ |
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
            And as a developer, I verify the created Marketing Carousel in database
            Then as a developer, I delete the Marketing Carousel
        
        @MIRA-8708
        Scenario: MIRA-8708 Create Banner Items API – Should return 400 when active_from is not sent in the request
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | active_from | __REMOVE__ |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | active_from_required_message |  

        @MIRA-8709
        Scenario: MIRA-8709 Create Banner Items API – Should return 400 when active_to field is not provided
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | active_to | __REMOVE__ |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | active_to_required_message |
        
        @MIRA-8710
        Scenario: MIRA-8710 CCreate Banner Items API – Should return 400 when image_url is passed as an empty string
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | image_url |  |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | image_url_empty_string_message |
        
        @MIRA-8711
        Scenario: MIRA-8711 Create Banner Items API – Should return 400 when display_order is sent as a string instead of a number
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | display_order | aa |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | display_order_number_message |

        @MIRA-8712
        Scenario: MIRA-8712 Create Banner Items API – Should return 400 when active_from is in an invalid date format
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | active_from | 2023-01-01-01-01-01 |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | active_from_invalid_date_format_message |
        
        @MIRA-8713
        Scenario: MIRA-8713 Create Banner Items API – Should return 400 when active_to date is earlier than active_from
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | active_to | 2023-01-01 |
            | active_from | 2024-01-01 |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | active_to_earlier_than_active_from_message |
        
        @MIRA-8714
        Scenario: MIRA-8714 Create Banner Items API – Should return 400 when unknown fields are passed in the body
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | unknown_field | 123 |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | unknown_field_message |

        @MIRA-8716
        Scenario: MIRA-8716 Create Banner Items API – Should return 400 when all required fields are missing in the request
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | image_url | __REMOVE__ |
            | active_from | __REMOVE__ |
            | active_to | __REMOVE__ |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | banner_required_fields_message |

        @MIRA-8717
        Scenario: MIRA-8717 Create Banner Items API – Should return 400 when action_url is passed as a number
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel:
            | action_url | 123 |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | action_url_number_message |

    Rule: Get Banners API

        @MIRA-5898 @MIRA-5900 @MIRA-5901 @MIRA-5904 @MIRA-5910 @MIRA-5917
        Scenario: MIRA-5898, MIRA-5900, MIRA-5901 & MIRA-5904, MIRA-5910, MIRA-5917 Get Marketing Banner Items API (200 & valid data)
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
            And as a developer, I verify the created Marketing Carousel in database
            Then as a developer, I get Marketing Carousel
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
            Then the response time should be less than 5000 milliseconds
            Then as a developer, I delete the Marketing Carousel

        @MIRA-5899
        Scenario: MIRA-5899 Get Marketing Banner Items - should filter and return only active banners when active=true
            Given i login as a admin using user "admin.d"
            Then as a developer, I get Marketing Carousel with query parameters:
            | is_active | true |
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"

        @MIRA-5905
        Scenario: MIRA-5905 Unauthorized access to Get Marketing Banner Items - expect 401 for missing token
            Given i do not have authentication token
            Then as a developer, I get Marketing Carousel with ID "2"
            Then the response status code should be 401
            Then response should have the following properties:
            | message | authorization_header_message |

    Rule: Get Banner by ID API

        @MIRA-8749 @MIRA-8754
        Scenario: MIRA-8749, MIRA-8754 Get Banner Items By ID API – Should return banner item for a valid banner ID
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel
            Then as a developer, I get Marketing Carousel
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
            And as a developer, I verify the received Marketing Carousel in database
            Then as a developer, I delete the Marketing Carousel

        
        @MIRA-8750
        Scenario: MIRA-8750 Get Banner Items By ID API – Should return 404 if the banner item does not exist
            Given i login as a admin using user "admin.d"
            Then as a developer, I get Marketing Carousel with ID "100"
            Then the response status code should be 404
            Then response should have the following properties:
            | message | carousel_item_not_found |
        
        
        @MIRA-8752
        Scenario: MIRA-8752 Get Banner Items By ID API – Should return 400 when invalid banner ID format is provided
            Given i login as a admin using user "admin.d"
            Then as a developer, I get Marketing Carousel with ID "ABN1100"
            Then the response status code should be 404
            Then response should have the following properties:
            | message | carousel_item_not_found |
        
        @MIRA-8753
        Scenario: MIRA-8753 Get Banner Items By ID API – Should return 404 if banner item ID is missing in the request
            Given i login as a admin using user "admin.d"
            Then as a developer, I get Marketing Carousel with ID ""
            Then the response status code should be 200
            And as a developer, I verify all Marketing Carousels in database

    Rule: Get All Banners API

        @MIRA-8719 @MIRA-8727 
        Scenario: MIRA-8719, MIRA-8727 Get All Banner Items API – Should fetch all active banner items when is_active query param is not provided
            Given i login as a admin using user "admin.d"
            Then as a developer, I get all Marketing Carousels
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
            And as a developer, I verify all Marketing Carousels in database
        
        @MIRA-8720
        Scenario: MIRA-8720 Get All Banner Items API – Should fetch only active banner items when is_active is set to true
            Given i login as a admin using user "admin.d"
            Then as a developer, I get all Marketing Carousels with query parameters:
            | is_active | true |
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
            And I verify all returned Marketing Carousels are currently active


    Rule: Update Banners API

        @MIRA-8929
        Scenario: MIRA-8929 Update Carousel Item with Valid Data
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
            And as a developer, I verify the created Marketing Carousel in database
            Then as a developer, I update the Marketing Carousel
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
            And I verify the Marketing Carousel has been updated correctly
            Then as a developer, I delete the Marketing Carousel

        
        @MIRA-8930
        Scenario: MIRA-8930 Update Nonexistent Carousel Item
            Given i login as a admin using user "admin.d"
            Then as a developer, I update the Marketing Carousel with id "100"
            Then the response status code should be 404
            Then response should have the following properties:
            | message | carousel_item_not_found |

        @MIRA-8931
        Scenario: MIRA-8931 Update Carousel Item with Missing Path Parameter
            Given i login as a admin using user "admin.d"
            Then as a developer, I update the Marketing Carousel with id " "
            Then the response status code should be 405
            Then response should have the following properties:
            | error | method_not_allowed_error                           |
            | message | patch_method_not_allowed_message |

        @MIRA-8932
        Scenario: MIRA-8932 Update Carousel Item with No Fields in Body
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel
            Then as a developer, I update the Marketing Carousel:
            | image_url | __REMOVE__ |
            | action_url | __REMOVE__ |
            | display_order | __REMOVE__ |
            | active_from | __REMOVE__ |
            | active_to | __REMOVE__ |
            Then the response status code should be 400
            Then response should have the following properties:
            | message | empty_request_body_message |
            Then as a developer, I delete the Marketing Carousel
        
        #failed
        @MIRA-8933
        Scenario: MIRA-8933 Send only image_url or any one valid field
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel
            Then as a developer, I update the Marketing Carousel:
            | action_url | __REMOVE__ |
            | display_order | __REMOVE__ |
            | active_from | __REMOVE__ |
            | active_to | __REMOVE__ |
            Then the response status code should be 200
            Then response should have fields "data,carousel_item_id,image_url,action_url,display_order,active_from,active_to,created_at,updated_at"
            And I verify the Marketing Carousel has been updated correctly
            Then as a developer, I delete the Marketing Carousel

        @MIRA-8934
        Scenario: MIRA-8934 Update Carousel with Invalid Field Types
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel
            Then as a developer, I update the Marketing Carousel:
            | display_order | aa |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | display_order_number_message |
            Then as a developer, I delete the Marketing Carousel
        #failed
        @MIRA-8935
        Scenario: MIRA-8935 Update Carousel with Past Dates
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel
            Then as a developer, I update the Marketing Carousel:
            | active_from | 2024-01-01 |
            | active_to | 2023-01-01 |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | active_from_past_date_message |
            Then as a developer, I delete the Marketing Carousel

    Rule: Delete Banners API

        @MIRA-8925
        Scenario: MIRA-8925 Delete Carousel Item with Valid ID
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel
            Then the response status code should be 200
            Then as a developer, I delete the Marketing Carousel
            Then the response status code should be 200
            Then response should have the following properties:
            | message | delete_banner_success_message |

        #failed
        @MIRA-8926
        Scenario: MIRA-8926 Delete Carousel Item with Nonexistent ID
            Given i login as a admin using user "admin.d"
            Then as a developer, I delete the Marketing Carousel with id "100"
            Then the response status code should be 404
            Then response should have the following properties:
            | message | resource_not_found_message |

        @MIRA-8927
        Scenario: MIRA-8927 Delete Carousel Item Without Path Parameter
            Given i login as a admin using user "admin.d"
            Then as a developer, I delete the Marketing Carousel with id " "
            Then the response status code should be 405
            Then response should have the following properties:
            | error | method_not_allowed_error                           |
            | message | delete_method_not_allowed_message |
        
        #failed
        @MIRA-8928
        Scenario: MIRA-8928 Delete Same Carousel Item Twice
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Marketing Carousel
            Then the response status code should be 200
            Then as a developer, I delete the Marketing Carousel
            Then the response status code should be 200
            Then response should have the following properties:
            | message | delete_banner_success_message |
            Then as a developer, I delete the Marketing Carousel
            Then the response status code should be 404
            Then response should have the following properties:
            | message | resource_not_found_message |

    Rule: Create Quote of the Day API

        @MIRA-8936
        Scenario: MIRA-8936 Create Quote with Valid Data
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote
            Then the response status code should be 200
            Then response should have fields "data,quote_id,quote_text,author_name,quote_date,show_days,is_active,created_at,updated_at"
            And as a developer, I verify the created Quote in database
            Then as a developer, I delete the Quote

        @MIRA-8937
        Scenario: MIRA-8937 Create Quote with Missing quote_text
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote:
            | quote_text | __REMOVE__ |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | quote_text_required_message |

        @MIRA-8938
        Scenario: MIRA-8938 Create Quote with Missing author_name
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote:
            | author_name | __REMOVE__ |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | author_name_required_message |
        
        @MIRA-8939
        Scenario: MIRA-8939 Create Quote with Missing quote_date
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote:
            | quote_date | __REMOVE__ |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | quote_date_required_message |
        
        @MIRA-8940
        Scenario: MIRA-8940 Create Quote with Missing show_days
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote:
            | show_days | __REMOVE__ |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | show_days_required_message |

        @MIRA-8941
        Scenario: MIRA-8941 Create Quote with Missing is_active
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote:
            | is_active | __REMOVE__ |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | is_active_required_message |
        
        @MIRA-8942
        Scenario: MIRA-8942 Create Quote with Invalid quote_date Format
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote:
            | quote_date | 2023-01 |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | invalid_quote_date_value_message |

        @MIRA-8943
        Scenario: MIRA-8943 Create Quote with Non-integer show_days
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote:
            | show_days | 0.5 |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | invalid_show_days_value_message |
        
        @MIRA-8944
        Scenario: MIRA-8944 Create Quote with Empty show_days array
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote:
            | show_days | [] |
            Then the response status code should be 200
            Then response should have fields "data,quote_id,quote_text,author_name,quote_date,show_days,is_active,created_at,updated_at"
            And as a developer, I verify the created Quote in database
            Then as a developer, I delete the Quote

        @MIRA-8945
        Scenario: MIRA-8945 Create Quote with invalid show_days
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote:
            | show_days | [50,01] |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | invalid_show_days_value_message |

    Rule:   Update Quote of the Day API

        @MIRA-8946
        Scenario: MIRA-8946 Update Quote with Valid Fields
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote
            Then the response status code should be 200
            Then as a developer, I update the Quote
            Then the response status code should be 200
            Then response should have fields "data,quote_id,quote_text,author_name,quote_date,show_days,is_active,created_at,updated_at"
            And I verify the Quote has been updated correctly
            Then as a developer, I delete the Quote
        
        @MIRA-8947
        Scenario: MIRA-8947 Update Quote with Empty Request Body
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote
            Then as a developer, I update the Quote:
            | quote_text | __REMOVE__ |
            | author_name | __REMOVE__ |
            | quote_date | __REMOVE__ |
            | show_days | __REMOVE__ |
            | is_active | __REMOVE__ |
            Then the response status code should be 400
            Then response should have the following properties:
            | message | empty_request_body_message |
            Then as a developer, I delete the Quote
        
        #failed
        @MIRA-8948
        Scenario: MIRA-8948 Update Quote with Invalid quote_date Format
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote
            Then as a developer, I update the Quote:
            | quote_date | 2023-01 |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | quote_text_string_message |
            Then as a developer, I delete the Quote
        
        @MIRA-8949
        Scenario: MIRA-8949 Update Quote with Invalid show_days
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote
            Then as a developer, I update the Quote:
            | show_days | [50,01] |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | invalid_show_days_value_message |
        
        @MIRA-8950
        Scenario: MIRA-8950 Update Quote with Non-existent quoteId
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote
            Then as a developer, I update the Quote with id "100"
            Then the response status code should be 404
            Then response should have the following properties:
            | status | status_false |
            | message | quote_not_found_message |
            Then as a developer, I delete the Quote
        
        
    Rule: Get Quote of the Day by ID API

        @MIRA-11242
        Scenario: MIRA-11242 Get Quote of the Day by ID
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote
            Then as a developer, I get Quote
            Then the response status code should be 200
            Then response should have fields "data,quote_id,quote_text,author_name,quote_date,show_days,is_active,created_at,updated_at"
            Then as a developer, I delete the Quote

        @MIRA-11243
        Scenario: MIRA-11243 Get Quote with Empty Quote ID
            Given i login as a admin using user "admin.d"
            Then as a developer, I get Quote with ID ""
            Then the response status code should be 200
            
        @MIRA-11244
        Scenario: MIRA-11244 Get Quote with Non-existent Quote ID
            Given i login as a admin using user "admin.d"
            Then as a developer, I get Quote with ID "100"
            Then the response status code should be 404
            Then response should have the following properties:
            | status | status_false |
            | message | quote_not_found_message |
            
    Rule: Get all quotes of the day based on active flag API

        @MIRA-8951
        Scenario: MIRA-8951 Get Quote by Valid Quote ID
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote
            And as a developer, I get Quote
            Then the response status code should be 200
            Then response should have fields "data,quote_id,quote_text,author_name,quote_date,show_days,is_active,created_at,updated_at"
            Then as a developer, I delete the Quote

        @MIRA-8952
        Scenario: MIRA-8952 Get Quote with Empty Quote ID
            Given i login as a admin using user "admin.d"
            Then as a developer, I get Quote with ID ""
            Then the response status code should be 200

        @MIRA-8953
        Scenario: MIRA-8953 Get Quote with Non-existent Quote ID
            Given i login as a admin using user "admin.d"
            Then as a developer, I get Quote with ID "100"
            Then the response status code should be 404
            Then response should have the following properties:
            | status | status_false |
            | message | quote_not_found_message |
        
        @MIRA-8954
        Scenario: MIRA-8954 Get Active Quotes
            Given i login as a admin using user "admin.d"
            Then as a developer, I get Quote with query parameters:
            | is_active | true |
            Then the response status code should be 200
            Then response should have fields "data,quote_id,quote_text,author_name,quote_date,show_days,is_active,created_at,updated_at"
            
        
        @MIRA-8955
        Scenario: MIRA-8955 Get Inactive Quotes
            Given i login as a admin using user "admin.d"
            Then as a developer, I get Quote with query parameters:
            | is_active | false |
            Then the response status code should be 200
            
        @MIRA-8958
        Scenario: MIRA-8958 Get Quotes with Invalid is_active
            Given i login as a admin using user "admin.d"
            Then as a developer, I get Quote with query parameters:
            | is_active | invalid |
            Then the response status code should be 400
            Then response should have the following properties:
            | status | status_false |
            | message | invalid_query_active_flag_message |
            
        @MIRA-8962
        Scenario: MIRA-8962 Get All Quotes Without Any Filters
            Given i login as a admin using user "admin.d"
            Then as a developer, I get all Quotes
            Then the response status code should be 200

    Rule: Delete Quote of the Day API

        #failed
        @MIRA-8960
        Scenario: MIRA-8960 Delete Valid Quote
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote
            Then the response status code should be 200
            Then as a developer, I delete the Quote
            Then the response status code should be 200
            Then response should have the following properties:
            | message | quote_deleted_message |

        #failed
        @MIRA-8961
        Scenario: MIRA-8961 Delete Non-Existent Quote
            Given i login as a admin using user "admin.d"
            Then as a developer, I delete the Quote with id "100"
            Then the response status code should be 404
            Then response should have the following properties:
            | message | quote_not_found_message |

        #failed
        @MIRA-8963
        Scenario: MIRA-8963 Delete Already Deleted Quote
            Given i login as a admin using user "admin.d"
            Then as a developer, I create a Quote
            Then the response status code should be 200
            Then as a developer, I delete the Quote
            Then the response status code should be 200
            Then response should have the following properties:
            | message | quote_deleted_message |
            Then as a developer, I delete the Quote
            Then the response status code should be 404
            Then response should have the following properties:
            | message | quote_not_found_message |


            
            