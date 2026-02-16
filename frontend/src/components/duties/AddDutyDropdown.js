import { useState } from "react";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddSingleDutyModal from "@/components/duties/AddSingleDutyModal";
import NewDutyGroupModal from "@/components/duties/NewDutyGroupModal";

export default function AddDutyDropdown({ selectedDate, onDutyAdded }) {
  const [showSingleDutyModal, setShowSingleDutyModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors cursor-pointer"
            data-testid="add-duty-button"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Duty
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onClick={() => setShowSingleDutyModal(true)}
            data-testid="add-single-duty-option"
            className="cursor-pointer"
          >
            <div>
              <div className="font-medium text-sm">Single Duty</div>
              <div className="text-xs text-slate-400">Add one duty to the schedule</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowGroupModal(true)}
            data-testid="add-group-duty-option"
            className="cursor-pointer"
          >
            <div>
              <div className="font-medium text-sm">Group of duties</div>
              <div className="text-xs text-slate-400">Create a duty group with multiple roles</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddSingleDutyModal
        open={showSingleDutyModal}
        onOpenChange={setShowSingleDutyModal}
        selectedDate={selectedDate}
        onDutyAdded={onDutyAdded}
      />

      <NewDutyGroupModal
        open={showGroupModal}
        onOpenChange={setShowGroupModal}
        selectedDate={selectedDate}
        onGroupCreated={onDutyAdded}
      />
    </>
  );
}
