import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X } from "lucide-react";
import AddDutyDropdown from "@/components/duties/AddDutyDropdown";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIME_SLOTS = [
  "0600", "0700", "0800", "0900", "1000", "1100",
  "1200", "1300", "1400", "1500", "1600", "1700", "1800",
];

function getAssignmentBlocks(assignments, dutyId) {
  return assignments.filter((a) => a.schedule_duty_id === dutyId);
}

function getBlockSpan(startTime, endTime) {
  const startIdx = TIME_SLOTS.indexOf(startTime);
  const endIdx = TIME_SLOTS.indexOf(endTime);
  if (startIdx < 0 || endIdx < 0) return null;
  return { startIdx, span: Math.max(1, endIdx - startIdx) };
}

// Inline reassign popover for clicking a personnel name
function ReassignPopover({ assignment, onReassign, onClose }) {
  const [search, setSearch] = useState("");
  const [personnel, setPersonnel] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const params = { available: true };
        if (search) params.search = search;
        const res = await axios.get(`${API}/personnel`, { params });
        setPersonnel(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPersonnel();
  }, [search]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleSelect = async (person) => {
    try {
      await axios.put(`${API}/assignments/${assignment.id}`, {
        personnel_id: person.id,
        personnel_name: person.name,
        personnel_callsign: person.callsign,
      });
      toast.success(`Reassigned to ${person.name}`);
      onReassign();
      onClose();
    } catch (e) {
      toast.error("Failed to reassign");
      console.error(e);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50"
      data-testid={`reassign-popover-${assignment.id}`}
    >
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full h-7 pl-7 pr-2 text-xs border border-gray-200 rounded bg-white outline-none focus:border-blue-400"
            autoFocus
            data-testid={`reassign-search-${assignment.id}`}
          />
        </div>
      </div>
      <div className="max-h-[180px] overflow-y-auto">
        {personnel.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelect(p)}
            className={`w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors border-b border-gray-50 last:border-b-0 ${
              p.id === assignment.personnel_id ? "bg-blue-50" : ""
            }`}
            data-testid={`reassign-option-${p.id}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">{p.callsign}</span>
              <span className="text-[10px] text-slate-400">Duties: {p.total_duties}</span>
            </div>
            <div className="flex gap-1 mt-0.5">
              {p.qualifications.slice(0, 3).map((q) => (
                <Badge
                  key={q}
                  variant="secondary"
                  className="text-[9px] px-1 py-0 h-4 bg-slate-100 text-slate-400 font-normal border-0"
                >
                  {q}
                </Badge>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CalendarGrid({
  scheduleDuties,
  selectedDate,
  onDutyAdded,
  onRemoveDuty,
  onCellClick,
  assignments = [],
  selectedSlot,
  onAssignmentUpdated,
  activeView = "Day",
  baseDate = new Date(),
}) {
  const [reassignBlock, setReassignBlock] = useState(null);

  // Generate week days for weekly view
  const getWeekDays = () => {
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  // Generate calendar days for monthly view
  const getMonthDays = () => {
    const monthStart = startOfMonth(baseDate);
    const monthEnd = endOfMonth(baseDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    
    // Get 6 weeks of days for consistent grid
    const days = [];
    let current = calendarStart;
    for (let i = 0; i < 42; i++) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  };

  // Get duties for a specific date
  const getDutiesForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return scheduleDuties.filter((d) => d.date === dateStr);
  };

  // Get assignments for a specific date
  const getAssignmentsForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return assignments.filter((a) => a.date === dateStr);
  };

  // Render Daily View
  if (activeView === "Day") {
    return (
      <DayView
        scheduleDuties={scheduleDuties}
        selectedDate={selectedDate}
        onDutyAdded={onDutyAdded}
        onRemoveDuty={onRemoveDuty}
        onCellClick={onCellClick}
        assignments={assignments}
        selectedSlot={selectedSlot}
        onAssignmentUpdated={onAssignmentUpdated}
        reassignBlock={reassignBlock}
        setReassignBlock={setReassignBlock}
      />
    );
  }

  // Render Weekly View
  if (activeView === "Week") {
    const weekDays = getWeekDays();
    
    return (
      <div className="calendar-scroll overflow-x-auto" data-testid="calendar-grid-week">
        <div className="min-w-[1000px]">
          {/* Week Header */}
          <div className="grid grid-cols-8 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="px-3 py-3 border-r border-gray-200 text-xs font-medium text-slate-500 uppercase tracking-wide">
              Duty
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`px-2 py-2 text-center border-r border-gray-100 ${
                  isToday(day) ? "bg-blue-50" : ""
                }`}
                data-testid={`week-header-${format(day, "yyyy-MM-dd")}`}
              >
                <div className="text-xs text-slate-500 uppercase">{format(day, "EEE")}</div>
                <div className={`text-lg font-semibold ${isToday(day) ? "text-blue-600" : "text-slate-800"}`}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Unique Duties across the week */}
          {(() => {
            const uniqueDuties = new Map();
            scheduleDuties.forEach((d) => {
              if (!uniqueDuties.has(d.duty_id)) {
                uniqueDuties.set(d.duty_id, d);
              }
            });
            const dutyList = Array.from(uniqueDuties.values());

            return (
              <>
                {dutyList.map((duty) => (
                  <div
                    key={duty.duty_id}
                    className="grid grid-cols-8 border-b border-gray-100 group"
                    data-testid={`week-duty-row-${duty.duty_id}`}
                  >
                    <div className="px-3 py-2.5 border-r border-gray-200 bg-white flex items-center justify-between">
                      <span className="duty-row-label text-xs font-medium text-slate-700 truncate" title={duty.duty_name}>
                        {duty.duty_code}
                      </span>
                    </div>
                    {weekDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const dayDuty = scheduleDuties.find(
                        (d) => d.duty_id === duty.duty_id && d.date === dateStr
                      );
                      const dayAssignments = assignments.filter(
                        (a) => a.schedule_duty_id === dayDuty?.id
                      );

                      return (
                        <div
                          key={day.toISOString()}
                          className={`border-r border-gray-50 min-h-[60px] p-1 cursor-pointer transition-colors ${
                            isToday(day) ? "bg-blue-50/30" : "bg-white hover:bg-slate-50"
                          }`}
                          onClick={() => dayDuty && onCellClick(dayDuty, "0800")}
                          data-testid={`week-cell-${duty.duty_id}-${dateStr}`}
                        >
                          {dayAssignments.slice(0, 2).map((a) => (
                            <div
                              key={a.id}
                              className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded mb-0.5 truncate"
                              title={`${a.personnel_name} ${a.start_time}-${a.end_time}`}
                            >
                              {a.personnel_callsign}
                            </div>
                          ))}
                          {dayAssignments.length > 2 && (
                            <div className="text-[9px] text-slate-400 px-1">
                              +{dayAssignments.length - 2} more
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Add Duty Row */}
                <div className="grid grid-cols-8 border-b border-gray-100">
                  <div className="px-3 py-2.5 border-r border-gray-200 bg-white">
                    <AddDutyDropdown
                      selectedDate={selectedDate}
                      onDutyAdded={onDutyAdded}
                    />
                  </div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className="border-r border-gray-50 min-h-[44px] bg-white"
                    />
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </div>
    );
  }

  // Render Monthly View
  if (activeView === "Month") {
    const monthDays = getMonthDays();
    const weekDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <div className="calendar-scroll overflow-auto p-4" data-testid="calendar-grid-month">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Month Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-slate-50">
            {weekDayNames.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wide border-r border-gray-100 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {monthDays.map((day, idx) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayDuties = getDutiesForDate(day);
              const dayAssignments = getAssignmentsForDate(day);
              const isCurrentMonth = isSameMonth(day, baseDate);
              const isSelectedDay = isSameDay(day, new Date(selectedDate));

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border-r border-b border-gray-100 p-1 transition-colors ${
                    !isCurrentMonth ? "bg-slate-50/50" : "bg-white"
                  } ${isToday(day) ? "bg-blue-50/50" : ""} ${
                    isSelectedDay ? "ring-2 ring-blue-500 ring-inset" : ""
                  } hover:bg-slate-50 cursor-pointer`}
                  onClick={() => {
                    if (dayDuties.length > 0) {
                      onCellClick(dayDuties[0], "0800");
                    }
                  }}
                  data-testid={`month-cell-${dateStr}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    !isCurrentMonth ? "text-slate-300" : isToday(day) ? "text-blue-600" : "text-slate-700"
                  }`}>
                    {format(day, "d")}
                  </div>
                  
                  {/* Duties & Assignments */}
                  <div className="space-y-0.5">
                    {dayDuties.slice(0, 3).map((duty) => {
                      const dutyAssignments = dayAssignments.filter(
                        (a) => a.schedule_duty_id === duty.id
                      );
                      return (
                        <div
                          key={duty.id}
                          className="text-[9px] px-1 py-0.5 rounded truncate bg-blue-100 text-blue-700"
                          title={`${duty.duty_code}: ${dutyAssignments.length} assigned`}
                        >
                          {duty.duty_code} ({dutyAssignments.length})
                        </div>
                      );
                    })}
                    {dayDuties.length > 3 && (
                      <div className="text-[9px] text-slate-400 px-1">
                        +{dayDuties.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Duty for current date */}
        <div className="mt-4">
          <AddDutyDropdown
            selectedDate={selectedDate}
            onDutyAdded={onDutyAdded}
          />
        </div>
      </div>
    );
  }

  return null;
}

// Extracted Day View Component
function DayView({
  scheduleDuties,
  selectedDate,
  onDutyAdded,
  onRemoveDuty,
  onCellClick,
  assignments,
  selectedSlot,
  onAssignmentUpdated,
  reassignBlock,
  setReassignBlock,
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
        {scheduleDuties.map((duty) => {
          const dutyAssignments = getAssignmentBlocks(assignments, duty.id);
          const coveredCols = new Set();
          const blocksByStart = {};
          dutyAssignments.forEach((a) => {
            const span = getBlockSpan(a.start_time, a.end_time);
            if (span) {
              if (!blocksByStart[span.startIdx]) blocksByStart[span.startIdx] = [];
              blocksByStart[span.startIdx].push({ ...a, ...span });
              for (let i = span.startIdx; i < span.startIdx + span.span; i++) {
                coveredCols.add(i);
              }
            }
          });

          const isGroup = duty.duty_type === "group";

          return (
            <div
              key={duty.id}
              className="grid grid-cols-[140px_repeat(13,1fr)] border-b border-gray-100 group"
              data-testid={`duty-row-${duty.id}`}
            >
              <div className="px-3 py-2.5 border-r border-gray-200 bg-white flex items-center justify-between">
                <span className="duty-row-label truncate" title={duty.duty_name}>
                  {isGroup ? duty.duty_name : (
                    <>
                      {duty.duty_code}{" "}
                      {duty.duty_name.split(" - ")[1]
                        ? `- ${duty.duty_name.split(" - ")[1]}`
                        : ""}
                    </>
                  )}
                </span>
                <button
                  onClick={() => onRemoveDuty(duty.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50"
                  data-testid={`remove-duty-${duty.id}`}
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </div>
              {TIME_SLOTS.map((t, colIdx) => {
                if (coveredCols.has(colIdx) && !blocksByStart[colIdx]) {
                  return (
                    <div
                      key={t}
                      className="border-r border-gray-50 grid-cell min-h-[44px] bg-white"
                    />
                  );
                }

                const blocks = blocksByStart[colIdx] || [];

                if (blocks.length > 0) {
                  return (
                    <div
                      key={t}
                      className="border-r border-gray-50 min-h-[44px] bg-white relative"
                    >
                      {blocks.map((block) => (
                        <div
                          key={block.id}
                          className="absolute inset-y-0.5 left-0 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 flex flex-col justify-center z-[5] cursor-pointer hover:bg-blue-100 transition-colors"
                          style={{ width: `calc(${block.span * 100}% - 2px)` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCellClick(duty, t);
                          }}
                          data-testid={`assignment-block-${block.id}`}
                          title={`${block.duty_code} ${block.start_time}-${block.end_time} ${block.personnel_name}`}
                        >
                          <div className="flex items-center gap-1 text-[10px] font-medium text-blue-700 truncate">
                            <span className="font-semibold">{block.duty_code}</span>
                            <span className="text-blue-500">{block.start_time}-{block.end_time}</span>
                          </div>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReassignBlock(
                                  reassignBlock === block.id ? null : block.id
                                );
                              }}
                              className="text-[11px] text-blue-600 truncate font-medium hover:underline"
                              data-testid={`personnel-name-${block.id}`}
                            >
                              {block.personnel_name}
                            </button>
                            {reassignBlock === block.id && (
                              <ReassignPopover
                                assignment={block}
                                onReassign={() => {
                                  onAssignmentUpdated?.();
                                }}
                                onClose={() => setReassignBlock(null)}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                const isSelected =
                  selectedSlot?.dutyId === duty.id && selectedSlot?.timeSlot === t;

                return (
                  <div
                    key={t}
                    onClick={() => onCellClick(duty, t)}
                    className={`border-r border-gray-50 grid-cell min-h-[44px] cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50" : "bg-white hover:bg-slate-50"
                    }`}
                    data-testid={`cell-${duty.id}-${t}`}
                  />
                );
              })}
            </div>
          );
        })}

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
        {Array.from({ length: Math.max(0, 8 - scheduleDuties.length) }).map(
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
