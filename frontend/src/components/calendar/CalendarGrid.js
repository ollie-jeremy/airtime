import { Plus, X } from "lucide-react";
import AddDutyDropdown from "@/components/duties/AddDutyDropdown";

const TIME_SLOTS = [
  "0600", "0700", "0800", "0900", "1000", "1100",
  "1200", "1300", "1400", "1500", "1600", "1700", "1800",
];

export default function CalendarGrid({
  scheduleDuties,
  selectedDate,
  onDutyAdded,
  onRemoveDuty,
}) {
  return (
    <div className="calendar-scroll overflow-x-auto" data-testid="calendar-grid">
      <div className="min-w-[1000px]">
        {/* Time Header Row */}
        <div className="grid grid-cols-[140px_repeat(13,1fr)] border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="px-3 py-2 border-r border-gray-200" />
          {TIME_SLOTS.map((t) => (
            <div
              key={t}
              className="px-2 py-2 text-center border-r border-gray-100 time-cell"
              data-testid={`time-header-${t}`}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Duty Rows */}
        {scheduleDuties.map((duty) => (
          <div
            key={duty.id}
            className="grid grid-cols-[140px_repeat(13,1fr)] border-b border-gray-100 group"
            data-testid={`duty-row-${duty.id}`}
          >
            <div className="px-3 py-2.5 border-r border-gray-200 bg-white flex items-center justify-between">
              <span className="duty-row-label truncate" title={duty.duty_name}>
                {duty.duty_code} {duty.duty_name.split(" - ")[1] ? `- ${duty.duty_name.split(" - ")[1]}` : ""}
              </span>
              <button
                onClick={() => onRemoveDuty(duty.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50"
                data-testid={`remove-duty-${duty.id}`}
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
            {TIME_SLOTS.map((t) => (
              <div
                key={t}
                className="border-r border-gray-50 grid-cell min-h-[44px] bg-white"
              />
            ))}
          </div>
        ))}

        {/* Add Duty Row */}
        <div className="grid grid-cols-[140px_repeat(13,1fr)] border-b border-gray-100">
          <div className="px-3 py-2.5 border-r border-gray-200 bg-white">
            <AddDutyDropdown
              selectedDate={selectedDate}
              onDutyAdded={onDutyAdded}
            />
          </div>
          {TIME_SLOTS.map((t) => (
            <div
              key={t}
              className="border-r border-gray-50 min-h-[44px] bg-white"
            />
          ))}
        </div>

        {/* Empty filler rows */}
        {Array.from({ length: Math.max(0, 10 - scheduleDuties.length) }).map(
          (_, i) => (
            <div
              key={`empty-${i}`}
              className="grid grid-cols-[140px_repeat(13,1fr)] border-b border-gray-50"
            >
              <div className="border-r border-gray-200 min-h-[44px] bg-white" />
              {TIME_SLOTS.map((t) => (
                <div
                  key={t}
                  className="border-r border-gray-50 min-h-[44px] bg-white"
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
