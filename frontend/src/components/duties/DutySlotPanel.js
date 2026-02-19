import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar as CalIcon,
  Clock,
  ArrowRight,
  Search,
  User,
  ChevronDown,
  Repeat,
} from "lucide-react";
import RecurDutyModal from "./RecurDutyModal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIME_OPTIONS = [
  "0600", "0700", "0800", "0900", "1000", "1100",
  "1200", "1300", "1400", "1500", "1600", "1700", "1800",
];

export default function DutySlotPanel({
  open,
  onClose,
  duty,
  selectedDate,
  clickedTimeSlot,
  onAssignmentCreated,
}) {
  const [startTime, setStartTime] = useState("0600");
  const [endTime, setEndTime] = useState("0800");
  const [allDay, setAllDay] = useState(false);
  const [activeTab, setActiveTab] = useState("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [personnel, setPersonnel] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recurModalOpen, setRecurModalOpen] = useState(false);
  const [recurrence, setRecurrence] = useState(null);

  // Set time from clicked slot
  useEffect(() => {
    if (clickedTimeSlot) {
      setStartTime(clickedTimeSlot);
      const idx = TIME_OPTIONS.indexOf(clickedTimeSlot);
      if (idx >= 0 && idx < TIME_OPTIONS.length - 1) {
        setEndTime(TIME_OPTIONS[Math.min(idx + 2, TIME_OPTIONS.length - 1)]);
      }
    }
  }, [clickedTimeSlot]);

  // Fetch personnel
  useEffect(() => {
    if (!open || !dropdownOpen) return;
    const fetchPersonnel = async () => {
      try {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (activeTab === "available") params.available = true;
        if (activeTab === "unavailable") params.available = false;
        const res = await axios.get(`${API}/personnel`, { params });
        setPersonnel(res.data);
      } catch (e) {
        console.error("Failed to fetch personnel", e);
      }
    };
    fetchPersonnel();
  }, [open, dropdownOpen, searchQuery, activeTab]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedPerson(null);
      setDropdownOpen(false);
      setAllDay(false);
      setRecurrence(null);
    }
  }, [open]);

  const handleRecurrenceConfirm = (recurrencePattern) => {
    setRecurrence(recurrencePattern);
    setRecurModalOpen(false);
  };

  const clearRecurrence = () => {
    setRecurrence(null);
  };

  const handleSelectPerson = (person) => {
    setSelectedPerson(person);
    setDropdownOpen(false);
    setSearchQuery("");
  };

  const handleAddPersonnel = async () => {
    if (!selectedPerson) return;
    setLoading(true);
    try {
      const effectiveStart = allDay ? "0600" : startTime;
      const effectiveEnd = allDay ? "1800" : endTime;
      
      if (recurrence) {
        // Create recurring assignments
        await axios.post(`${API}/recurring-assignments`, {
          schedule_duty_id: duty.id,
          duty_code: duty.duty_code,
          duty_name: duty.duty_name,
          personnel_id: selectedPerson.id,
          personnel_name: selectedPerson.name,
          personnel_callsign: selectedPerson.callsign,
          start_date: selectedDate,
          start_time: effectiveStart,
          end_time: effectiveEnd,
          recurrence: recurrence,
        });
        toast.success(`Recurring duty created for ${selectedPerson.name}`);
      } else {
        // Create single assignment
        await axios.post(`${API}/assignments`, {
          schedule_duty_id: duty.id,
          duty_code: duty.duty_code,
          duty_name: duty.duty_name,
          personnel_id: selectedPerson.id,
          personnel_name: selectedPerson.name,
          personnel_callsign: selectedPerson.callsign,
          date: selectedDate,
          start_time: effectiveStart,
          end_time: effectiveEnd,
        });
        toast.success(`${selectedPerson.name} assigned to ${duty.duty_code}`);
      }
      
      onAssignmentCreated();
      onClose();
    } catch (e) {
      toast.error("Failed to assign personnel");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !duty) return null;

  // Format date for display
  const dateObj = new Date(selectedDate + "T00:00:00");
  const dateDisplay = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const dutyDisplayName = duty.duty_name.includes(" - ") 
    ? duty.duty_name 
    : `${duty.duty_code} - ${duty.duty_name.replace(duty.duty_code + " ", "")}`;

  return (
    <div
      className="w-[340px] border-l border-gray-200 bg-white h-full flex flex-col shrink-0 overflow-hidden"
      data-testid="duty-slot-panel"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold font-[Manrope] text-slate-900">
            Add Duty
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{duty.duty_code}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 transition-colors"
          data-testid="close-panel-btn"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Date & Time */}
        <div className="px-5 py-4 border-b border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CalIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateDisplay}</span>
            </div>
            <button
              onClick={() => setRecurModalOpen(true)}
              className={`flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold transition-colors ${
                recurrence 
                  ? "text-blue-600 hover:text-blue-700" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
              data-testid="recur-duty-btn"
            >
              <Repeat className="w-3 h-3" />
              {recurrence ? "Recurring" : "Recur Duty"}
            </button>
          </div>

          {/* Recurrence Info Display */}
          {recurrence && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-100">
              <div className="text-xs text-blue-700">
                <span className="font-medium capitalize">{recurrence.frequency}</span>
                {recurrence.end_type === "occurrences" && (
                  <span> · {recurrence.occurrences} times</span>
                )}
                {recurrence.end_type === "date" && recurrence.end_date && (
                  <span> · until {recurrence.end_date}</span>
                )}
                {recurrence.end_type === "never" && (
                  <span> · up to 90 days</span>
                )}
              </div>
              <button
                onClick={clearRecurrence}
                className="p-0.5 hover:bg-blue-100 rounded transition-colors"
                data-testid="clear-recurrence-btn"
              >
                <X className="w-3 h-3 text-blue-500" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={allDay ? "0600" : startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={allDay}
              className="h-8 px-2 border border-gray-200 rounded text-sm bg-white text-slate-700 disabled:opacity-50"
              data-testid="start-time-select"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={allDay ? "1800" : endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={allDay}
              className="h-8 px-2 border border-gray-200 rounded text-sm bg-white text-slate-700 disabled:opacity-50"
              data-testid="end-time-select"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
              <div
                onClick={() => setAllDay(!allDay)}
                className={`w-8 h-[18px] rounded-full transition-colors relative cursor-pointer ${
                  allDay ? "bg-blue-600" : "bg-slate-200"
                }`}
                data-testid="all-day-toggle"
              >
                <div
                  className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${
                    allDay ? "translate-x-[16px]" : "translate-x-[2px]"
                  }`}
                />
              </div>
              <span className="text-xs text-slate-500">All Day</span>
            </label>
          </div>
        </div>

        {/* Duty Card */}
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            {/* Duty Name */}
            <h3 className="text-base font-semibold text-slate-900">{dutyDisplayName}</h3>

            {/* Personnel Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex-1 h-10 px-3 flex items-center justify-between border rounded-md text-sm transition-colors ${
                    selectedPerson
                      ? "border-gray-200 bg-white text-slate-700"
                      : "border-gray-200 bg-white text-slate-400"
                  }`}
                  data-testid="personnel-dropdown-btn"
                >
                  <span className="truncate">{selectedPerson ? selectedPerson.name : "Personnel"}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Dropdown Content */}
              {dropdownOpen && (
                <div className="border border-gray-200 rounded-md shadow-lg bg-white overflow-hidden">
                  {/* Search */}
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search"
                        className="w-full h-8 pl-8 pr-2 text-sm border border-gray-200 rounded bg-white outline-none focus:border-blue-400"
                        autoFocus
                        data-testid="personnel-search-input"
                      />
                    </div>
                  </div>

                  {/* Available / Unavailable Tabs */}
                  <div className="flex border-b border-gray-200 px-2">
                    <button
                      onClick={() => setActiveTab("available")}
                      className={`px-3 py-2 text-xs font-medium transition-colors ${
                        activeTab === "available"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                      data-testid="tab-available"
                    >
                      Available
                    </button>
                    <button
                      onClick={() => setActiveTab("unavailable")}
                      className={`px-3 py-2 text-xs font-medium transition-colors ${
                        activeTab === "unavailable"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                      data-testid="tab-unavailable"
                    >
                      Unavailable
                    </button>
                  </div>

                  {/* Personnel List */}
                  <div className="max-h-[220px] overflow-y-auto">
                    {personnel.length > 0 ? (
                      personnel.map((person) => (
                        <button
                          key={person.id}
                          onClick={() => handleSelectPerson(person)}
                          className={`w-full px-3 py-2.5 text-left border-b border-gray-50 last:border-b-0 transition-colors ${
                            selectedPerson?.id === person.id ? "bg-blue-50" : "hover:bg-slate-50"
                          }`}
                          data-testid={`personnel-${person.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">
                              {person.callsign}
                            </span>
                            <span className="text-xs text-slate-400">
                              Duties: {person.total_duties}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {person.qualifications.map((q) => (
                              <Badge
                                key={q}
                                variant="secondary"
                                className="text-[9px] px-1.5 py-0 h-5 bg-slate-100 text-slate-500 font-normal border-0"
                              >
                                {q}
                              </Badge>
                            ))}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-slate-400 text-center">
                        No {activeTab} personnel found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Add Personnel Button */}
      <div className="px-5 pt-4 pb-6 border-t border-gray-200 bg-white">
        <Button
          onClick={handleAddPersonnel}
          disabled={!selectedPerson || loading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white disabled:bg-slate-300"
          data-testid="add-personnels-btn"
        >
          {recurrence ? "Create Recurring Duty" : "Add Personnel"}
        </Button>
        <div className="h-8" />
      </div>

      {/* Recur Duty Modal */}
      <RecurDutyModal
        open={recurModalOpen}
        onClose={() => setRecurModalOpen(false)}
        onConfirm={handleRecurrenceConfirm}
        dutyName={dutyDisplayName}
      />
    </div>
  );
}
