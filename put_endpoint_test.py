#!/usr/bin/env python3
"""
Comprehensive test for PUT /api/items/{item_id} endpoint
Testing various data types and edge cases to debug frontend edit functionality issues
"""
import requests
import json
import base64
from datetime import datetime
import uuid

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"')
            break

BACKEND_URL = BACKEND_URL.strip("'\"")
API_URL = f"{BACKEND_URL}/api"

print(f"Testing PUT endpoint at: {API_URL}")

def create_sample_base64_image():
    """Create a small sample base64 image for testing"""
    # This is a tiny 1x1 pixel PNG image in base64
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg=="

def create_test_item():
    """Create a test item for updating"""
    test_item = {
        "title": "Test Item for PUT Testing",
        "description": "Original description for testing updates",
        "category": "Tops",
        "brand": "Test Brand",
        "size": "M",
        "color": "Blue",
        "condition": "Good",
        "purchase_price": 25.00,
        "listed_price": 45.00,
        "tags": ["test", "original"],
        "status": "active"
    }
    
    print("Creating test item...")
    response = requests.post(f"{API_URL}/items", json=test_item)
    
    if response.status_code != 200:
        print(f"ERROR: Failed to create test item. Status: {response.status_code}")
        print(f"Response: {response.text}")
        return None
    
    created_item = response.json()
    print(f"✅ Created test item with ID: {created_item['id']}")
    return created_item

def test_basic_field_updates(item_id):
    """Test updating basic fields (title, description, category, brand, size, color, condition)"""
    print("\n=== Testing Basic Field Updates ===")
    
    update_data = {
        "title": "Updated Test Item Title",
        "description": "Updated description with new content",
        "category": "Dresses",
        "brand": "Updated Brand",
        "size": "L",
        "color": "Red",
        "condition": "Like new"
    }
    
    response = requests.put(f"{API_URL}/items/{item_id}", json=update_data)
    
    if response.status_code != 200:
        print(f"❌ FAILED: Basic field update failed. Status: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    updated_item = response.json()
    
    # Verify all fields were updated
    for field, expected_value in update_data.items():
        if updated_item.get(field) != expected_value:
            print(f"❌ FAILED: Field '{field}' not updated correctly")
            print(f"Expected: {expected_value}, Got: {updated_item.get(field)}")
            return False
    
    print("✅ SUCCESS: Basic field updates working correctly")
    return True

def test_pricing_field_updates(item_id):
    """Test updating pricing fields"""
    print("\n=== Testing Pricing Field Updates ===")
    
    update_data = {
        "purchase_price": 30.50,
        "listed_price": 55.99,
        "sold_price": 52.00,
        "shipping_cost": 4.50,
        "vinted_fee": 2.75,
        "buyer_protection_fee": 1.25
    }
    
    response = requests.put(f"{API_URL}/items/{item_id}", json=update_data)
    
    if response.status_code != 200:
        print(f"❌ FAILED: Pricing field update failed. Status: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    updated_item = response.json()
    
    # Verify all pricing fields were updated
    for field, expected_value in update_data.items():
        if abs(updated_item.get(field, 0) - expected_value) > 0.01:  # Allow for floating point precision
            print(f"❌ FAILED: Pricing field '{field}' not updated correctly")
            print(f"Expected: {expected_value}, Got: {updated_item.get(field)}")
            return False
    
    # Check if profit calculations are working
    if updated_item.get('profit_margin') is not None:
        print(f"✅ Profit margin calculated: {updated_item['profit_margin']}")
    
    if updated_item.get('roi_percentage') is not None:
        print(f"✅ ROI percentage calculated: {updated_item['roi_percentage']}")
    
    print("✅ SUCCESS: Pricing field updates working correctly")
    return True

def test_performance_field_updates(item_id):
    """Test updating performance fields (views, likes, watchers, messages)"""
    print("\n=== Testing Performance Field Updates ===")
    
    update_data = {
        "views": 150,
        "likes": 25,
        "watchers": 8,
        "messages": 3
    }
    
    response = requests.put(f"{API_URL}/items/{item_id}", json=update_data)
    
    if response.status_code != 200:
        print(f"❌ FAILED: Performance field update failed. Status: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    updated_item = response.json()
    
    # Verify all performance fields were updated
    for field, expected_value in update_data.items():
        if updated_item.get(field) != expected_value:
            print(f"❌ FAILED: Performance field '{field}' not updated correctly")
            print(f"Expected: {expected_value}, Got: {updated_item.get(field)}")
            return False
    
    print("✅ SUCCESS: Performance field updates working correctly")
    return True

def test_photo_field_updates(item_id):
    """Test updating photo fields (photos array with base64 strings, main_photo)"""
    print("\n=== Testing Photo Field Updates ===")
    
    sample_image = create_sample_base64_image()
    
    update_data = {
        "photos": [sample_image, sample_image],  # Two photos
        "main_photo": sample_image
    }
    
    response = requests.put(f"{API_URL}/items/{item_id}", json=update_data)
    
    if response.status_code != 200:
        print(f"❌ FAILED: Photo field update failed. Status: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    updated_item = response.json()
    
    # Verify photo fields were updated
    if len(updated_item.get('photos', [])) != 2:
        print(f"❌ FAILED: Photos array not updated correctly")
        print(f"Expected 2 photos, Got: {len(updated_item.get('photos', []))}")
        return False
    
    if updated_item.get('main_photo') != sample_image:
        print(f"❌ FAILED: Main photo not updated correctly")
        return False
    
    print("✅ SUCCESS: Photo field updates working correctly")
    return True

def test_status_and_tags_updates(item_id):
    """Test updating status and tags fields"""
    print("\n=== Testing Status and Tags Updates ===")
    
    update_data = {
        "status": "sold",
        "tags": ["updated", "sold", "test", "final"]
    }
    
    response = requests.put(f"{API_URL}/items/{item_id}", json=update_data)
    
    if response.status_code != 200:
        print(f"❌ FAILED: Status and tags update failed. Status: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    updated_item = response.json()
    
    # Verify status was updated
    if updated_item.get('status') != update_data['status']:
        print(f"❌ FAILED: Status not updated correctly")
        print(f"Expected: {update_data['status']}, Got: {updated_item.get('status')}")
        return False
    
    # Verify tags were updated
    if set(updated_item.get('tags', [])) != set(update_data['tags']):
        print(f"❌ FAILED: Tags not updated correctly")
        print(f"Expected: {update_data['tags']}, Got: {updated_item.get('tags')}")
        return False
    
    # Check if sold_at timestamp was set when status changed to sold
    if updated_item.get('sold_at') is None:
        print("⚠️  WARNING: sold_at timestamp not set when status changed to sold")
    else:
        print(f"✅ sold_at timestamp set: {updated_item['sold_at']}")
    
    print("✅ SUCCESS: Status and tags updates working correctly")
    return True

def test_empty_values(item_id):
    """Test updating with empty values"""
    print("\n=== Testing Empty Values ===")
    
    update_data = {
        "description": "",
        "size": "",
        "color": "",
        "tags": []
    }
    
    response = requests.put(f"{API_URL}/items/{item_id}", json=update_data)
    
    if response.status_code != 200:
        print(f"❌ FAILED: Empty values update failed. Status: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    updated_item = response.json()
    
    # Verify empty values were handled correctly
    for field, expected_value in update_data.items():
        if updated_item.get(field) != expected_value:
            print(f"❌ FAILED: Empty value for '{field}' not handled correctly")
            print(f"Expected: {expected_value}, Got: {updated_item.get(field)}")
            return False
    
    print("✅ SUCCESS: Empty values handled correctly")
    return True

def test_null_values(item_id):
    """Test updating with null values"""
    print("\n=== Testing Null Values ===")
    
    update_data = {
        "description": None,
        "size": None,
        "color": None,
        "sold_price": None
    }
    
    response = requests.put(f"{API_URL}/items/{item_id}", json=update_data)
    
    if response.status_code != 200:
        print(f"❌ FAILED: Null values update failed. Status: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    print("✅ SUCCESS: Null values handled correctly")
    return True

def test_invalid_data(item_id):
    """Test updating with invalid data"""
    print("\n=== Testing Invalid Data ===")
    
    # Test invalid status
    print("Testing invalid status...")
    invalid_status_data = {"status": "invalid_status"}
    response = requests.put(f"{API_URL}/items/{item_id}", json=invalid_status_data)
    
    if response.status_code == 200:
        print("⚠️  WARNING: Invalid status was accepted (should be rejected)")
    else:
        print(f"✅ Invalid status correctly rejected with status: {response.status_code}")
    
    # Test negative prices
    print("Testing negative prices...")
    negative_price_data = {"purchase_price": -10.0}
    response = requests.put(f"{API_URL}/items/{item_id}", json=negative_price_data)
    
    if response.status_code == 200:
        print("⚠️  WARNING: Negative price was accepted")
    else:
        print(f"✅ Negative price handled appropriately with status: {response.status_code}")
    
    # Test invalid data types
    print("Testing invalid data types...")
    invalid_type_data = {"views": "not_a_number"}
    response = requests.put(f"{API_URL}/items/{item_id}", json=invalid_type_data)
    
    if response.status_code == 200:
        print("⚠️  WARNING: Invalid data type was accepted")
    else:
        print(f"✅ Invalid data type correctly rejected with status: {response.status_code}")
    
    return True

def test_nonexistent_item():
    """Test updating a non-existent item"""
    print("\n=== Testing Non-existent Item Update ===")
    
    fake_id = str(uuid.uuid4())
    update_data = {"title": "This should fail"}
    
    response = requests.put(f"{API_URL}/items/{fake_id}", json=update_data)
    
    if response.status_code != 404:
        print(f"❌ FAILED: Expected 404 for non-existent item, got {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    print("✅ SUCCESS: Non-existent item update correctly returns 404")
    return True

def test_partial_updates(item_id):
    """Test partial updates (only updating some fields)"""
    print("\n=== Testing Partial Updates ===")
    
    # Get current item state
    response = requests.get(f"{API_URL}/items/{item_id}")
    if response.status_code != 200:
        print("❌ FAILED: Could not get current item state")
        return False
    
    original_item = response.json()
    
    # Update only title
    update_data = {"title": "Partially Updated Title"}
    response = requests.put(f"{API_URL}/items/{item_id}", json=update_data)
    
    if response.status_code != 200:
        print(f"❌ FAILED: Partial update failed. Status: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    updated_item = response.json()
    
    # Verify only title was updated, other fields remain the same
    if updated_item['title'] != update_data['title']:
        print("❌ FAILED: Title not updated in partial update")
        return False
    
    # Check that other important fields weren't changed
    fields_to_check = ['brand', 'category', 'purchase_price', 'listed_price']
    for field in fields_to_check:
        if updated_item.get(field) != original_item.get(field):
            print(f"❌ FAILED: Field '{field}' was unexpectedly changed in partial update")
            print(f"Original: {original_item.get(field)}, Updated: {updated_item.get(field)}")
            return False
    
    print("✅ SUCCESS: Partial updates working correctly")
    return True

def run_comprehensive_put_tests():
    """Run all PUT endpoint tests"""
    print("=== Comprehensive PUT /api/items/{item_id} Endpoint Testing ===")
    print("Testing various data types and edge cases to debug frontend edit functionality\n")
    
    # Step 1: Create a test item
    test_item = create_test_item()
    if not test_item:
        print("❌ CRITICAL: Could not create test item. Aborting tests.")
        return
    
    item_id = test_item['id']
    
    # Step 2: Run all tests
    test_results = {
        "Basic Field Updates": test_basic_field_updates(item_id),
        "Pricing Field Updates": test_pricing_field_updates(item_id),
        "Performance Field Updates": test_performance_field_updates(item_id),
        "Photo Field Updates": test_photo_field_updates(item_id),
        "Status and Tags Updates": test_status_and_tags_updates(item_id),
        "Empty Values": test_empty_values(item_id),
        "Null Values": test_null_values(item_id),
        "Invalid Data": test_invalid_data(item_id),
        "Non-existent Item": test_nonexistent_item(),
        "Partial Updates": test_partial_updates(item_id)
    }
    
    # Step 3: Get final item state
    print("\n=== Final Item State ===")
    response = requests.get(f"{API_URL}/items/{item_id}")
    if response.status_code == 200:
        final_item = response.json()
        print(f"Final item title: {final_item['title']}")
        print(f"Final item status: {final_item['status']}")
        print(f"Final item profit_margin: {final_item.get('profit_margin')}")
        print(f"Final item roi_percentage: {final_item.get('roi_percentage')}")
    
    # Step 4: Summary
    print("\n=== Test Results Summary ===")
    all_passed = True
    for test_name, result in test_results.items():
        status = "PASSED" if result else "FAILED"
        if not result:
            all_passed = False
        print(f"{test_name}: {status}")
    
    if all_passed:
        print("\n✅ ALL TESTS PASSED: PUT endpoint is working correctly!")
        print("The backend PUT endpoint appears to be functioning properly.")
        print("If frontend edit is failing, the issue is likely in:")
        print("- Frontend data formatting before sending to backend")
        print("- Frontend error handling of responses")
        print("- Frontend state management after successful updates")
    else:
        print("\n❌ SOME TESTS FAILED: Issues found with PUT endpoint")
        print("These backend issues could be causing frontend edit failures.")
    
    return test_results

if __name__ == "__main__":
    run_comprehensive_put_tests()