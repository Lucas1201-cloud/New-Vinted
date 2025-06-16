#!/usr/bin/env python3
import requests
import json
import os
import csv
import io
from datetime import datetime
import time
import uuid

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"')
            break

# Ensure the URL doesn't have quotes
BACKEND_URL = BACKEND_URL.strip("'\"")
API_URL = f"{BACKEND_URL}/api"

print(f"Testing API at: {API_URL}")

# Test data for creating items
def generate_test_item():
    """Generate a realistic test item for Vinted"""
    brands = ["Zara", "H&M", "Nike", "Adidas", "Stone Island", "Armani", "Gucci", "Prada", "Levi's", "Tommy Hilfiger"]
    categories = ["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Bags", "Jewelry"]
    conditions = ["New with tags", "Like new", "Good", "Fair", "Poor"]
    sizes = ["XS", "S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "44"]
    colors = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Brown", "Grey"]
    
    return {
        "title": f"{brands[int(time.time()) % len(brands)]} {categories[int(time.time()*2) % len(categories)]}",
        "description": f"Great condition {brands[int(time.time()) % len(brands)]} item. Perfect for any occasion!",
        "category": categories[int(time.time()*3) % len(categories)],
        "brand": brands[int(time.time()*4) % len(brands)],
        "size": sizes[int(time.time()*5) % len(sizes)],
        "color": colors[int(time.time()*6) % len(colors)],
        "condition": conditions[int(time.time()*7) % len(conditions)],
        "purchase_price": round(float(int(time.time()*8) % 50) + 5.0, 2),
        "listed_price": round(float(int(time.time()*9) % 100) + 15.0, 2),
        "shipping_cost": round(float(int(time.time()*10) % 10) + 2.0, 2),
        "vinted_fee": round(float(int(time.time()*11) % 5) + 1.0, 2),
        "buyer_protection_fee": round(float(int(time.time()*12) % 3) + 0.5, 2),
        "tags": ["vintage", "trendy", "summer", "winter", "casual"][:int(time.time()*13) % 5 + 1],
        "status": "active"
    }

def test_dashboard_stats_api():
    """Test the Dashboard Stats API"""
    print("\n=== Testing Dashboard Stats API ===")
    
    response = requests.get(f"{API_URL}/dashboard/stats")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Dashboard Stats API Response: {json.dumps(data, indent=2)}")
        
        # Verify the response structure
        required_fields = [
            "total_items", "active_listings", "sold_items", "total_revenue",
            "total_profit", "average_roi", "items_needing_renewal",
            "low_performing_items", "monthly_profit", "monthly_sales_count"
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            print(f"ERROR: Missing fields in response: {missing_fields}")
            return False
        else:
            print("SUCCESS: Dashboard Stats API working correctly")
            return True
    else:
        print(f"ERROR: Dashboard Stats API failed with status code {response.status_code}")
        print(f"Response: {response.text}")
        return False

def test_items_management_apis():
    """Test the Items Management APIs"""
    print("\n=== Testing Items Management APIs ===")
    
    # Test POST /api/items - Create a new item
    print("\nTesting POST /api/items")
    test_item = generate_test_item()
    response = requests.post(f"{API_URL}/items", json=test_item)
    
    if response.status_code != 200:
        print(f"ERROR: Failed to create item. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    created_item = response.json()
    item_id = created_item.get("id")
    print(f"Created item with ID: {item_id}")
    
    # Test GET /api/items - Get all items
    print("\nTesting GET /api/items")
    response = requests.get(f"{API_URL}/items")
    
    if response.status_code != 200:
        print(f"ERROR: Failed to get items. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    items = response.json()
    print(f"Retrieved {len(items)} items")
    
    # Test GET /api/items with filtering
    print("\nTesting GET /api/items with filtering")
    response = requests.get(f"{API_URL}/items?status=active&brand={test_item['brand']}")
    
    if response.status_code != 200:
        print(f"ERROR: Failed to get filtered items. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    filtered_items = response.json()
    print(f"Retrieved {len(filtered_items)} filtered items")
    
    # Test GET /api/items/{item_id} - Get specific item
    print(f"\nTesting GET /api/items/{item_id}")
    response = requests.get(f"{API_URL}/items/{item_id}")
    
    if response.status_code != 200:
        print(f"ERROR: Failed to get specific item. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    retrieved_item = response.json()
    print(f"Retrieved item: {retrieved_item['title']}")
    
    # Test PUT /api/items/{item_id} - Update an item
    print(f"\nTesting PUT /api/items/{item_id}")
    update_data = {
        "title": f"Updated {test_item['title']}",
        "views": 15,
        "likes": 5,
        "sold_price": round(test_item['listed_price'] * 0.9, 2),
        "status": "sold"
    }
    
    response = requests.put(f"{API_URL}/items/{item_id}", json=update_data)
    
    if response.status_code != 200:
        print(f"ERROR: Failed to update item. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    updated_item = response.json()
    print(f"Updated item: {updated_item['title']}")
    
    # Verify the update was successful
    if updated_item['title'] != update_data['title'] or updated_item['status'] != update_data['status']:
        print(f"ERROR: Item update verification failed")
        print(f"Expected: {update_data}")
        print(f"Got: {updated_item}")
        return False
    
    # Test error handling - Get non-existent item
    print("\nTesting error handling - Get non-existent item")
    fake_id = str(uuid.uuid4())
    response = requests.get(f"{API_URL}/items/{fake_id}")
    
    if response.status_code != 404:
        print(f"ERROR: Expected 404 for non-existent item, got {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    print("SUCCESS: Items Management APIs working correctly")
    return True

def test_analytics_apis():
    """Test the Analytics APIs"""
    print("\n=== Testing Analytics APIs ===")
    
    # Test GET /api/analytics/trends
    print("\nTesting GET /api/analytics/trends")
    response = requests.get(f"{API_URL}/analytics/trends")
    
    if response.status_code != 200:
        print(f"ERROR: Failed to get market trends. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    trends = response.json()
    print(f"Retrieved {len(trends)} market trends")
    
    # Test GET /api/analytics/monthly
    print("\nTesting GET /api/analytics/monthly")
    response = requests.get(f"{API_URL}/analytics/monthly")
    
    if response.status_code != 200:
        print(f"ERROR: Failed to get monthly analytics. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    monthly_analytics = response.json()
    print(f"Retrieved {len(monthly_analytics)} monthly analytics records")
    
    print("SUCCESS: Analytics APIs working correctly")
    return True

def test_notifications_apis():
    """Test the Notifications APIs"""
    print("\n=== Testing Notifications APIs ===")
    
    # Test GET /api/notifications
    print("\nTesting GET /api/notifications")
    response = requests.get(f"{API_URL}/notifications")
    
    if response.status_code != 200:
        print(f"ERROR: Failed to get notifications. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    notifications = response.json()
    print(f"Retrieved {len(notifications)} notifications")
    
    # Test GET /api/notifications with unread_only filter
    print("\nTesting GET /api/notifications with unread_only filter")
    response = requests.get(f"{API_URL}/notifications?unread_only=true")
    
    if response.status_code != 200:
        print(f"ERROR: Failed to get unread notifications. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    unread_notifications = response.json()
    print(f"Retrieved {len(unread_notifications)} unread notifications")
    
    print("SUCCESS: Notifications APIs working correctly")
    return True

def test_bulk_operations():
    """Test the Bulk Operations"""
    print("\n=== Testing Bulk Operations ===")
    
    # Test GET /api/items/export/csv
    print("\nTesting GET /api/items/export/csv")
    response = requests.get(f"{API_URL}/items/export/csv")
    
    if response.status_code != 200:
        print(f"ERROR: Failed to export items to CSV. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    # Check if the response is a CSV file
    content_type = response.headers.get('Content-Type', '')
    if 'text/csv' not in content_type:
        print(f"ERROR: Expected CSV content type, got {content_type}")
        return False
    
    # Parse the CSV content
    csv_content = response.content.decode('utf-8')
    csv_reader = csv.reader(io.StringIO(csv_content))
    rows = list(csv_reader)
    
    if len(rows) < 1:
        print("ERROR: CSV file is empty")
        return False
    
    header = rows[0]
    expected_headers = [
        'ID', 'Title', 'Brand', 'Category', 'Size', 'Condition', 
        'Purchase Price', 'Listed Price', 'Sold Price', 'Status',
        'Views', 'Likes', 'Created At', 'Listed At', 'Sold At'
    ]
    
    missing_headers = [h for h in expected_headers if h not in header]
    if missing_headers:
        print(f"ERROR: Missing headers in CSV: {missing_headers}")
        return False
    
    print(f"CSV export successful with {len(rows) - 1} data rows")
    print("SUCCESS: Bulk Operations working correctly")
    return True

def test_roi_target_apis():
    """Test the ROI Target APIs"""
    print("\n=== Testing ROI Target APIs ===")
    
    # Test GET /api/roi-targets/current
    print("\nTesting GET /api/roi-targets/current")
    response = requests.get(f"{API_URL}/roi-targets/current")
    
    if response.status_code != 200:
        print(f"ERROR: Failed to get current ROI target. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    roi_target = response.json()
    print(f"Current ROI target: {roi_target}")
    
    # Verify the response structure
    required_fields = ["id", "target_percentage", "current_percentage", "is_active", "created_at"]
    missing_fields = [field for field in required_fields if field not in roi_target]
    
    if missing_fields:
        print(f"ERROR: Missing fields in ROI target response: {missing_fields}")
        return False
    
    print("SUCCESS: ROI Target APIs working correctly")
    return True

def run_all_tests():
    """Run all API tests"""
    print("=== Starting Vinted Tracker API Tests ===")
    
    test_results = {
        "Dashboard Stats API": test_dashboard_stats_api(),
        "Items Management APIs": test_items_management_apis(),
        "Analytics APIs": test_analytics_apis(),
        "Notifications APIs": test_notifications_apis(),
        "Bulk Operations": test_bulk_operations(),
        "ROI Target APIs": test_roi_target_apis()
    }
    
    print("\n=== Test Results Summary ===")
    all_passed = True
    for test_name, result in test_results.items():
        status = "PASSED" if result else "FAILED"
        if not result:
            all_passed = False
        print(f"{test_name}: {status}")
    
    if all_passed:
        print("\nAll tests passed successfully!")
    else:
        print("\nSome tests failed. See details above.")
    
    return test_results

if __name__ == "__main__":
    run_all_tests()