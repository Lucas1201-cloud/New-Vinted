#!/usr/bin/env python3
import requests
import json
import os
import uuid
import time

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"')
            break

# Ensure the URL doesn't have quotes
BACKEND_URL = BACKEND_URL.strip("'\"")
API_URL = f"{BACKEND_URL}/api"

print(f"Testing DELETE API at: {API_URL}")

# Test data for creating an item
def generate_test_item():
    """Generate a realistic test item for Vinted"""
    brands = ["Zara", "H&M", "Nike", "Adidas", "Stone Island", "Armani", "Gucci", "Prada", "Levi's", "Tommy Hilfiger"]
    categories = ["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Bags", "Jewelry"]
    conditions = ["New with tags", "Like new", "Good", "Fair", "Poor"]
    sizes = ["XS", "S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "44"]
    colors = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Brown", "Grey"]
    
    return {
        "id": str(uuid.uuid4()),  # Generate a unique ID for the item
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

def test_delete_item_functionality():
    """Test the DELETE /api/items/{item_id} endpoint"""
    print("\n=== Testing DELETE Item Functionality ===")
    
    # Step 1: Create a test item using POST /api/items
    print("\nStep 1: Creating a test item...")
    test_item = generate_test_item()
    response = requests.post(f"{API_URL}/items", json=test_item)
    
    if response.status_code != 200:
        print(f"ERROR: Failed to create test item. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    created_item = response.json()
    item_id = created_item.get("id")
    print(f"Successfully created test item with ID: {item_id}")
    print(f"Item details: {json.dumps(created_item, indent=2)}")
    
    # Step 2: Verify the item was created by getting it with GET /api/items/{item_id}
    print("\nStep 2: Verifying the item was created...")
    response = requests.get(f"{API_URL}/items/{item_id}")
    
    if response.status_code != 200:
        print(f"ERROR: Failed to get created item. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    retrieved_item = response.json()
    print(f"Successfully retrieved item: {retrieved_item['title']}")
    
    # Step 3: Test the DELETE /api/items/{item_id} endpoint
    print("\nStep 3: Testing DELETE /api/items/{item_id}...")
    response = requests.delete(f"{API_URL}/items/{item_id}")
    
    if response.status_code != 200:
        print(f"ERROR: Failed to delete item. Status code: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    delete_response = response.json()
    print(f"Delete response: {json.dumps(delete_response, indent=2)}")
    
    # Step 4: Verify the item was deleted by confirming GET /api/items/{item_id} returns 404
    print("\nStep 4: Verifying the item was deleted...")
    response = requests.get(f"{API_URL}/items/{item_id}")
    
    if response.status_code != 404:
        print(f"ERROR: Expected 404 for deleted item, got {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    print("Successfully verified item was deleted (received 404 as expected)")
    
    # Step 5: Test error handling by trying to delete a non-existent item
    print("\nStep 5: Testing error handling with non-existent item...")
    non_existent_id = str(uuid.uuid4())
    response = requests.delete(f"{API_URL}/items/{non_existent_id}")
    
    if response.status_code != 404:
        print(f"ERROR: Expected 404 for non-existent item, got {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    print("Successfully verified error handling (received 404 as expected)")
    
    print("\nSUCCESS: DELETE Item functionality is working correctly")
    return True

if __name__ == "__main__":
    test_delete_item_functionality()