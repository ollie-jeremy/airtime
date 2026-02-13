import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CalendarControls from "@/components/calendar/CalendarControls";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { format } from "date-fns";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SchedulerPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleDuties, setScheduleDuties] = useState([]);
  const [activeView, setActiveView] = useState("Day");

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const fetchScheduleDuties = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/schedule-duties?date=${dateStr}`);
      setScheduleDuties(res.data);
    } catch (e) {
      console.error("Failed to fetch schedule duties", e);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchScheduleDuties();
  }, [fetchScheduleDuties]);

  const handleDutyAdded = () => {
    fetchScheduleDuties();
  };

  const handleRemoveDuty = async (dutyId) => {
    try {
      await axios.delete(`${API}/schedule-duties/${dutyId}`);
      fetchScheduleDuties();
    } catch (e) {
      console.error("Failed to remove duty", e);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" data-testid="scheduler-page">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-16 lg:ml-56">
        <Header />
        <CalendarControls
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        <div className="flex-1 overflow-auto">
          <CalendarGrid
            scheduleDuties={scheduleDuties}
            selectedDate={dateStr}
            onDutyAdded={handleDutyAdded}
            onRemoveDuty={handleRemoveDuty}
          />
        </div>
      </div>
    </div>
  );
}
