import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Search } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PersonnelDropdown({ value, onSelect, testId }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [personnel, setPersonnel] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
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
  }, [open, search]);

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
        className={`w-full h-8 px-2.5 flex items-center justify-between border rounded text-sm transition-colors ${
          value
            ? "border-gray-200 bg-white text-slate-700"
            : "border-gray-200 bg-white text-slate-400"
        }`}
        data-testid={testId}
      >
        <span className="truncate">{value ? value.name : "Personnel"}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[220px] overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full h-7 pl-7 pr-2 text-xs border border-gray-200 rounded bg-white outline-none focus:border-blue-400"
                autoFocus
                data-testid={`${testId}-search`}
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {personnel.length > 0 ? (
              personnel.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors border-b border-gray-50 last:border-b-0"
                  data-testid={`${testId}-option-${p.id}`}
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
              ))
            ) : (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">No personnel found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
