import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar as CalIcon,
  Clock,
  ArrowRight,
  Search,
  SlidersHorizontal,
  User,
  Users,
} from "lucide-react";

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
  const [selectedPersonnel, setSelectedPersonnel] = useState([]);
  const [loading, setLoading] = useState(false);

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
    if (!open) return;
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
  }, [open, searchQuery, activeTab]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedPersonnel([]);
      setAllDay(false);
    }
  }, [open]);

  const togglePersonnel = (person) => {
    setSelectedPersonnel((prev) => {
      const exists = prev.find((p) => p.id === person.id);
      if (exists) return prev.filter((p) => p.id !== person.id);
      return [...prev, person];
    });
  };

  const handleAddPersonnels = async () => {
    if (selectedPersonnel.length === 0) return;
    setLoading(true);
    try {
      const effectiveStart = allDay ? "0600" : startTime;
      const effectiveEnd = allDay ? "1800" : endTime;
      for (const person of selectedPersonnel) {
        await axios.post(`${API}/assignments`, {
          schedule_duty_id: duty.id,
          duty_code: duty.duty_code,
          duty_name: duty.duty_name,
          personnel_id: person.id,
          personnel_name: person.name,
          personnel_callsign: person.callsign,
          date: selectedDate,
          start_time: effectiveStart,
          end_time: effectiveEnd,
        });
      }
      toast.success(
        `${selectedPersonnel.length} personnel assigned to ${duty.duty_code}`
      );
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
          <p className="text-sm text-slate-500 mt-0.5">{duty.duty_code} {duty.duty_name.split(" - ")[1] || ""}</p>
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
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Recur Duty
            </span>
          </div>

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

        {/* Duties Section Header */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Duties</span>
          </div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Configure no. of personnels
          </span>
        </div>

        {/* Duty Name */}
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-slate-900">{duty.duty_code} {duty.duty_name.split(" - ")[1] || duty.duty_name}</h3>
        </div>

        {/* Personnel Section */}
        <div className="px-5 py-3 space-y-3">
          {/* Personnel Label */}
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Personnel</span>
          </div>

          {/* Search + Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="h-8 pl-8 text-sm border-gray-200"
                data-testid="personnel-search-input"
              />
            </div>
            <button
              className="h-8 w-8 flex items-center justify-center border border-gray-200 rounded hover:bg-slate-50 transition-colors"
              data-testid="personnel-filter-btn"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Available / Unavailable Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("available")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
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
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
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
          <div className="space-y-0 border border-gray-200 rounded-md overflow-hidden" data-testid="personnel-list">
            {personnel.length > 0 ? (
              personnel.map((person) => {
                const isSelected = selectedPersonnel.some((p) => p.id === person.id);
                return (
                  <button
                    key={person.id}
                    onClick={() => togglePersonnel(person)}
                    className={`w-full px-3 py-2.5 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                      isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                    data-testid={`personnel-${person.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {person.callsign}
                      </span>
                      <span className="text-xs text-slate-400">
                        Total Duties: {person.total_duties}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {person.qualifications.map((q) => (
                        <Badge
                          key={q}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-5 bg-slate-100 text-slate-500 font-normal border-0"
                        >
                          {q}
                        </Badge>
                      ))}
                    </div>
                    {isSelected && (
                      <div className="text-[10px] text-blue-600 mt-1 font-medium">
                        {person.name} - Selected
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-sm text-slate-400 text-center">
                No {activeTab} personnel found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Add Personnels Button */}
      <div className="px-5 pt-4 pb-6 border-t border-gray-200 bg-white">
        <Button
          onClick={handleAddPersonnels}
          disabled={selectedPersonnel.length === 0 || loading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white disabled:bg-slate-300"
          data-testid="add-personnels-btn"
        >
          Add Personnels{selectedPersonnel.length > 0 ? ` (${selectedPersonnel.length})` : ""}
        </Button>
        <div className="h-8" />
      </div>
    </div>
  );
}
