# OpsScheduler - Scheduling Calendar MVP

## Problem Statement
Build a scheduling calendar in daily view that is time-based. First step: allow users to create single duty (Add Duty → Single Duty → Select Duty Name → Successfully Add Duty).

## Architecture
- **Frontend**: React + Shadcn UI + Tailwind CSS
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Theme**: Light/neutral professional (Manrope + IBM Plex Sans)

## User Personas
- Military/operations planners managing duty scheduling

## Core Requirements
- Daily view time-based calendar grid (0600-1800)
- Add Duty flow: dropdown → Single Duty → modal with searchable duties → add to grid
- Pre-seeded sample duties with qualifications
- Create new duty functionality
- Date navigation (prev/next/today)

## What's Been Implemented (Feb 13, 2026)
- Full backend API: CRUD for duties + schedule-duties with MongoDB
- 6 pre-seeded duties (G1, G2, G3, P1, D1, L1)
- Complete frontend: Sidebar, Header, CalendarControls, CalendarGrid, AddDutyDropdown, AddSingleDutyModal
- Single duty creation flow end-to-end
- Create New Duty flow
- Toast notifications via Sonner
- Date navigation
- Day/Week/Month view toggle (visual, Day active)

## Prioritized Backlog
### P0 (Done)
- [x] Single duty creation flow

### P1
- [ ] Group of duties flow
- [ ] Drag-and-drop duty blocks on time grid
- [ ] Week/Month view implementation

### P2
- [ ] Auto-Assign functionality
- [ ] Validate & Publish workflows
- [ ] User authentication
- [ ] Personnel assignment to duties
- [ ] Conflict detection
