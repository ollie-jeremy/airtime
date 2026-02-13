# OpsScheduler - Scheduling Calendar

## Problem Statement
Build a scheduling calendar in daily view that is time-based. Allow users to create single duties and assign qualified personnel to time slots via a side panel.

## Architecture
- **Frontend**: React + Shadcn UI + Tailwind CSS
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Theme**: Light/neutral professional (Manrope + IBM Plex Sans)

## User Personas
- Military/operations planners managing duty scheduling and personnel assignment

## Core Requirements
- Daily view time-based calendar grid (0600-1800)
- Add Duty flow: dropdown → Single Duty → modal with searchable duties → add to grid
- Side panel for personnel assignment when clicking time slots
- Pre-seeded sample duties and personnel with qualifications

## What's Been Implemented

### Phase 1 (Feb 13, 2026)
- Full backend API: CRUD for duties, schedule-duties, personnel, assignments
- 6 pre-seeded duties, 8 pre-seeded personnel (6 available, 2 unavailable)
- Single duty creation flow end-to-end
- Create New Duty flow

### Phase 2 (Feb 13, 2026)
- Side panel (DutySlotPanel) opens on time cell click
- Shows duty info, date, time range selectors (0600-1800), All Day toggle
- Personnel section: search, Available/Unavailable tabs
- Personnel cards with callsign, qualifications, total duties
- Multi-select personnel + "Add Personnels" button
- Assignment blocks appear in grid (duty code, time, person name)
- Toast notifications via Sonner

## Prioritized Backlog
### P0 (Done)
- [x] Single duty creation flow
- [x] Side panel with personnel assignment

### P1
- [ ] Group of duties flow
- [ ] Drag-and-drop duty blocks on time grid
- [ ] Week/Month view implementation
- [ ] Recur Duty functionality

### P2
- [ ] Auto-Assign functionality
- [ ] Validate & Publish workflows
- [ ] User authentication
- [ ] Conflict detection for overlapping assignments
