Feature: Device Mapping and Unmapping

Rule: Device Mapping To School Testcases     
    @map @map_Positive @MIRA-1379 
    Scenario: MIRA-1379 - Map Device to School - Verify successful mapping of a device with valid inputs
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database

    @map @map_Positive @MIRA-1380
    Scenario: MIRA-1380 - Map Device to School - Verify device already mapped
      Given register device
      Then the response status code should be 200
      Given map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database "true"
      And map the device to school
      Then the response status code should be 200
      And response should have the following properties:
        | message | already_mapped_msg |
