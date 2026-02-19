import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Search } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PersonnelDropdown({ value, onSelect, testId, showTabs = true }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [personnel, setPersonnel] = useState([]);
  const [activeTab, setActiveTab] = useState("available");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const fetchPersonnel = async () => {
      try {
        const params = {};
        if (search) params.search = search;
        if (showTabs) {
          params.available = activeTab === "available";
        } else {
          params.available = true;
        }
        const res = await axios.get(`${API}/personnel`, { params });
        setPersonnel(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPersonnel();
  }, [open, search, activeTab, showTabs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (person) => {
    onSelect(person);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full h-10 px-3 flex items-center justify-between border rounded-md text-sm transition-colors ${
          value
            ? "border-gray-200 bg-white text-slate-700"
            : "border-gray-200 bg-white text-slate-400"
        }`}
        data-testid={testId}
      >
        <span className="truncate">{value ? value.name : "Personnel"}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full h-8 pl-8 pr-2 text-sm border border-gray-200 rounded bg-white outline-none focus:border-blue-400"
                autoFocus
                data-testid={`${testId}-search`}
              />
            </div>
          </div>

          {/* Available / Unavailable Tabs */}
          {showTabs && (
            <div className="flex border-b border-gray-200 px-2">
              <button
                onClick={() => setActiveTab("available")}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === "available"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                data-testid={`${testId}-tab-available`}
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
                data-testid={`${testId}-tab-unavailable`}
              >
                Unavailable
              </button>
            </div>
          )}

          {/* Personnel List */}
          <div className="overflow-y-auto max-h-[240px]">
            {personnel.length > 0 ? (
              personnel.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-colors border-b border-gray-50 last:border-b-0"
                  data-testid={`${testId}-option-${p.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{p.callsign}</span>
                    <span className="text-xs text-slate-400">Duties: {p.total_duties}</span>
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {p.qualifications.slice(0, 3).map((q) => (
                      <Badge
                        key={q}
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 h-5 bg-slate-100 text-slate-400 font-normal border-0"
                      >
                        {q}
                      </Badge>
                    ))}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-slate-400 text-center">
                No {showTabs ? activeTab : ""} personnel found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
