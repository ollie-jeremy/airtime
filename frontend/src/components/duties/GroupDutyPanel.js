import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  X,
  Calendar as CalIcon,
  Clock,
  ArrowRight,
  Users,
  User,
  ImageIcon,
  Settings2,
} from "lucide-react";
import ConfigureDutiesModal from "@/components/duties/ConfigureDutiesModal";
import PersonnelDropdown from "@/components/duties/PersonnelDropdown";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIME_OPTIONS = [
  "0600", "0700", "0800", "0900", "1000", "1100",
  "1200", "1300", "1400", "1500", "1600", "1700", "1800",
];

export default function GroupDutyPanel({
  open,
  onClose,
  duty,
  selectedDate,
  clickedTimeSlot,
  onAssignmentCreated,
  assignments = [],
}) {
  const [startTime, setStartTime] = useState("0600");
  const [endTime, setEndTime] = useState("0800");
  const [allDay, setAllDay] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  // Slot assignments: { "Pilot-0": { personnelId, name, callsign }, ... }
  const [slotAssignments, setSlotAssignments] = useState({});

  useEffect(() => {
    if (clickedTimeSlot) {
      setStartTime(clickedTimeSlot);
      const idx = TIME_OPTIONS.indexOf(clickedTimeSlot);
      if (idx >= 0 && idx < TIME_OPTIONS.length - 1) {
        setEndTime(TIME_OPTIONS[Math.min(idx + 2, TIME_OPTIONS.length - 1)]);
      }
    }
  }, [clickedTimeSlot]);

  // Fetch group config
  const fetchConfig = useCallback(async () => {
    if (!duty) return;
    try {
      const res = await axios.get(`${API}/duty-group-configs/${duty.id}`);
      setConfig(res.data);
    } catch (e) {
      if (e.response?.status !== 404) console.error(e);
      setConfig(null);
    }
  }, [duty]);

  useEffect(() => {
    if (open && duty) fetchConfig();
  }, [open, duty, fetchConfig]);

  // Build slotAssignments from existing assignments
  useEffect(() => {
    if (!config || !assignments.length) return;
    const dutyAssignments = assignments.filter(
      (a) => a.schedule_duty_id === duty?.id
    );
    const slots = {};
    dutyAssignments.forEach((a) => {
      const key = `${a.sub_duty_name}-${a.slot_index}`;
      slots[key] = {
        assignmentId: a.id,
        personnelId: a.personnel_id,
        name: a.personnel_name,
        callsign: a.personnel_callsign,
      };
    });
    setSlotAssignments(slots);
  }, [config, assignments, duty]);

  useEffect(() => {
    if (!open) {
      setSlotAssignments({});
    }
  }, [open]);

  const handleConfigSave = async (duties) => {
    try {
      await axios.post(`${API}/duty-group-configs`, {
        schedule_duty_id: duty.id,
        duties: duties,
      });
      toast.success("Duties configured");
      fetchConfig();
    } catch (e) {
      toast.error("Failed to save configuration");
      console.error(e);
    }
  };

  const handleSlotAssign = (subDutyName, slotIndex, person) => {
    const key = `${subDutyName}-${slotIndex}`;
    setSlotAssignments((prev) => ({
      ...prev,
      [key]: {
        personnelId: person.id,
        name: person.name,
        callsign: person.callsign,
      },
    }));
  };

  const handleAddDuty = async () => {
    setLoading(true);
    try {
      const effectiveStart = allDay ? "0600" : startTime;
      const effectiveEnd = allDay ? "1800" : endTime;
      let created = 0;

      for (const [key, slot] of Object.entries(slotAssignments)) {
        if (slot.assignmentId) continue; // Already saved
        const [subDutyName, slotIdx] = key.split("-");
        await axios.post(`${API}/assignments`, {
          schedule_duty_id: duty.id,
          duty_code: duty.duty_code || duty.duty_name,
          duty_name: duty.duty_name,
          personnel_id: slot.personnelId,
          personnel_name: slot.name,
          personnel_callsign: slot.callsign,
          date: selectedDate,
          start_time: effectiveStart,
          end_time: effectiveEnd,
          sub_duty_name: subDutyName,
          slot_index: parseInt(slotIdx),
        });
        created++;
      }
      if (created > 0) {
        toast.success(`${created} personnel assigned to ${duty.duty_name}`);
        onAssignmentCreated();
      }
      onClose();
    } catch (e) {
      toast.error("Failed to assign personnel");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !duty) return null;

  const dateObj = new Date(selectedDate + "T00:00:00");
  const dateDisplay = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const hasConfig = config && config.duties && config.duties.length > 0;
  const hasNewSlots = Object.entries(slotAssignments).some(([, s]) => !s.assignmentId);

  return (
    <div
      className="w-[340px] border-l border-gray-200 bg-white h-full flex flex-col shrink-0 overflow-hidden"
      data-testid="group-duty-panel"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold font-[Manrope] text-slate-900">
            Add Duties
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{duty.duty_name}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 transition-colors"
          data-testid="close-group-panel-btn"
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
              data-testid="group-start-time"
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
              data-testid="group-end-time"
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
                data-testid="group-all-day-toggle"
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

        {/* Duties Section */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Duties</span>
          </div>
          {hasConfig && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold hover:text-blue-600 transition-colors"
              data-testid="reconfigure-duties-btn"
            >
              Configure Duties
            </button>
          )}
        </div>

        {/* Duty Content */}
        <div className="px-5 py-4">
          {!hasConfig ? (
            /* Empty state */
            <div className="text-center space-y-4" data-testid="no-duties-state">
              <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">No Duties</p>
              <Button
                variant="outline"
                onClick={() => setShowConfigModal(true)}
                className="w-full"
                data-testid="configure-add-duties-btn"
              >
                <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                Configure and Add Duties
              </Button>
            </div>
          ) : (
            /* Configured duties with personnel slots */
            <div className="space-y-4" data-testid="configured-duties-list">
              {config.duties.map((dutyItem) => (
                <div
                  key={dutyItem.name}
                  className="border border-gray-200 rounded-lg p-3 space-y-2"
                  data-testid={`duty-config-${dutyItem.name}`}
                >
                  <h4 className="text-sm font-semibold text-slate-900">{dutyItem.name}</h4>
                  {Array.from({ length: dutyItem.count }).map((_, slotIdx) => {
                    const key = `${dutyItem.name}-${slotIdx}`;
                    const assigned = slotAssignments[key];
                    return (
                      <div key={slotIdx} className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <PersonnelDropdown
                          value={assigned}
                          onSelect={(person) => handleSlotAssign(dutyItem.name, slotIdx, person)}
                          testId={`slot-${dutyItem.name}-${slotIdx}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        {hasConfig && (
          <div className="px-5 py-3 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm text-slate-500">Location</span>
            </div>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="h-8 text-sm border-gray-200"
              data-testid="group-location-input"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pt-4 pb-6 border-t border-gray-200 bg-white">
        <Button
          onClick={handleAddDuty}
          disabled={!hasNewSlots || loading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white disabled:bg-slate-300"
          data-testid="group-add-duty-btn"
        >
          Add Duty
        </Button>
        <div className="h-8" />
      </div>

      <ConfigureDutiesModal
        open={showConfigModal}
        onOpenChange={setShowConfigModal}
        initialDuties={config?.duties}
        onSave={handleConfigSave}
      />
    </div>
  );
}
