import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Check } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AddSingleDutyModal({
  open,
  onOpenChange,
  selectedDate,
  onDutyAdded,
}) {
  const [duties, setDuties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newDutyName, setNewDutyName] = useState("");
  const [newDutyCode, setNewDutyCode] = useState("");
  const inputRef = useRef(null);

  // Fetch duties when modal opens or search changes
  useEffect(() => {
    if (!open) return;
    const fetchDuties = async () => {
      try {
        const res = await axios.get(`${API}/duties`, {
          params: searchQuery ? { search: searchQuery } : {},
        });
        setDuties(res.data);
      } catch (e) {
        console.error("Failed to fetch duties", e);
      }
    };
    fetchDuties();
  }, [open, searchQuery]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedDuty(null);
      setShowCreateNew(false);
      setNewDutyName("");
      setNewDutyCode("");
    }
  }, [open]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleAddDuty = async () => {
    if (!selectedDuty) return;
    setLoading(true);
    try {
      await axios.post(`${API}/schedule-duties`, {
        duty_id: selectedDuty.id,
        duty_name: selectedDuty.name,
        duty_code: selectedDuty.code,
        qualifications: selectedDuty.qualifications,
        date: selectedDate,
      });
      toast.success(`${selectedDuty.name} added to schedule`);
      onDutyAdded();
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to add duty");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewDuty = async () => {
    if (!newDutyName.trim() || !newDutyCode.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/duties`, {
        name: newDutyName.trim(),
        code: newDutyCode.trim(),
        qualifications: [],
      });
      setSelectedDuty(res.data);
      setShowCreateNew(false);
      toast.success(`Duty "${res.data.name}" created`);
      // Re-fetch duties to include the new one
      const dutiesRes = await axios.get(`${API}/duties`);
      setDuties(dutiesRes.data);
    } catch (e) {
      toast.error("Failed to create duty");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="add-single-duty-modal">
        <DialogHeader>
          <DialogTitle className="font-[Manrope] text-lg font-semibold text-slate-900">
            Add Single Duty
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Search and select a duty to add to the schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Duty Name Label */}
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5 block">
              Duty Name
            </label>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                ref={inputRef}
                placeholder="Search duties..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedDuty(null);
                }}
                className="pl-9 h-10 border-gray-200 focus-visible:ring-blue-500"
                data-testid="duty-search-input"
              />
            </div>
          </div>

          {/* Duty List */}
          {!showCreateNew && (
            <div
              className="border border-gray-200 rounded-md max-h-[200px] overflow-y-auto"
              data-testid="duty-list"
            >
              {duties.length > 0 ? (
                duties.map((duty) => (
                  <button
                    key={duty.id}
                    onClick={() => setSelectedDuty(duty)}
                    data-testid={`duty-option-${duty.id}`}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                      selectedDuty?.id === duty.id
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {selectedDuty?.id === duty.id && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-slate-700">
                        {duty.code}
                      </span>
                      <span className="text-sm text-slate-500">
                        {duty.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {duty.qualifications.map((q) => (
                        <Badge
                          key={q}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-5 bg-slate-100 text-slate-500 font-normal border-0"
                        >
                          {q}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-sm text-slate-400 text-center">
                  No duties found
                </div>
              )}

              {/* Create New Duty option */}
              <button
                onClick={() => {
                  setShowCreateNew(true);
                  setNewDutyName(searchQuery);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 border-t border-gray-200 text-left hover:bg-slate-50 transition-colors"
                data-testid="create-new-duty-button"
              >
                <span className="text-sm text-slate-400">Duty not found</span>
                <span className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600">
                  Create New Duty
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          )}

          {/* Create New Duty Form */}
          {showCreateNew && (
            <div className="border border-gray-200 rounded-md p-4 space-y-3" data-testid="create-duty-form">
              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1 block">
                  New Duty Name
                </label>
                <Input
                  value={newDutyName}
                  onChange={(e) => setNewDutyName(e.target.value)}
                  placeholder="e.g. Guard Duty - North Gate"
                  className="h-9 border-gray-200"
                  data-testid="new-duty-name-input"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1 block">
                  Duty Code
                </label>
                <Input
                  value={newDutyCode}
                  onChange={(e) => setNewDutyCode(e.target.value)}
                  placeholder="e.g. G4"
                  className="h-9 border-gray-200"
                  data-testid="new-duty-code-input"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateNew(false)}
                  data-testid="cancel-create-duty"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateNewDuty}
                  disabled={!newDutyName.trim() || !newDutyCode.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="confirm-create-duty"
                >
                  Create Duty
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="cancel-add-duty"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddDuty}
            disabled={!selectedDuty || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300"
            data-testid="confirm-add-duty"
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
