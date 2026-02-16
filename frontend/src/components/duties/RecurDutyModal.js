import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Repeat, Calendar as CalIcon } from "lucide-react";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

export default function RecurDutyModal({ open, onClose, onConfirm, dutyName }) {
  const [frequency, setFrequency] = useState("weekly");
  const [interval, setInterval] = useState(1);
  const [endType, setEndType] = useState("occurrences");
  const [occurrences, setOccurrences] = useState(4);
  const [endDate, setEndDate] = useState("");
  const [customDays, setCustomDays] = useState([]);

  const toggleCustomDay = (day) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleConfirm = () => {
    const recurrence = {
      frequency,
      interval: frequency === "custom" ? 1 : interval,
      end_type: endType,
      occurrences: endType === "occurrences" ? occurrences : null,
      end_date: endType === "date" ? endDate : null,
      custom_days: frequency === "custom" ? customDays : [],
    };
    onConfirm(recurrence);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="recur-duty-modal">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold font-[Manrope] text-slate-900">
              Recur Duty
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 transition-colors"
            data-testid="close-recur-modal-btn"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-5">
          {/* Duty Name Display */}
          {dutyName && (
            <div className="p-3 bg-slate-50 rounded-md">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Recurring</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{dutyName}</p>
            </div>
          )}

          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Frequency</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFrequency(f.value)}
                  className={`px-2 py-1.5 text-xs rounded border transition-colors ${
                    frequency === f.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-gray-200 hover:bg-slate-50"
                  }`}
                  data-testid={`freq-${f.value}-btn`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Days (only show when custom is selected) */}
          {frequency === "custom" && (
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Repeat on</Label>
              <div className="flex gap-1.5">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleCustomDay(day.value)}
                    className={`w-10 h-8 text-xs rounded border transition-colors ${
                      customDays.includes(day.value)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-gray-200 hover:bg-slate-50"
                    }`}
                    data-testid={`day-${day.value}-btn`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interval (not shown for custom) */}
          {frequency !== "custom" && frequency !== "biweekly" && (
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">
                Repeat every
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-9 text-sm"
                  data-testid="interval-input"
                />
                <span className="text-sm text-slate-600">
                  {frequency === "daily" && (interval === 1 ? "day" : "days")}
                  {frequency === "weekly" && (interval === 1 ? "week" : "weeks")}
                  {frequency === "monthly" && (interval === 1 ? "month" : "months")}
                </span>
              </div>
            </div>
          )}

          {/* End Condition */}
          <div className="space-y-3">
            <Label className="text-sm text-slate-600">Ends</Label>
            <div className="space-y-2">
              {/* Never */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === "never"}
                  onChange={() => setEndType("never")}
                  className="w-4 h-4 text-blue-600"
                  data-testid="end-never-radio"
                />
                <span className="text-sm text-slate-700">Never (creates up to 90 days)</span>
              </label>

              {/* After X occurrences */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === "occurrences"}
                  onChange={() => setEndType("occurrences")}
                  className="w-4 h-4 text-blue-600"
                  data-testid="end-occurrences-radio"
                />
                <span className="text-sm text-slate-700">After</span>
                <Input
                  type="number"
                  min={1}
                  max={52}
                  value={occurrences}
                  onChange={(e) => setOccurrences(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-8 text-sm"
                  disabled={endType !== "occurrences"}
                  data-testid="occurrences-input"
                />
                <span className="text-sm text-slate-700">occurrences</span>
              </label>

              {/* On specific date */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === "date"}
                  onChange={() => setEndType("date")}
                  className="w-4 h-4 text-blue-600"
                  data-testid="end-date-radio"
                />
                <span className="text-sm text-slate-700">On</span>
                <div className="relative">
                  <CalIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40 h-8 pl-8 text-sm"
                    disabled={endType !== "date"}
                    data-testid="end-date-input"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-sm"
            data-testid="cancel-recur-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
            disabled={frequency === "custom" && customDays.length === 0}
            data-testid="confirm-recur-btn"
          >
            Set Recurrence
          </Button>
        </div>
      </div>
    </div>
  );
}
