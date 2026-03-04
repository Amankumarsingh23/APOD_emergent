#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for APOD Explorer
Tests all API endpoints with various scenarios
"""

import requests
import json
from datetime import datetime, timedelta
import time
import sys

# Configuration
BASE_URL = "https://nasa-astro.preview.emergentagent.com/api"
TIMEOUT = 30

def log_test(test_name, status, details=""):
    """Log test results with status"""
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"{status_symbol} {test_name}: {status}")
    if details:
        print(f"   Details: {details}")

def test_apod_today():
    """Test GET /api/apod/today endpoint"""
    print("\n=== Testing Today's APOD Endpoint ===")
    
    try:
        response = requests.get(f"{BASE_URL}/apod/today", timeout=TIMEOUT)
        
        if response.status_code != 200:
            log_test("Today's APOD - Status Code", "FAIL", f"Expected 200, got {response.status_code}")
            return False
            
        data = response.json()
        
        # Check required fields
        required_fields = ["date", "title", "explanation", "url", "media_type"]
        missing_fields = []
        
        for field in required_fields:
            if field not in data:
                missing_fields.append(field)
        
        if missing_fields:
            log_test("Today's APOD - Required Fields", "FAIL", f"Missing fields: {missing_fields}")
            return False
            
        # Validate data types and content
        if not isinstance(data["date"], str) or len(data["date"]) != 10:
            log_test("Today's APOD - Date Format", "FAIL", f"Invalid date format: {data['date']}")
            return False
            
        if not isinstance(data["title"], str) or len(data["title"]) < 1:
            log_test("Today's APOD - Title", "FAIL", "Title is empty or invalid")
            return False
            
        if not isinstance(data["explanation"], str) or len(data["explanation"]) < 10:
            log_test("Today's APOD - Explanation", "FAIL", "Explanation too short or invalid")
            return False
            
        if not isinstance(data["url"], str) or not data["url"].startswith("http"):
            log_test("Today's APOD - URL", "FAIL", f"Invalid URL: {data['url']}")
            return False
            
        if data["media_type"] not in ["image", "video"]:
            log_test("Today's APOD - Media Type", "FAIL", f"Invalid media_type: {data['media_type']}")
            return False
            
        log_test("Today's APOD - All Validations", "PASS", f"Date: {data['date']}, Title: {data['title'][:50]}...")
        return True
        
    except requests.exceptions.Timeout:
        log_test("Today's APOD - Connection", "FAIL", "Request timed out")
        return False
    except requests.exceptions.ConnectionError:
        log_test("Today's APOD - Connection", "FAIL", "Connection error")
        return False
    except Exception as e:
        log_test("Today's APOD - Exception", "FAIL", str(e))
        return False

def test_apod_by_date():
    """Test GET /api/apod/date/{date} endpoint"""
    print("\n=== Testing APOD by Date Endpoint ===")
    
    # Test valid historical date
    test_date = "2024-07-04"
    try:
        response = requests.get(f"{BASE_URL}/apod/date/{test_date}", timeout=TIMEOUT)
        
        if response.status_code != 200:
            log_test("APOD by Date - Valid Date", "FAIL", f"Expected 200, got {response.status_code}")
            return False
            
        data = response.json()
        
        if data["date"] != test_date:
            log_test("APOD by Date - Date Match", "FAIL", f"Expected {test_date}, got {data['date']}")
            return False
            
        log_test("APOD by Date - Valid Date", "PASS", f"Successfully retrieved APOD for {test_date}")
        
    except Exception as e:
        log_test("APOD by Date - Valid Date", "FAIL", str(e))
        return False
    
    # Test invalid date format
    try:
        response = requests.get(f"{BASE_URL}/apod/date/invalid-date", timeout=TIMEOUT)
        
        if response.status_code == 400:
            log_test("APOD by Date - Invalid Format", "PASS", "Correctly rejected invalid date format")
        else:
            log_test("APOD by Date - Invalid Format", "FAIL", f"Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        log_test("APOD by Date - Invalid Format", "FAIL", str(e))
        return False
    
    # Test future date (should fail)
    future_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    try:
        response = requests.get(f"{BASE_URL}/apod/date/{future_date}", timeout=TIMEOUT)
        
        if response.status_code == 400:
            log_test("APOD by Date - Future Date", "PASS", "Correctly rejected future date")
        else:
            log_test("APOD by Date - Future Date", "WARN", f"Future date handling: {response.status_code}")
            
    except Exception as e:
        log_test("APOD by Date - Future Date", "FAIL", str(e))
        return False
        
    return True

def test_favorites_crud():
    """Test all favorites CRUD operations"""
    print("\n=== Testing Favorites CRUD Operations ===")
    
    test_favorite = {
        "date": "2024-01-01",
        "title": "Test APOD for Favorites",
        "explanation": "This is a test APOD entry for testing the favorites functionality.",
        "url": "https://example.com/test-image.jpg",
        "media_type": "image"
    }
    
    # Clean up any existing test data first
    try:
        requests.delete(f"{BASE_URL}/favorites/{test_favorite['date']}", timeout=TIMEOUT)
    except:
        pass
    
    # Test POST /favorites - Add favorite
    try:
        response = requests.post(
            f"{BASE_URL}/favorites",
            json=test_favorite,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        
        if response.status_code != 200:
            log_test("Favorites - Add New", "FAIL", f"Expected 200, got {response.status_code}: {response.text}")
            return False
            
        data = response.json()
        
        # Verify response contains expected data
        if data["date"] != test_favorite["date"] or data["title"] != test_favorite["title"]:
            log_test("Favorites - Add New Response", "FAIL", "Response data doesn't match input")
            return False
            
        log_test("Favorites - Add New", "PASS", f"Successfully added favorite for {test_favorite['date']}")
        
    except Exception as e:
        log_test("Favorites - Add New", "FAIL", str(e))
        return False
    
    # Test duplicate addition (should fail)
    try:
        response = requests.post(
            f"{BASE_URL}/favorites",
            json=test_favorite,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        
        if response.status_code == 400:
            log_test("Favorites - Duplicate Prevention", "PASS", "Correctly prevented duplicate")
        else:
            log_test("Favorites - Duplicate Prevention", "FAIL", f"Expected 400, got {response.status_code}")
            
    except Exception as e:
        log_test("Favorites - Duplicate Prevention", "FAIL", str(e))
    
    # Test GET /favorites - List all
    try:
        response = requests.get(f"{BASE_URL}/favorites", timeout=TIMEOUT)
        
        if response.status_code != 200:
            log_test("Favorites - List All", "FAIL", f"Expected 200, got {response.status_code}")
            return False
            
        data = response.json()
        
        if not isinstance(data, list):
            log_test("Favorites - List All Format", "FAIL", "Response is not a list")
            return False
            
        # Check if our test favorite is in the list
        found = any(fav["date"] == test_favorite["date"] for fav in data)
        if not found:
            log_test("Favorites - List All Content", "FAIL", "Test favorite not found in list")
            return False
            
        log_test("Favorites - List All", "PASS", f"Retrieved {len(data)} favorites")
        
    except Exception as e:
        log_test("Favorites - List All", "FAIL", str(e))
        return False
    
    # Test GET /favorites/check/{date}
    try:
        response = requests.get(f"{BASE_URL}/favorites/check/{test_favorite['date']}", timeout=TIMEOUT)
        
        if response.status_code != 200:
            log_test("Favorites - Check Existing", "FAIL", f"Expected 200, got {response.status_code}")
            return False
            
        data = response.json()
        
        if not data.get("is_favorite", False):
            log_test("Favorites - Check Existing", "FAIL", "Expected is_favorite to be true")
            return False
            
        log_test("Favorites - Check Existing", "PASS", "Correctly identified existing favorite")
        
    except Exception as e:
        log_test("Favorites - Check Existing", "FAIL", str(e))
        return False
    
    # Test check non-existing favorite
    try:
        response = requests.get(f"{BASE_URL}/favorites/check/1999-01-01", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if not data.get("is_favorite", True):
                log_test("Favorites - Check Non-existing", "PASS", "Correctly identified non-existing favorite")
            else:
                log_test("Favorites - Check Non-existing", "FAIL", "Expected is_favorite to be false")
        else:
            log_test("Favorites - Check Non-existing", "FAIL", f"Expected 200, got {response.status_code}")
            
    except Exception as e:
        log_test("Favorites - Check Non-existing", "FAIL", str(e))
    
    # Test DELETE /favorites/{date}
    try:
        response = requests.delete(f"{BASE_URL}/favorites/{test_favorite['date']}", timeout=TIMEOUT)
        
        if response.status_code != 200:
            log_test("Favorites - Delete", "FAIL", f"Expected 200, got {response.status_code}")
            return False
            
        log_test("Favorites - Delete", "PASS", "Successfully deleted favorite")
        
    except Exception as e:
        log_test("Favorites - Delete", "FAIL", str(e))
        return False
    
    # Verify deletion worked
    try:
        response = requests.get(f"{BASE_URL}/favorites/check/{test_favorite['date']}", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if not data.get("is_favorite", True):
                log_test("Favorites - Verify Deletion", "PASS", "Confirmed favorite was deleted")
            else:
                log_test("Favorites - Verify Deletion", "FAIL", "Favorite still exists after deletion")
        else:
            log_test("Favorites - Verify Deletion", "WARN", f"Unexpected status: {response.status_code}")
            
    except Exception as e:
        log_test("Favorites - Verify Deletion", "FAIL", str(e))
    
    # Test deleting non-existing favorite
    try:
        response = requests.delete(f"{BASE_URL}/favorites/1999-01-01", timeout=TIMEOUT)
        
        if response.status_code == 404:
            log_test("Favorites - Delete Non-existing", "PASS", "Correctly handled non-existing favorite deletion")
        else:
            log_test("Favorites - Delete Non-existing", "WARN", f"Expected 404, got {response.status_code}")
            
    except Exception as e:
        log_test("Favorites - Delete Non-existing", "FAIL", str(e))
        
    return True

def test_preferences():
    """Test user preferences endpoints"""
    print("\n=== Testing User Preferences ===")
    
    # Test GET /preferences
    try:
        response = requests.get(f"{BASE_URL}/preferences", timeout=TIMEOUT)
        
        if response.status_code != 200:
            log_test("Preferences - Get", "FAIL", f"Expected 200, got {response.status_code}")
            return False
            
        data = response.json()
        
        # Check required fields
        required_fields = ["dark_mode", "deep_black_mode", "notifications_enabled", "notification_time"]
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            log_test("Preferences - Get Required Fields", "FAIL", f"Missing fields: {missing_fields}")
            return False
            
        log_test("Preferences - Get", "PASS", f"Retrieved preferences: dark_mode={data['dark_mode']}")
        
        # Store original preferences for restoration later
        original_prefs = data
        
    except Exception as e:
        log_test("Preferences - Get", "FAIL", str(e))
        return False
    
    # Test PUT /preferences
    test_updates = {
        "dark_mode": not original_prefs["dark_mode"],
        "deep_black_mode": not original_prefs["deep_black_mode"],
        "notifications_enabled": not original_prefs["notifications_enabled"],
        "notification_time": "18:30"
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/preferences",
            json=test_updates,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        
        if response.status_code != 200:
            log_test("Preferences - Update", "FAIL", f"Expected 200, got {response.status_code}: {response.text}")
            return False
            
        data = response.json()
        
        # Verify updates were applied
        for key, expected_value in test_updates.items():
            if data.get(key) != expected_value:
                log_test("Preferences - Update Verification", "FAIL", f"{key} not updated correctly")
                return False
                
        log_test("Preferences - Update", "PASS", "Successfully updated all preferences")
        
    except Exception as e:
        log_test("Preferences - Update", "FAIL", str(e))
        return False
    
    # Test partial update
    partial_update = {"dark_mode": original_prefs["dark_mode"]}
    
    try:
        response = requests.put(
            f"{BASE_URL}/preferences",
            json=partial_update,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            if data["dark_mode"] == original_prefs["dark_mode"]:
                log_test("Preferences - Partial Update", "PASS", "Partial update works correctly")
            else:
                log_test("Preferences - Partial Update", "FAIL", "Partial update failed")
        else:
            log_test("Preferences - Partial Update", "FAIL", f"Expected 200, got {response.status_code}")
            
    except Exception as e:
        log_test("Preferences - Partial Update", "FAIL", str(e))
    
    return True

def test_api_root():
    """Test root API endpoint"""
    print("\n=== Testing API Root Endpoint ===")
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
        
        if response.status_code != 200:
            log_test("API Root", "FAIL", f"Expected 200, got {response.status_code}")
            return False
            
        data = response.json()
        
        if "message" in data:
            log_test("API Root", "PASS", f"API is running: {data['message']}")
        else:
            log_test("API Root", "WARN", "API responded but missing expected message")
            
        return True
        
    except Exception as e:
        log_test("API Root", "FAIL", str(e))
        return False

def main():
    """Run all backend API tests"""
    print("🚀 Starting APOD Explorer Backend API Tests")
    print(f"Base URL: {BASE_URL}")
    print("=" * 60)
    
    # Track test results
    test_results = []
    
    # Run all tests
    test_results.append(("API Root", test_api_root()))
    test_results.append(("APOD Today", test_apod_today()))
    test_results.append(("APOD by Date", test_apod_by_date()))
    test_results.append(("Favorites CRUD", test_favorites_crud()))
    test_results.append(("User Preferences", test_preferences()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {len(test_results)} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 All backend API tests passed successfully!")
        return True
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please check the details above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)