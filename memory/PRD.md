# OpsScheduler - Scheduling Calendar

## Problem Statement
Build a scheduling calendar in daily view that is time-based. Allow users to create single duties and group duties, assign qualified personnel to time slots, reassign personnel instantly, toggle between calendar views (Day/Week/Month), and create recurring duties.

## Architecture
- **Frontend**: React + Shadcn UI + Tailwind CSS
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Theme**: Light/neutral professional (Manrope + IBM Plex Sans + JetBrains Mono)

## What's Been Implemented

### Phase 1 (Feb 13, 2026)
- Daily view calendar grid (0600-1800), sidebar nav, header, date navigation
- Single duty creation: Add Duty → Single Duty → searchable modal → add to grid

### Phase 2 (Feb 13, 2026)
- Side panel on time cell click for personnel assignment
- Available/Unavailable tabs, search, qualification badges
- Assignment blocks in grid (duty code, time range, person name)

### Phase 3 (Feb 16, 2026)
- **Reassign personnel**: Click name on assignment block → popover → search/select new person → instant reassignment via PUT API
- **Group of Duties**: Add Duty → Group of duties → name modal → group row in calendar
- **Group side panel**: Click time cell → "Add Duties" panel with empty state
- **Configure duties modal**: Table with duty name + personnel count + add/remove rows
- **Personnel slots**: After config, side panel shows each duty with N personnel dropdowns
- PersonnelDropdown component for searchable personnel selection

### Phase 4 (Feb 16, 2026)
- **Calendar View Toggle**: Day/Week/Month view buttons
  - Day view: Hourly time slots (0600-1800) with duty rows
  - Week view: 7-day grid (Mon-Sun) showing duty assignments per day
  - Month view: Full calendar grid with duties and assignment counts
- **Date Navigation**: Prev/Next buttons adapt to view (day/week/month increments)
- **Recurring Duties Feature**:
  - "Recur Duty" button in DutySlotPanel
  - RecurDutyModal with frequency options (Daily, Weekly, Bi-weekly, Monthly, Custom)
  - Custom frequency allows selecting specific days (Mon-Sun)
  - End conditions: Never (90 days), After X occurrences, On specific date
  - Backend creates multiple schedule duties and assignments based on recurrence pattern

### Phase 5 (Feb 19, 2026)
- **Single Duty Panel UI Update**:
  - Duty name displayed in card style (e.g., "Guard Duty - Main Gate")
  - Personnel selection via dropdown with chevron icon
  - Search field inside dropdown
  - Available/Unavailable tabs for filtering personnel
  - Personnel list shows callsign, duties count, qualification badges
- **Group Duty Panel UI Update**:
  - Removed Location field (MapPin icon and input)
  - PersonnelDropdown now includes Available/Unavailable tabs
  - Consistent dropdown styling across both panel types

## API Endpoints
- `GET /api/duties`: Fetch all duty definitions (with optional search)
- `POST /api/duties`: Create a new duty definition
- `GET /api/schedule-duties`: Fetch scheduled duties (supports `date` or `start_date` + `end_date`)
- `POST /api/schedule-duties`: Add a single or group duty to the schedule
- `DELETE /api/schedule-duties/{duty_id}`: Remove a scheduled duty
- `GET /api/personnel`: Fetch all personnel (with optional search/availability filter)
- `GET /api/assignments`: Fetch assignments (supports `date` or `start_date` + `end_date`)
- `POST /api/assignments`: Create a single assignment
- `PUT /api/assignments/{assignment_id}`: Update an existing assignment (reassignment)
- `DELETE /api/assignments/{assignment_id}`: Remove an assignment
- `GET /api/duty-group-configs/{schedule_duty_id}`: Fetch group duty configuration
- `POST /api/duty-group-configs`: Save/update group duty configuration
- `POST /api/recurring-assignments`: Create multiple assignments based on recurrence pattern

## Key Components
- `/app/frontend/src/pages/SchedulerPage.js` - Main scheduler page
- `/app/frontend/src/components/calendar/CalendarControls.js` - Date nav and view toggle
- `/app/frontend/src/components/calendar/CalendarGrid.js` - Day/Week/Month grid rendering
- `/app/frontend/src/components/duties/DutySlotPanel.js` - Personnel assignment panel
- `/app/frontend/src/components/duties/GroupDutyPanel.js` - Group duty configuration panel
- `/app/frontend/src/components/duties/RecurDutyModal.js` - Recurrence configuration modal
- `/app/backend/server.py` - FastAPI backend with all endpoints

## Prioritized Backlog

### P1 (Next Up)
- [ ] Drag-and-drop duty blocks on time grid

### P2 (Future)
- [ ] Auto-Assign functionality
- [ ] Validate & Publish workflows
- [ ] User authentication
- [ ] Conflict detection for overlapping assignments
