import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CalendarControls from "@/components/calendar/CalendarControls";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import DutySlotPanel from "@/components/duties/DutySlotPanel";
import { format } from "date-fns";

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

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const fetchScheduleDuties = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/schedule-duties?date=${dateStr}`);
      setScheduleDuties(res.data);
    } catch (e) {
      console.error("Failed to fetch schedule duties", e);
    }
  }, [dateStr]);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/assignments?date=${dateStr}`);
      setAssignments(res.data);
    } catch (e) {
      console.error("Failed to fetch assignments", e);
    }
  }, [dateStr]);

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
      // Close panel if this duty was selected
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
            />
          </div>
          {panelOpen && (
            <DutySlotPanel
              open={panelOpen}
              onClose={handlePanelClose}
              duty={selectedDuty}
              selectedDate={dateStr}
              clickedTimeSlot={selectedSlot?.timeSlot}
              onAssignmentCreated={handleAssignmentCreated}
            />
          )}
        </div>
      </div>
    </div>
  );
}
