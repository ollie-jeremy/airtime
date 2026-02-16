import { useState, useEffect } from "react";
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
import { Plus, MinusCircle } from "lucide-react";

export default function ConfigureDutiesModal({ open, onOpenChange, initialDuties, onSave }) {
  const [rows, setRows] = useState([{ name: "", count: 1 }]);

  useEffect(() => {
    if (open && initialDuties && initialDuties.length > 0) {
      setRows(initialDuties.map((d) => ({ name: d.name, count: d.count })));
    } else if (open) {
      setRows([{ name: "", count: 1 }]);
    }
  }, [open, initialDuties]);

  const addRow = () => {
    setRows((prev) => [...prev, { name: "", count: 1 }]);
  };

  const removeRow = (idx) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx, field, value) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, [field]: field === "count" ? Math.max(1, parseInt(value) || 1) : value } : r
      )
    );
  };

  const handleSave = () => {
    const valid = rows.filter((r) => r.name.trim());
    if (valid.length === 0) return;
    onSave(valid);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="configure-duties-modal">
        <DialogHeader>
          <DialogTitle className="font-[Manrope] text-lg font-semibold text-slate-900">
            Configure and Add Duties
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Define duty roles and the number of personnel needed for each.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {/* Table Header */}
          <div className="grid grid-cols-[32px_1fr_100px_36px] gap-2 px-1 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            <div />
            <div>Duty Name</div>
            <div>No. of personnels</div>
            <div />
          </div>

          {/* Table Rows */}
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[32px_1fr_100px_36px] gap-2 items-center border border-gray-100 rounded-md px-1 py-1.5"
              data-testid={`config-row-${idx}`}
            >
              <span className="text-sm text-slate-400 text-center">{idx + 1}</span>
              <Input
                value={row.name}
                onChange={(e) => updateRow(idx, "name", e.target.value)}
                placeholder="e.g. Pilot"
                className="h-8 text-sm border-gray-200"
                data-testid={`config-duty-name-${idx}`}
              />
              <Input
                type="number"
                min={1}
                value={row.count}
                onChange={(e) => updateRow(idx, "count", e.target.value)}
                className="h-8 text-sm border-gray-200 text-center"
                data-testid={`config-duty-count-${idx}`}
              />
              <button
                onClick={() => removeRow(idx)}
                disabled={rows.length <= 1}
                className="p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-30"
                data-testid={`config-remove-row-${idx}`}
              >
                <MinusCircle className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ))}

          {/* Add Row */}
          <button
            onClick={addRow}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-200 rounded-md text-sm text-slate-400 hover:text-slate-600 hover:border-gray-300 transition-colors"
            data-testid="config-add-row-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Duty
          </button>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="config-cancel-btn">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={rows.every((r) => !r.name.trim())}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="config-save-btn"
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
