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

    def test_get_personnel(self):
        """Test getting all personnel (should return 8 seeded personnel)"""
        success, response = self.run_test(
            "Get All Personnel",
            "GET",
            "personnel",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} personnel")
            if len(response) == 8:
                print("   ✅ Correct number of seeded personnel (8)")
                available = [p for p in response if p.get('available', False)]
                unavailable = [p for p in response if not p.get('available', True)]
                print(f"   Available: {len(available)}, Unavailable: {len(unavailable)}")
                if len(available) == 6 and len(unavailable) == 2:
                    print("   ✅ Correct availability distribution (6 available, 2 unavailable)")
                else:
                    print(f"   ❌ Expected 6 available, 2 unavailable")
                    success = False
            else:
                print(f"   ❌ Expected 8 personnel, got {len(response)}")
                success = False
                
        return success, response if success else []

    def test_personnel_filtering(self):
        """Test personnel filtering by availability"""
        # Test available=true filter
        success_avail, available_data = self.run_test(
            "Get Available Personnel", 
            "GET",
            "personnel",
            200,
            params={"available": True}
        )
        
        if success_avail and isinstance(available_data, list):
            print(f"   Available personnel: {len(available_data)}")
            if len(available_data) == 6:
                print("   ✅ Correct available personnel count")
            else:
                print(f"   ❌ Expected 6 available personnel, got {len(available_data)}")
                success_avail = False
            
        # Test available=false filter  
        success_unavail, unavailable_data = self.run_test(
            "Get Unavailable Personnel",
            "GET",
            "personnel", 
            200,
            params={"available": False}
        )
        
        if success_unavail and isinstance(unavailable_data, list):
            print(f"   Unavailable personnel: {len(unavailable_data)}")
            if len(unavailable_data) == 2:
                print("   ✅ Correct unavailable personnel count")
            else:
                print(f"   ❌ Expected 2 unavailable personnel, got {len(unavailable_data)}")
                success_unavail = False

        return success_avail and success_unavail

    def test_personnel_search(self):
        """Test personnel search by callsign/name"""
        success, response = self.run_test(
            "Search Personnel (Alpha)",
            "GET",
            "personnel",
            200,
            params={"search": "Alpha"}
        )
        
        if success and isinstance(response, list):
            alpha_personnel = [p for p in response if "Alpha" in p.get('callsign', '') or "Alpha" in p.get('name', '')]
            print(f"   Found {len(alpha_personnel)} personnel matching 'Alpha'")
            if len(alpha_personnel) > 0:
                print("   ✅ Search working correctly")
            else:
                print("   ❌ Search should return results for 'Alpha'")
                success = False
                
        return success

    def test_get_assignments_empty(self):
        """Test getting assignments for a date (should be empty initially)"""
        test_date = "2026-02-13"
        success, response = self.run_test(
            f"Get Assignments ({test_date})",
            "GET", 
            "assignments",
            200,
            params={"date": test_date}
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} assignments for {test_date}")
            
        return success

    def test_create_assignment(self, personnel_list=None):
        """Test creating an assignment"""
        if not personnel_list or len(personnel_list) == 0:
            print("❌ No personnel available for assignment")
            return False
            
        if len(self.created_schedule_duties) == 0:
            print("❌ No scheduled duties available for assignment")
            return False
            
        # Use first available person and first scheduled duty
        person = personnel_list[0]
        scheduled_duty = self.created_schedule_duties[0]
        test_date = "2026-02-13"
        
        assignment_data = {
            "schedule_duty_id": scheduled_duty['id'],
            "duty_code": scheduled_duty['duty_code'],
            "duty_name": scheduled_duty['duty_name'], 
            "personnel_id": person['id'],
            "personnel_name": person['name'],
            "personnel_callsign": person['callsign'],
            "date": test_date,
            "start_time": "0800",
            "end_time": "1000"
        }
        
        success, response = self.run_test(
            f"Create Assignment ({person['callsign']} -> {scheduled_duty['duty_code']})",
            "POST",
            "assignments",
            200,
            data=assignment_data
        )
        
        if success and isinstance(response, dict):
            if 'id' in response:
                print(f"   Created assignment with ID: {response['id']}")
                return True, response
            else:
                print(f"   ❌ No ID in assignment response")
                success = False
                
        return success, response if success else None

    def test_get_assignments_with_data(self):
        """Test getting assignments after creating one"""
        test_date = "2026-02-13"
        success, response = self.run_test(
            f"Get Assignments (after creating)",
            "GET",
            "assignments", 
            200,
            params={"date": test_date}
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} assignments")
            if len(response) > 0:
                print("   ✅ Assignment creation confirmed")
            else:
                print("   ❌ Expected to find created assignment")
                success = False
                
        return success, response if success else []

    def test_create_group_schedule_duty(self):
        """Test creating a group schedule duty"""
        test_date = "2026-02-13"
        
        group_data = {
            "duty_id": f"group-{datetime.now().strftime('%H%M%S')}",
            "duty_name": f"Test Flight Team - {datetime.now().strftime('%H%M%S')}",
            "duty_code": "",
            "duty_type": "group",
            "qualifications": [],
            "date": test_date
        }
        
        success, response = self.run_test(
            "Create Group Schedule Duty",
            "POST",
            "schedule-duties",
            200,
            data=group_data
        )
        
        if success and isinstance(response, dict):
            if 'id' in response and response.get('duty_type') == 'group':
                self.created_schedule_duties.append(response)
                print(f"   Created group duty with ID: {response['id']}")
                return True, response
            else:
                print(f"⚠️  Invalid group duty response")
                success = False
                
        return success, response if success else None

    def test_save_duty_group_config(self, schedule_duty_id):
        """Test saving group duty configuration"""
        config_data = {
            "schedule_duty_id": schedule_duty_id,
            "duties": [
                {"name": "Pilot", "count": 2},
                {"name": "Tower", "count": 1},
                {"name": "Ground Control", "count": 1}
            ]
        }
        
        success, response = self.run_test(
            "Save Duty Group Config",
            "POST",
            "duty-group-configs",
            200,
            data=config_data
        )
        
        if success and isinstance(response, dict):
            if 'id' in response and 'duties' in response:
                print(f"   Created config with {len(response['duties'])} duty types")
                return True, response
            else:
                print(f"⚠️  Invalid config response")
                success = False
                
        return success, response if success else None

    def test_get_duty_group_config(self, schedule_duty_id):
        """Test getting group duty configuration"""
        success, response = self.run_test(
            f"Get Duty Group Config ({schedule_duty_id})",
            "GET",
            f"duty-group-configs/{schedule_duty_id}",
            200
        )
        
        if success and response:
            if 'duties' in response:
                print(f"   Retrieved config with {len(response['duties'])} duty types")
                return True, response
            else:
                print(f"⚠️  Config missing duties field")
                success = False
        elif success and not response:
            print(f"   No config found (expected for new group)")
            return True, None
                
        return success, response if success else None

    def test_create_group_assignment(self, group_duty, personnel_list):
        """Test creating assignments for group duties"""
        if not group_duty or not personnel_list:
            print("❌ Missing group duty or personnel for group assignment")
            return False
            
        if len(personnel_list) < 3:
            print("❌ Need at least 3 personnel for group assignment test")
            return False
            
        test_date = "2026-02-13"
        assignments_created = []
        
        # Create assignments for different sub-duties
        group_assignments = [
            {"sub_duty_name": "Pilot", "slot_index": 0, "person_idx": 0},
            {"sub_duty_name": "Pilot", "slot_index": 1, "person_idx": 1},
            {"sub_duty_name": "Tower", "slot_index": 0, "person_idx": 2}
        ]
        
        for assignment_def in group_assignments:
            person = personnel_list[assignment_def["person_idx"]]
            assignment_data = {
                "schedule_duty_id": group_duty['id'],
                "duty_code": group_duty.get('duty_code', group_duty['duty_name']),
                "duty_name": group_duty['duty_name'],
                "personnel_id": person['id'],
                "personnel_name": person['name'],
                "personnel_callsign": person['callsign'],
                "date": test_date,
                "start_time": "0800",
                "end_time": "1200",
                "sub_duty_name": assignment_def["sub_duty_name"],
                "slot_index": assignment_def["slot_index"]
            }
            
            success, response = self.run_test(
                f"Create Group Assignment ({person['callsign']} -> {assignment_def['sub_duty_name']}-{assignment_def['slot_index']})",
                "POST",
                "assignments",
                200,
                data=assignment_data
            )
            
            if success and isinstance(response, dict) and 'id' in response:
                assignments_created.append(response)
                
        if assignments_created:
            print(f"   Created {len(assignments_created)} group assignments")
            return True, assignments_created
        else:
            print("❌ Failed to create group assignments")
            return False, []

    def test_update_assignment(self, assignment, new_personnel):
        """Test updating/reassigning personnel for an assignment"""
        if not assignment or 'id' not in assignment:
            print("❌ No valid assignment to update")
            return False
            
        if not new_personnel:
            print("❌ No personnel to reassign to")
            return False
            
        update_data = {
            "personnel_id": new_personnel['id'],
            "personnel_name": new_personnel['name'],
            "personnel_callsign": new_personnel['callsign']
        }
        
        success, response = self.run_test(
            f"Update Assignment (Reassign to {new_personnel['callsign']})",
            "PUT",
            f"assignments/{assignment['id']}",
            200,
            data=update_data
        )
        
        if success:
            print(f"   Updated assignment: {assignment['id']} -> {new_personnel['callsign']}")
            
        return success, response if success else None

    def test_delete_assignment(self, assignment):
        """Test deleting an assignment"""
        if not assignment or 'id' not in assignment:
            print("❌ No valid assignment to delete")
            return False
            
        success, response = self.run_test(
            f"Delete Assignment ({assignment['id']})",
            "DELETE",
            f"assignments/{assignment['id']}",
            200
        )
        
        if success:
            print(f"   Deleted assignment: {assignment['id']}")
            
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
        
        # Test 5: Get personnel (should return 8 seeded personnel)
        personnel_success, all_personnel = tester.test_get_personnel()
        if not personnel_success:
            print("❌ Critical: Cannot get personnel - continuing but with limited tests")
            all_personnel = []
        
        # Test 6: Personnel filtering by availability
        if personnel_success:
            tester.test_personnel_filtering()
        
        # Test 7: Personnel search
        if personnel_success:
            tester.test_personnel_search()
        
        # Test 8: Get schedule duties (empty)
        tester.test_get_schedule_duties_empty()
        
        # Test 9: Add duty to schedule
        schedule_success, scheduled_duty = tester.test_add_schedule_duty(all_duties)
        
        # Test 10: Get schedule duties (with data)
        if schedule_success:
            tester.test_get_schedule_duties_with_data()
        
        # Test 11: Get assignments (empty)
        tester.test_get_assignments_empty()
        
        # Test 12: Create assignment
        assignment_created = None
        if schedule_success and personnel_success:
            assignment_success, assignment_created = tester.test_create_assignment(all_personnel)
        
        # Test 13: Get assignments (with data)
        if assignment_created:
            assignment_get_success, assignments_list = tester.test_get_assignments_with_data()
            
            # Test 14: Delete assignment
            if assignment_get_success and assignments_list:
                tester.test_delete_assignment(assignments_list[0])
        
        # Test 15: Remove scheduled duty
        if schedule_success:
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