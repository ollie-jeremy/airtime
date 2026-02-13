import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  SlidersHorizontal,
  Settings2,
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";

export default function CalendarControls({
  selectedDate,
  onDateChange,
  activeView,
  onViewChange,
}) {
  const views = ["Day", "Week", "Month"];

  return (
    <div
      className="flex items-center justify-between px-6 py-3 bg-slate-50/50 border-b border-gray-200"
      data-testid="calendar-controls"
    >
      {/* Left: Date Navigation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-white border border-gray-200 rounded-md">
          <button
            className="px-2 py-1.5 hover:bg-slate-50 transition-colors rounded-l-md"
            onClick={() => onDateChange(subDays(selectedDate, 1))}
            data-testid="prev-date-btn"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-x border-gray-200">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700" data-testid="current-date">
              {format(selectedDate, "EEE MMM d, yyyy")}
            </span>
          </div>
          <button
            className="px-2 py-1.5 hover:bg-slate-50 transition-colors rounded-r-md"
            onClick={() => onDateChange(addDays(selectedDate, 1))}
            data-testid="next-date-btn"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-sm"
          onClick={() => onDateChange(new Date())}
          data-testid="today-btn"
        >
          Today
        </Button>

        <Button variant="outline" size="sm" className="text-sm" data-testid="filter-btn">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
        </Button>
      </div>

      {/* Right: View Controls */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="text-sm" data-testid="calendar-settings-btn">
          <Settings2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Calendar View Settings</span>
        </Button>

        <div className="flex bg-white border border-gray-200 rounded-md overflow-hidden">
          {views.map((v) => (
            <button
              key={v}
              data-testid={`view-${v.toLowerCase()}-btn`}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                activeView === v
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
