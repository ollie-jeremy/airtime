import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CalendarControls from "@/components/calendar/CalendarControls";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import DutySlotPanel from "@/components/duties/DutySlotPanel";
import GroupDutyPanel from "@/components/duties/GroupDutyPanel";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SchedulerPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleDuties, setScheduleDuties] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeView, setActiveView] = useState("Day");

  // Side panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const getDateRange = useCallback(() => {
    if (activeView === "Day") {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      return { date: dateStr };
    } else if (activeView === "Week") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return {
        start_date: format(weekStart, "yyyy-MM-dd"),
        end_date: format(weekEnd, "yyyy-MM-dd"),
      };
    } else if (activeView === "Month") {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      return {
        start_date: format(monthStart, "yyyy-MM-dd"),
        end_date: format(monthEnd, "yyyy-MM-dd"),
      };
    }
    return { date: format(selectedDate, "yyyy-MM-dd") };
  }, [selectedDate, activeView]);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const fetchScheduleDuties = useCallback(async () => {
    try {
      const params = getDateRange();
      const res = await axios.get(`${API}/schedule-duties`, { params });
      setScheduleDuties(res.data);
    } catch (e) {
      console.error("Failed to fetch schedule duties", e);
    }
  }, [getDateRange]);

  const fetchAssignments = useCallback(async () => {
    try {
      const params = getDateRange();
      const res = await axios.get(`${API}/assignments`, { params });
      setAssignments(res.data);
    } catch (e) {
      console.error("Failed to fetch assignments", e);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchScheduleDuties();
    fetchAssignments();
  }, [fetchScheduleDuties, fetchAssignments]);

  const handleDutyAdded = () => {
    fetchScheduleDuties();
  };

  const handleRemoveDuty = async (dutyId) => {
    try {
      await axios.delete(`${API}/schedule-duties/${dutyId}`);
      fetchScheduleDuties();
      fetchAssignments();
      if (selectedDuty?.id === dutyId) {
        setPanelOpen(false);
        setSelectedDuty(null);
        setSelectedSlot(null);
      }
    } catch (e) {
      console.error("Failed to remove duty", e);
    }
  };

  const handleCellClick = (duty, timeSlot) => {
    setSelectedDuty(duty);
    setSelectedSlot({ dutyId: duty.id, timeSlot });
    setPanelOpen(true);
  };

  const handlePanelClose = () => {
    setPanelOpen(false);
    setSelectedDuty(null);
    setSelectedSlot(null);
  };

  const handleAssignmentCreated = () => {
    fetchAssignments();
  };

  const isGroupDuty = selectedDuty?.duty_type === "group";

  return (
    <div className="flex h-screen overflow-hidden" data-testid="scheduler-page">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-16 lg:ml-56 min-w-0">
        <Header />
        <CalendarControls
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto">
            <CalendarGrid
              scheduleDuties={scheduleDuties}
              selectedDate={dateStr}
              onDutyAdded={handleDutyAdded}
              onRemoveDuty={handleRemoveDuty}
              onCellClick={handleCellClick}
              assignments={assignments}
              selectedSlot={selectedSlot}
              onAssignmentUpdated={fetchAssignments}
            />
          </div>
          {panelOpen && !isGroupDuty && (
            <DutySlotPanel
              open={panelOpen}
              onClose={handlePanelClose}
              duty={selectedDuty}
              selectedDate={dateStr}
              clickedTimeSlot={selectedSlot?.timeSlot}
              onAssignmentCreated={handleAssignmentCreated}
            />
          )}
          {panelOpen && isGroupDuty && (
            <GroupDutyPanel
              open={panelOpen}
              onClose={handlePanelClose}
              duty={selectedDuty}
              selectedDate={dateStr}
              clickedTimeSlot={selectedSlot?.timeSlot}
              onAssignmentCreated={handleAssignmentCreated}
              assignments={assignments}
            />
          )}
        </div>
      </div>
    </div>
  );
}
