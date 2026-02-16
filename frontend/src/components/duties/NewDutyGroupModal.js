import { useState, useEffect } from "react";
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NewDutyGroupModal({ open, onOpenChange, selectedDate, onGroupCreated }) {
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) setGroupName("");
  }, [open]);

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${API}/schedule-duties`, {
        duty_id: `group-${Date.now()}`,
        duty_name: groupName.trim(),
        duty_code: "",
        duty_type: "group",
        qualifications: [],
        date: selectedDate,
      });
      toast.success(`Duty group "${groupName.trim()}" created`);
      onGroupCreated();
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to create duty group");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-testid="new-duty-group-modal">
        <DialogHeader>
          <DialogTitle className="font-[Manrope] text-lg font-semibold text-slate-900">
            New Duty Group
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Enter a name for the duty group.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5 block">
            Name
          </label>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Fly Plane Team"
            className="border-gray-200"
            data-testid="group-name-input"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="cancel-group-btn">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!groupName.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="create-group-btn"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
