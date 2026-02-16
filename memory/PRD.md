# OpsScheduler - Scheduling Calendar

## Problem Statement
Build a scheduling calendar in daily view that is time-based. Allow users to create single duties and group duties, assign qualified personnel to time slots, and reassign personnel instantly.

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

## Prioritized Backlog
### P1
- [ ] Drag-and-drop duty blocks on time grid
- [ ] Week/Month view implementation
- [ ] Recur Duty functionality

### P2
- [ ] Auto-Assign functionality
- [ ] Validate & Publish workflows
- [ ] User authentication
- [ ] Conflict detection for overlapping assignments
