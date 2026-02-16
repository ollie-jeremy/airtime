"""
Test file for Scheduling Calendar Views and Recurring Duties features.
Tests:
1. Calendar view toggle - Day/Week/Month
2. Date range queries for schedule duties and assignments
3. Recurring assignments API
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

class TestHealthAndBaseAPI:
    """Basic API connectivity tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"SUCCESS: API root returns: {data}")
    
    def test_get_duties(self):
        """Test duties list endpoint"""
        response = requests.get(f"{BASE_URL}/api/duties")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} duties")
    
    def test_get_personnel(self):
        """Test personnel list endpoint"""
        response = requests.get(f"{BASE_URL}/api/personnel")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} personnel")


class TestScheduleDutiesDateRange:
    """Test schedule duties with date range queries for Week/Month views"""
    
    def test_get_schedule_duties_single_date(self):
        """Test schedule duties with single date query"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.get(f"{BASE_URL}/api/schedule-duties", params={"date": today})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} schedule duties for date {today}")
    
    def test_get_schedule_duties_date_range_week(self):
        """Test schedule duties with date range query (week view)"""
        today = datetime.now()
        start = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")
        end = (today + timedelta(days=6-today.weekday())).strftime("%Y-%m-%d")
        
        response = requests.get(f"{BASE_URL}/api/schedule-duties", params={
            "start_date": start,
            "end_date": end
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} schedule duties for week range {start} to {end}")
    
    def test_get_schedule_duties_date_range_month(self):
        """Test schedule duties with date range query (month view)"""
        today = datetime.now()
        start = today.replace(day=1).strftime("%Y-%m-%d")
        # Get last day of month
        if today.month == 12:
            end = today.replace(year=today.year+1, month=1, day=1) - timedelta(days=1)
        else:
            end = today.replace(month=today.month+1, day=1) - timedelta(days=1)
        end_str = end.strftime("%Y-%m-%d")
        
        response = requests.get(f"{BASE_URL}/api/schedule-duties", params={
            "start_date": start,
            "end_date": end_str
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} schedule duties for month range {start} to {end_str}")


class TestAssignmentsDateRange:
    """Test assignments with date range queries for Week/Month views"""
    
    def test_get_assignments_single_date(self):
        """Test assignments with single date query"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.get(f"{BASE_URL}/api/assignments", params={"date": today})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} assignments for date {today}")
    
    def test_get_assignments_date_range_week(self):
        """Test assignments with date range query (week view)"""
        today = datetime.now()
        start = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")
        end = (today + timedelta(days=6-today.weekday())).strftime("%Y-%m-%d")
        
        response = requests.get(f"{BASE_URL}/api/assignments", params={
            "start_date": start,
            "end_date": end
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} assignments for week range {start} to {end}")
    
    def test_get_assignments_date_range_month(self):
        """Test assignments with date range query (month view)"""
        today = datetime.now()
        start = today.replace(day=1).strftime("%Y-%m-%d")
        if today.month == 12:
            end = today.replace(year=today.year+1, month=1, day=1) - timedelta(days=1)
        else:
            end = today.replace(month=today.month+1, day=1) - timedelta(days=1)
        end_str = end.strftime("%Y-%m-%d")
        
        response = requests.get(f"{BASE_URL}/api/assignments", params={
            "start_date": start,
            "end_date": end_str
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Got {len(data)} assignments for month range {start} to {end_str}")


class TestRecurringAssignments:
    """Test recurring assignments API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        # Get available personnel
        personnel_resp = requests.get(f"{BASE_URL}/api/personnel", params={"available": True})
        self.personnel = personnel_resp.json()
        
        # Get duties
        duties_resp = requests.get(f"{BASE_URL}/api/duties")
        self.duties = duties_resp.json()
    
    def test_create_recurring_assignment_daily(self):
        """Test creating recurring assignments with daily frequency"""
        if not self.personnel or not self.duties:
            pytest.skip("No personnel or duties available for testing")
        
        # First create a schedule duty for today
        today = datetime.now().strftime("%Y-%m-%d")
        duty = self.duties[0]
        person = self.personnel[0]
        
        schedule_duty_resp = requests.post(f"{BASE_URL}/api/schedule-duties", json={
            "duty_id": duty["id"],
            "duty_name": duty["name"],
            "duty_code": duty["code"],
            "duty_type": "single",
            "date": today
        })
        assert schedule_duty_resp.status_code == 200
        schedule_duty = schedule_duty_resp.json()
        
        # Create recurring assignment - daily for 3 occurrences
        response = requests.post(f"{BASE_URL}/api/recurring-assignments", json={
            "schedule_duty_id": schedule_duty["id"],
            "duty_code": duty["code"],
            "duty_name": duty["name"],
            "personnel_id": person["id"],
            "personnel_name": person["name"],
            "personnel_callsign": person["callsign"],
            "start_date": today,
            "start_time": "0800",
            "end_time": "1000",
            "recurrence": {
                "frequency": "daily",
                "interval": 1,
                "end_type": "occurrences",
                "occurrences": 3,
                "end_date": None,
                "custom_days": []
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "created_count" in data
        assert data["created_count"] == 3
        assert "dates" in data
        assert len(data["dates"]) == 3
        print(f"SUCCESS: Created {data['created_count']} recurring daily assignments")
        print(f"Dates: {data['dates']}")
    
    def test_create_recurring_assignment_weekly(self):
        """Test creating recurring assignments with weekly frequency"""
        if not self.personnel or not self.duties:
            pytest.skip("No personnel or duties available for testing")
        
        today = datetime.now().strftime("%Y-%m-%d")
        duty = self.duties[0] if len(self.duties) > 0 else None
        person = self.personnel[1] if len(self.personnel) > 1 else self.personnel[0]
        
        if not duty:
            pytest.skip("No duties available")
        
        # Create schedule duty
        schedule_duty_resp = requests.post(f"{BASE_URL}/api/schedule-duties", json={
            "duty_id": duty["id"],
            "duty_name": f"TEST_Weekly_{duty['name']}",
            "duty_code": duty["code"],
            "duty_type": "single",
            "date": today
        })
        assert schedule_duty_resp.status_code == 200
        schedule_duty = schedule_duty_resp.json()
        
        # Create recurring assignment - weekly for 4 occurrences
        response = requests.post(f"{BASE_URL}/api/recurring-assignments", json={
            "schedule_duty_id": schedule_duty["id"],
            "duty_code": duty["code"],
            "duty_name": duty["name"],
            "personnel_id": person["id"],
            "personnel_name": person["name"],
            "personnel_callsign": person["callsign"],
            "start_date": today,
            "start_time": "0900",
            "end_time": "1100",
            "recurrence": {
                "frequency": "weekly",
                "interval": 1,
                "end_type": "occurrences",
                "occurrences": 4,
                "end_date": None,
                "custom_days": []
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["created_count"] == 4
        print(f"SUCCESS: Created {data['created_count']} recurring weekly assignments")
    
    def test_create_recurring_assignment_biweekly(self):
        """Test creating recurring assignments with bi-weekly frequency"""
        if not self.personnel or not self.duties:
            pytest.skip("No personnel or duties available for testing")
        
        today = datetime.now().strftime("%Y-%m-%d")
        duty = self.duties[0]
        person = self.personnel[0]
        
        schedule_duty_resp = requests.post(f"{BASE_URL}/api/schedule-duties", json={
            "duty_id": duty["id"],
            "duty_name": f"TEST_Biweekly_{duty['name']}",
            "duty_code": duty["code"],
            "duty_type": "single",
            "date": today
        })
        schedule_duty = schedule_duty_resp.json()
        
        response = requests.post(f"{BASE_URL}/api/recurring-assignments", json={
            "schedule_duty_id": schedule_duty["id"],
            "duty_code": duty["code"],
            "duty_name": duty["name"],
            "personnel_id": person["id"],
            "personnel_name": person["name"],
            "personnel_callsign": person["callsign"],
            "start_date": today,
            "start_time": "1000",
            "end_time": "1200",
            "recurrence": {
                "frequency": "biweekly",
                "interval": 2,
                "end_type": "occurrences",
                "occurrences": 2,
                "end_date": None,
                "custom_days": []
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["created_count"] == 2
        print(f"SUCCESS: Created {data['created_count']} recurring bi-weekly assignments")
    
    def test_create_recurring_assignment_monthly(self):
        """Test creating recurring assignments with monthly frequency"""
        if not self.personnel or not self.duties:
            pytest.skip("No personnel or duties available for testing")
        
        today = datetime.now().strftime("%Y-%m-%d")
        duty = self.duties[0]
        person = self.personnel[0]
        
        schedule_duty_resp = requests.post(f"{BASE_URL}/api/schedule-duties", json={
            "duty_id": duty["id"],
            "duty_name": f"TEST_Monthly_{duty['name']}",
            "duty_code": duty["code"],
            "duty_type": "single",
            "date": today
        })
        schedule_duty = schedule_duty_resp.json()
        
        response = requests.post(f"{BASE_URL}/api/recurring-assignments", json={
            "schedule_duty_id": schedule_duty["id"],
            "duty_code": duty["code"],
            "duty_name": duty["name"],
            "personnel_id": person["id"],
            "personnel_name": person["name"],
            "personnel_callsign": person["callsign"],
            "start_date": today,
            "start_time": "1100",
            "end_time": "1300",
            "recurrence": {
                "frequency": "monthly",
                "interval": 1,
                "end_type": "occurrences",
                "occurrences": 3,
                "end_date": None,
                "custom_days": []
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["created_count"] == 3
        print(f"SUCCESS: Created {data['created_count']} recurring monthly assignments")
    
    def test_create_recurring_assignment_custom_days(self):
        """Test creating recurring assignments with custom day selection"""
        if not self.personnel or not self.duties:
            pytest.skip("No personnel or duties available for testing")
        
        today = datetime.now().strftime("%Y-%m-%d")
        duty = self.duties[0]
        person = self.personnel[0]
        
        schedule_duty_resp = requests.post(f"{BASE_URL}/api/schedule-duties", json={
            "duty_id": duty["id"],
            "duty_name": f"TEST_Custom_{duty['name']}",
            "duty_code": duty["code"],
            "duty_type": "single",
            "date": today
        })
        schedule_duty = schedule_duty_resp.json()
        
        # Custom days: Mon(0) and Wed(2)
        response = requests.post(f"{BASE_URL}/api/recurring-assignments", json={
            "schedule_duty_id": schedule_duty["id"],
            "duty_code": duty["code"],
            "duty_name": duty["name"],
            "personnel_id": person["id"],
            "personnel_name": person["name"],
            "personnel_callsign": person["callsign"],
            "start_date": today,
            "start_time": "1200",
            "end_time": "1400",
            "recurrence": {
                "frequency": "custom",
                "interval": 1,
                "end_type": "occurrences",
                "occurrences": 5,
                "end_date": None,
                "custom_days": [0, 2]  # Monday and Wednesday
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["created_count"] >= 1
        print(f"SUCCESS: Created {data['created_count']} recurring custom-day assignments")
    
    def test_create_recurring_assignment_end_by_date(self):
        """Test creating recurring assignments with end by date condition"""
        if not self.personnel or not self.duties:
            pytest.skip("No personnel or duties available for testing")
        
        today = datetime.now()
        today_str = today.strftime("%Y-%m-%d")
        end_date = (today + timedelta(days=14)).strftime("%Y-%m-%d")
        duty = self.duties[0]
        person = self.personnel[0]
        
        schedule_duty_resp = requests.post(f"{BASE_URL}/api/schedule-duties", json={
            "duty_id": duty["id"],
            "duty_name": f"TEST_EndDate_{duty['name']}",
            "duty_code": duty["code"],
            "duty_type": "single",
            "date": today_str
        })
        schedule_duty = schedule_duty_resp.json()
        
        response = requests.post(f"{BASE_URL}/api/recurring-assignments", json={
            "schedule_duty_id": schedule_duty["id"],
            "duty_code": duty["code"],
            "duty_name": duty["name"],
            "personnel_id": person["id"],
            "personnel_name": person["name"],
            "personnel_callsign": person["callsign"],
            "start_date": today_str,
            "start_time": "1300",
            "end_time": "1500",
            "recurrence": {
                "frequency": "daily",
                "interval": 1,
                "end_type": "date",
                "occurrences": None,
                "end_date": end_date,
                "custom_days": []
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["created_count"] > 0
        print(f"SUCCESS: Created {data['created_count']} recurring assignments ending by {end_date}")
    
    def test_create_recurring_assignment_never_end(self):
        """Test creating recurring assignments with 'never' end condition (90 days max)"""
        if not self.personnel or not self.duties:
            pytest.skip("No personnel or duties available for testing")
        
        today = datetime.now().strftime("%Y-%m-%d")
        duty = self.duties[0]
        person = self.personnel[0]
        
        schedule_duty_resp = requests.post(f"{BASE_URL}/api/schedule-duties", json={
            "duty_id": duty["id"],
            "duty_name": f"TEST_Never_{duty['name']}",
            "duty_code": duty["code"],
            "duty_type": "single",
            "date": today
        })
        schedule_duty = schedule_duty_resp.json()
        
        response = requests.post(f"{BASE_URL}/api/recurring-assignments", json={
            "schedule_duty_id": schedule_duty["id"],
            "duty_code": duty["code"],
            "duty_name": duty["name"],
            "personnel_id": person["id"],
            "personnel_name": person["name"],
            "personnel_callsign": person["callsign"],
            "start_date": today,
            "start_time": "1400",
            "end_time": "1600",
            "recurrence": {
                "frequency": "weekly",
                "interval": 1,
                "end_type": "never",
                "occurrences": None,
                "end_date": None,
                "custom_days": []
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        # Never should create ~13 weekly occurrences for 90 days
        assert data["created_count"] > 10
        print(f"SUCCESS: Created {data['created_count']} recurring assignments with 'never' end condition")


class TestAssignmentCRUD:
    """Test standard assignment CRUD operations"""
    
    def test_create_and_get_assignment(self):
        """Test creating and retrieving an assignment"""
        # Get test data
        personnel_resp = requests.get(f"{BASE_URL}/api/personnel", params={"available": True})
        personnel = personnel_resp.json()
        
        duties_resp = requests.get(f"{BASE_URL}/api/duties")
        duties = duties_resp.json()
        
        if not personnel or not duties:
            pytest.skip("No personnel or duties available")
        
        today = datetime.now().strftime("%Y-%m-%d")
        duty = duties[0]
        person = personnel[0]
        
        # Create schedule duty
        schedule_duty_resp = requests.post(f"{BASE_URL}/api/schedule-duties", json={
            "duty_id": duty["id"],
            "duty_name": f"TEST_CRUD_{duty['name']}",
            "duty_code": duty["code"],
            "duty_type": "single",
            "date": today
        })
        schedule_duty = schedule_duty_resp.json()
        
        # Create assignment
        create_resp = requests.post(f"{BASE_URL}/api/assignments", json={
            "schedule_duty_id": schedule_duty["id"],
            "duty_code": duty["code"],
            "duty_name": duty["name"],
            "personnel_id": person["id"],
            "personnel_name": person["name"],
            "personnel_callsign": person["callsign"],
            "date": today,
            "start_time": "0800",
            "end_time": "1000"
        })
        
        assert create_resp.status_code == 200
        assignment = create_resp.json()
        assert assignment["personnel_name"] == person["name"]
        assert assignment["date"] == today
        print(f"SUCCESS: Created assignment for {person['name']}")
        
        # Verify via GET
        get_resp = requests.get(f"{BASE_URL}/api/assignments", params={"date": today})
        assert get_resp.status_code == 200
        assignments = get_resp.json()
        found = any(a["id"] == assignment["id"] for a in assignments)
        assert found, "Created assignment should be found in GET response"
        print(f"SUCCESS: Assignment verified in GET response")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
