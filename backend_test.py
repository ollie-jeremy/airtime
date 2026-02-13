#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, date

class SchedulerAPITester:
    def __init__(self, base_url="https://duty-scheduler-26.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{self.base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_duties = []  # Track duties created during testing
        self.created_schedule_duties = []  # Track schedule duties created

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            print(f"   Response: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.text else {}
                    if response_data and isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                    elif response_data and isinstance(response_data, list):
                        print(f"   Response items: {len(response_data)} items")
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json() if response.text else {}
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error text: {response.text[:200]}")
                return success, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET", 
            "",
            200
        )
        return success

    def test_get_duties(self):
        """Test getting all duties (should return 6 pre-seeded)"""
        success, response = self.run_test(
            "Get All Duties", 
            "GET",
            "duties",
            200
        )
        
        if success:
            if isinstance(response, list):
                print(f"   Found {len(response)} duties")
                if len(response) >= 6:
                    expected_codes = ["G1", "G2", "G3", "P1", "D1", "L1"]
                    found_codes = [duty.get('code', '') for duty in response]
                    missing_codes = [code for code in expected_codes if code not in found_codes]
                    if not missing_codes:
                        print(f"✅ All expected duty codes found: {found_codes[:6]}")
                    else:
                        print(f"⚠️  Missing expected duty codes: {missing_codes}")
                        success = False
                else:
                    print(f"⚠️  Expected at least 6 duties, found {len(response)}")
                    success = False
            else:
                print(f"⚠️  Expected list response, got {type(response)}")
                success = False
                
        return success, response

    def test_search_duties(self):
        """Test searching duties"""
        success, response = self.run_test(
            "Search Duties (Guard)",
            "GET", 
            "duties",
            200,
            params={"search": "Guard"}
        )
        
        if success and isinstance(response, list):
            guard_duties = [d for d in response if "Guard" in d.get('name', '')]
            print(f"   Found {len(guard_duties)} guard duties")
            
        return success

    def test_create_duty(self):
        """Test creating a new duty"""
        test_duty = {
            "name": f"Test Duty - {datetime.now().strftime('%H%M%S')}",
            "code": f"T{datetime.now().strftime('%M%S')}",
            "qualifications": ["Test", "Automated"]
        }
        
        success, response = self.run_test(
            "Create New Duty",
            "POST",
            "duties", 
            200,
            data=test_duty
        )
        
        if success and isinstance(response, dict):
            if 'id' in response:
                self.created_duties.append(response)
                print(f"   Created duty with ID: {response['id']}")
                return True, response
            else:
                print(f"⚠️  No ID in response")
                success = False
                
        return success, response if success else None

    def test_get_schedule_duties_empty(self):
        """Test getting schedule duties for a date (should be empty initially)"""
        test_date = "2026-02-13"
        success, response = self.run_test(
            f"Get Schedule Duties ({test_date})",
            "GET",
            "schedule-duties", 
            200,
            params={"date": test_date}
        )
        
        if success:
            if isinstance(response, list):
                print(f"   Found {len(response)} scheduled duties for {test_date}")
            else:
                print(f"⚠️  Expected list response, got {type(response)}")
                success = False
                
        return success

    def test_add_schedule_duty(self, duties_list=None):
        """Test adding a duty to schedule"""
        if not duties_list or len(duties_list) == 0:
            print("❌ No duties available to schedule")
            return False
            
        # Use first available duty
        duty_to_schedule = duties_list[0]
        test_date = "2026-02-13"
        
        schedule_data = {
            "duty_id": duty_to_schedule['id'],
            "duty_name": duty_to_schedule['name'],
            "duty_code": duty_to_schedule['code'],
            "qualifications": duty_to_schedule.get('qualifications', []),
            "date": test_date
        }
        
        success, response = self.run_test(
            f"Add Schedule Duty ({duty_to_schedule['code']})",
            "POST",
            "schedule-duties",
            200,
            data=schedule_data
        )
        
        if success and isinstance(response, dict):
            if 'id' in response:
                self.created_schedule_duties.append(response)
                print(f"   Scheduled duty with ID: {response['id']}")
                return True, response
            else:
                print(f"⚠️  No ID in response")
                success = False
                
        return success, response if success else None

    def test_get_schedule_duties_with_data(self):
        """Test getting schedule duties after adding some"""
        test_date = "2026-02-13"
        success, response = self.run_test(
            f"Get Schedule Duties (after adding)",
            "GET", 
            "schedule-duties",
            200,
            params={"date": test_date}
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} scheduled duties")
            if len(self.created_schedule_duties) > 0:
                expected_count = len(self.created_schedule_duties)
                if len(response) >= expected_count:
                    print(f"✅ Schedule duties count matches expectations")
                else:
                    print(f"⚠️  Expected at least {expected_count} duties, found {len(response)}")
                    success = False
                    
        return success

    def test_remove_schedule_duty(self):
        """Test removing a scheduled duty"""
        if len(self.created_schedule_duties) == 0:
            print("❌ No scheduled duties to remove")
            return False
            
        duty_to_remove = self.created_schedule_duties[0]
        success, response = self.run_test(
            f"Remove Schedule Duty ({duty_to_remove['id']})",
            "DELETE",
            f"schedule-duties/{duty_to_remove['id']}",
            200
        )
        
        if success:
            print(f"   Removed scheduled duty: {duty_to_remove['id']}")
            self.created_schedule_duties.remove(duty_to_remove)
            
        return success

    def cleanup(self):
        """Clean up created test data"""
        print(f"\n🧹 Cleaning up test data...")
        
        # Note: In a real scenario, we might want to clean up created duties and scheduled duties
        # For now, we'll just report what was created
        if self.created_duties:
            print(f"   Created {len(self.created_duties)} test duties")
        if self.created_schedule_duties:
            print(f"   {len(self.created_schedule_duties)} scheduled duties remain")

    def print_summary(self):
        """Print test results summary"""
        print(f"\n" + "="*50)
        print(f"📊 BACKEND API TEST SUMMARY")
        print(f"="*50)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print(f"🎉 All tests passed!")
            return True
        else:
            failed = self.tests_run - self.tests_passed
            print(f"❌ {failed} tests failed")
            return False

def main():
    """Main test runner"""
    print("🚀 Starting Scheduler Backend API Tests")
    print("="*50)
    
    tester = SchedulerAPITester()
    
    try:
        # Test 1: API Root
        tester.test_api_root()
        
        # Test 2: Get duties (should return pre-seeded data)
        duties_success, all_duties = tester.test_get_duties()
        if not duties_success:
            print("❌ Critical: Cannot get duties - stopping tests")
            return 1
        
        # Test 3: Search duties
        tester.test_search_duties()
        
        # Test 4: Create new duty
        create_success, created_duty = tester.test_create_duty()
        
        # Test 5: Get schedule duties (empty)
        tester.test_get_schedule_duties_empty()
        
        # Test 6: Add duty to schedule
        schedule_success, scheduled_duty = tester.test_add_schedule_duty(all_duties)
        
        # Test 7: Get schedule duties (with data)
        if schedule_success:
            tester.test_get_schedule_duties_with_data()
            
            # Test 8: Remove scheduled duty
            tester.test_remove_schedule_duty()
        
        # Clean up and print results
        tester.cleanup()
        success = tester.print_summary()
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print(f"\n❌ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)