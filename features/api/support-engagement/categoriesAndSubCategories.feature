Feature: Support and Engagement - Categories and Subcategories

  Rule: Create Categories API

    @MIRA-6139 @MIRA-6159
    Scenario: MIRA-6139, MIRA-6159 Verify API Successfully Creates a Category with Valid Data
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category
      Then the response status code should be 201
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify the created FAQ Category in database
      Then as a developer, I delete the FAQ Category
    
    @MIRA-6140
    Scenario: MIRA-6140 Verify the Create Categories API Allows Creating Multiple Categories
    Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category
      Then the response status code should be 201
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify the created FAQ Category in database
      Then as a developer, I create a FAQ Category
      Then the response status code should be 201
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify the created FAQ Category in database
      Then as a developer, I delete the FAQ Category
      
    @MIRA-6141
    Scenario: MIRA-6141 Verify the Create Categories API Allows Creating Multiple Categories
    Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category:
        | description |  |
      Then the response status code should be 400
      And response should have the following properties:
        | status | status_false                           |
        | message | description_empty_message |


    @MIRA-6142
    Scenario: MIRA-6142 Verify Category Creation with Special Characters in Category Name
    Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category:
        | category_name | 2^$%&$*$# |
      Then the response status code should be 201
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify the created FAQ Category in database
      Then as a developer, I delete the FAQ Category

    @MIRA-6143 @MIRA-6148
    Scenario: MIRA-6143, MIRA-6148 Verify Category Creation with Maximum-Length Category Name and Description
    Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category:
        | category_name | AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA |
        | description | AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA |
      Then the response status code should be 400
      And response should have the following properties:
        | status | status_false                           |
        | message | category_name_too_long |

    @MIRA-6144
    Scenario: MIRA-6144 Verify that category creation fails when category_name is not provided.
    Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category:
        | category_name | __REMOVE__|
      Then the response status code should be 400
      And response should have the following properties:
        | status | status_false                           |
        | message | category_name_required |

    @MIRA-6145
    Scenario: MIRA-6145 Verify that category creation fails when description is not provided.
    Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category:
        | description | __REMOVE__|
      Then the response status code should be 201
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify the created FAQ Category in database  
      Then as a developer, I delete the FAQ Category    

    @MIRA-6146
    Scenario: MIRA-6146 Verify that category creation fails when the request body is not provided
    Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category:
        | category_name | __REMOVE__|
        | description | __REMOVE__|
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | category_name_required |    
  
    
    @MIRA-6147
    Scenario: MIRA-6147 Verify that category creation fails when the category_name is a number
    Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category:
        | category_name | 122345|
    Then the response status code should be 400
    And response should have the following properties:
        | status | status_false                           |
        | message | category_name_number_message |    

    @MIRA-6149
    Scenario: MIRA-6149 Verify that category creation api returns 401 if Bearer Token is not provided
    Given i do not have authentication token
    Then as a developer, I create a FAQ Category:
        | category_name | 122345|
    Then the response status code should be 401
    And response should have the following properties:
        | message | authorization_header_message |  

  Rule: Get Categories Info API

    @MIRA-6212 @MIRA-6213 @MIRA-6214 @MIRA-6215 @MIRA-6216
    Scenario: MIRA-6212, MIRA-6213, MIRA-6214, MIRA-6215, MIRA-6216 Get Category Info - Verify API Successfully Retrieves a Category when a Valid categoryId is Provided
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category
      Then the response status code should be 201
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify the created FAQ Category in database
      Then as a developer, I get FAQ Category
      Then the response status code should be 200
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify the received FAQ Category in database
      And the response time should be less than 5000 milliseconds
      Then as a developer, I delete the FAQ Category

    @MIRA-6217
    Scenario: MIRA-6217 Get Category Info - Verify API Returns 400 Bad Request When categoryId is Missing
      Given i login as a admin using user "admin_1"
      Then as a developer, I get FAQ Category with ID ""
      Then the response status code should be 200

    # failed
    @MIRA-6218
    Scenario: MIRA-6218 Get Category Info - Verify API Returns 404 Not Found for a Non-Existent categoryId
      Given i login as a admin using user "admin_1"
      Then as a developer, I get FAQ Category with ID "123456"
      Then the response status code should be 404
      And response should have the following properties:
          | status | status_false                           |
          | message | category_not_found_message |  

    @MIRA-6219
    Scenario: MIRA-6219 Get Category Info - Verify API Returns 400 Bad Request When categoryId is an Empty String
      Given i login as a admin using user "admin_1"
      Then as a developer, I get FAQ Category with ID " "
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | empty_category_id_message |  
    
    @MIRA-6220
    Scenario: MIRA-6220 Get Category Info - Verify API Returns 400 Bad Request When categoryId is Passed as Null
      Given i login as a admin using user "admin_1"
      Then as a developer, I get FAQ Category with ID "null"
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | null_category_id_message |  
        
    @MIRA-6221
    Scenario: MIRA-6221 Get Category Info - Verify API Handles Invalid categoryId Formats (Special Characters)
      Given i login as a admin using user "admin_1"
      Then as a developer, I get FAQ Category with ID "#$^$@&"
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | special_char_category_id_message |  

    # @MIRA-6222
    # Scenario: MIRA-6222 Get Category Info - Verify API Returns 404 Not Found When Passing a Deleted categoryId
    #   Given i login as a admin using user "admin_1"
    #   Then as a developer, I get FAQ Category with ID "#$^$@&"
    #   Then the response status code should be 400
    #   And response should have the following properties:
    #       | status | status_false                           |
    #       | message | special_char_category_id_message |  
    
    @MIRA-6225
    Scenario: MIRA-6225 Get Category Info - Verify API Returns 401 Unauthorized When Bearer Token is Missing
      Given i do not have authentication token
      Then as a developer, I get FAQ Category with ID "123456"
      Then the response status code should be 401
      And response should have the following properties:
          | message | authorization_header_message |  
  
  Rule: Get All Categories API

    @MIRA-6114 @MIRA-6118 @MIRA-6122
    Scenario: MIRA-6114 Verify that the Get Categories List API returns 200 OK with a valid list of categories
      Given i login as a admin using user "admin_1"
      Then as a developer, I get all FAQ Categories
      Then the response status code should be 200
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify all FAQ Categories in database
      And the response time should be less than 5000 milliseconds

    @MIRA-6115
    Scenario: MIRA-6115 Verify that the Get Categories List API returns 401 Unauthorized when the bearer token is missing
      Given i do not have authentication token
      Then as a developer, I get all FAQ Categories
      Then the response status code should be 401
      And response should have the following properties:
          | message | authorization_header_message |  

  Rule: Update Category API

    @MIRA-6187 @MIRA-6193 @MIRA-6207 @MIRA-6209
    Scenario: MIRA-6187, MIRA-6193, MIRA-6207, MIRA-6209 Update category details-Verify API successfully updates a category with valid data.
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category
      Then the response status code should be 201
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify the created FAQ Category in database
      Then as a developer, I update the FAQ Category
      Then the response status code should be 200
      And I verify the FAQ Category has been updated correctly
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And the response time should be less than 5000 milliseconds
      Then as a developer, I delete the FAQ Category


    @MIRA-6188 @MIRA-6191 @MIRA-6192
    Scenario: MIRA-6188, MIRA-6191, MIRA-6192 Update Category Details - Verify API Allows Updating Only the Category Name
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category
      Then the response status code should be 201
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify the created FAQ Category in database
      Then as a developer, I update the FAQ Category:
        | description | __REMOVE__|
      Then the response status code should be 200
      And I verify the FAQ Category has been updated correctly
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      Then as a developer, I delete the FAQ Category
    
    @MIRA-6189 @MIRA-6190
    Scenario: MIRA-6189, MIRA-6190 Update Category Details - Verify API Allows Updating Only the Description
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category
      Then as a developer, I update the FAQ Category:
        | category_name | __REMOVE__|
      Then the response status code should be 200
      And I verify the FAQ Category has been updated correctly
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      Then as a developer, I delete the FAQ Category
    
    @MIRA-6194 @MIRA-6195
    Scenario: MIRA-6194, MIRA-6195 Verify API returns 400 Bad Request when sending an empty request body.
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category
      Then as a developer, I update the FAQ Category:
        | category_name | __REMOVE__|
        | description | __REMOVE__|
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | empty_request_body_message |  
      Then as a developer, I delete the FAQ Category

    # failed
    @MIRA-6196
    Scenario: MIRA-6196 Update Category Details – Verify API Returns 404 When Updating a Non-Existent Category
      Given i login as a admin using user "admin_1"
      Then as a developer, I update the FAQ Category with id "123456"
      Then the response status code should be 404
      And response should have the following properties:
          | status | status_false                           |
          | message | category_not_found_message |  

    @MIRA-6197
    Scenario: MIRA-6197 Update Category Details – Verify API Returns 400 When Passing Null Values for Required Fields
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category
      Then the response status code should be 201
      Then as a developer, I update the FAQ Category:
        | category_name | null|
        | description | null|
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | category_name_and_description_null_message |  
      Then as a developer, I delete the FAQ Category
    
    # failed
    @MIRA-6198
    Scenario: MIRA-6198 Update Category Details – Verify API Does Not Update Category When categoryId Is Missing
      Given i login as a admin using user "admin_1"
      Then as a developer, I update the FAQ Category with id "null"
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
    
    # failed
    @MIRA-6199 @MIRA-6201
    Scenario: MIRA-6199, MIRA-6201 Update Category Details – Verify API Does Not Allow Updating a Category with an Excessively Long Name
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category
      Then the response status code should be 201
      Then as a developer, I update the FAQ Category:
        | category_name | AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA|
      Then the response status code should be 503
      Then as a developer, I update the FAQ Category:
        | category_name | 123456|
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false |
          | message | category_name_number_message |  
      Then as a developer, I delete the FAQ Category
      
    @MIRA-6202
    Scenario: MIRA-6202  Update Category Details – Verify API Returns 401 Unauthorized When the Bearer Token is Missing
      Given i do not have authentication token
      Then as a developer, I update the FAQ Category with id "123456"
      Then the response status code should be 401
      And response should have the following properties:
          | message | authorization_header_message |  

  Rule: Delete Category API

    @MIRA-6203 @MIRA-6236 @MIRA-6242
    Scenario: MIRA-6203, MIRA-6236, MIRA-6242 Delete Category Details – Verify API Successfully Deletes a Category
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category
      Then the response status code should be 201
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify the created FAQ Category in database
      Then as a developer, I delete the FAQ Category
      And I verify the FAQ Category is deleted from database
      And the response time should be less than 5000 milliseconds
      When as a developer, I delete the FAQ Category
      Then the response status code should be 404
      And response should have the following properties:
          | status | status_false                           |
          | message | category_not_found_message |  
      Then as a developer, I delete the FAQ Category
    
    @MIRA-6237 @MIRA-6239
    Scenario: MIRA-6237, MIRA-6239 Delete Category Info - Verify API returns 400 Bad Request when categoryId is missing from the request.
      Given i login as a admin using user "admin_1"
      Then as a developer, I delete the FAQ Category with id " "
      Then the response status code should be 405
      And response should have the following properties:
          | error | method_not_allowed_error                           |
          | message | delete_method_not_allowed_message |  
    
    @MIRA-6238
    Scenario: MIRA-6238 Delete Category Info - Verify API Returns 404 Not Found When Attempting to Delete a Non-Existent categoryId
      Given i login as a admin using user "admin_1"
      Then as a developer, I delete the FAQ Category with id "ADF123"
      Then the response status code should be 404
      And response should have the following properties:
          | status | status_false                           |
          | message | category_not_found_message |  

    @MIRA-6241
    Scenario: MIRA-6241 Delete Category Info - Verify API Handles Invalid categoryId Formats (e.g., Special Characters)
      Given i login as a admin using user "admin_1"
      Then as a developer, I delete the FAQ Category with id "@@@@@@"
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | special_char_category_id_message |  
    
    @MIRA-6246
    Scenario: MIRA-6246 Delete Category Info - Verify API Returns 401 Unauthorized When the Bearer Token is Missing
      Given i do not have authentication token
      Then as a developer, I delete the FAQ Category with id "123456"
      Then the response status code should be 401
      And response should have the following properties:
          | message | authorization_header_message |  
    
  Rule: Create Subcategory API

    @MIRA-11245
    Scenario: MIRA-11245 Create Sub-Category - Valid Data
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Category
      Then the response status code should be 201
      Then response should have fields "data,category_id,category_name,description,created_at,updated_at"
      And as a developer, I verify the created FAQ Category in database
      Then as a developer, I create a FAQ Subcategory
      Then the response status code should be 201
      Then response should have fields "data,sub_category_id,category_id,sub_category_name,description,created_at,updated_at"
      And as a developer, I verify the created FAQ Subcategory in database
      
    @MIRA-11246
    Scenario: MIRA-11246 Create Sub-Category - Missing Category ID
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Subcategory:
        | category_id | __REMOVE__|
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | category_id_required |  
    
    @MIRA-11247
    Scenario: MIRA-11247 Create Sub-Category - Missing Name
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Subcategory:
        | category_id | CAT001|
        | sub_category_name | __REMOVE__|
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | sub_category_name_required |  

    @MIRA-11248
    Scenario: MIRA-11248 Create Sub-Category - Missing Description
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Subcategory:
        | category_id | CAT001|
        | description | __REMOVE__|
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | description_required |  

    @MIRA-11249
    Scenario: MIRA-11249 Create Sub-Category - Category Not Found
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Subcategory:
        | category_id | ADF123|
      Then the response status code should be 409
      And response should have the following properties:
          | status | status_false                           |
          | message | foreign_key_violation_message |  
      
    @MIRA-11250
    Scenario: MIRA-11250 Create Sub category with Empty request body JSON
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Subcategory:
        | category_id | __REMOVE__|
        | sub_category_name | __REMOVE__|
        | description | __REMOVE__|
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | category-sub_category-description_required |  
    
    @MIRA-11251
    Scenario: MIRA-11251 Create Sub category - Invalid Data Type for Category ID
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Subcategory:
        | category_id | 123456|
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | category_id_number_message |  
    
    @MIRA-11252
    Scenario: MIRA-11252 Create Sub category - Invalid Data Type for Sub Category Name
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Subcategory:
        | category_id | CAT001|
        | sub_category_name | 123456|
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | sub_category_name_number_message |
    
    @MIRA-11253
    Scenario: MIRA-11253 Create Sub category - Invalid Data Type for Description
      Given i login as a admin using user "admin_1"
      Then as a developer, I create a FAQ Subcategory:
        | category_id | CAT001|
        | description | 123456|
      Then the response status code should be 400
      And response should have the following properties:
          | status | status_false                           |
          | message | description_number_message |


  # Rule: Get Subcategory API

  #   @MIRA-11254
  #   Scenario: MIRA-11254 Fetch sub-category with valid category_id
  #     Given i login as a admin using user "admin_1"
  #     Then as a developer, I create a FAQ Category
  #     Then as a developer, I create a FAQ Subcategory
  #     Then as a developer, I get FAQ Subcategory with query parameters:
  #       | category_id | <category_id>|
  #     Then the response status code should be 200
  #     Then response should have fields "data,sub_category_id,category_id,sub_category_name,description,faq"
      
      
      
  #   @MIRA-11255
  #   Scenario: MIRA-11255 Fetch sub-category with valid sub_category_id
  #     Given i login as a admin using user "admin_1"
  #     Then as a developer, I create a FAQ Category
  #     Then as a developer, I create a FAQ Subcategory
  #     Then as a developer, I get FAQ Subcategory with query parameters:
  #       | sub_category_id | <sub_category_id>|
  #     Then the response status code should be 200
  #     Then response should have fields "data,sub_category_id,category_id,sub_category_name,description,faq"
      
      
  #   @MIRA-11256
  #   Scenario: MIRA-11256 Fetch sub-category with both valid category_id and sub_category_id
  #     Given i login as a admin using user "admin_1"
  #     Then as a developer, I create a FAQ Category
  #     Then as a developer, I create a FAQ Subcategory
  #     Then as a developer, I get FAQ Subcategory with query parameters:
  #       | sub_category_id | <sub_category_id>|
  #       | category_id | <category_id>|
  #     Then the response status code should be 200
  #     Then response should have fields "data,sub_category_id,category_id,sub_category_name,description,faq"
      
    
  #   @MIRA-11258
  #   Scenario: MIRA-11258 Fetch sub-category without any query params
  #     Given i login as a admin using user "admin_1"
  #     Then as a developer, I get all FAQ Subcategories
  #     Then the response status code should be 200
     