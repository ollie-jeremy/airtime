import { Button } from "@/components/ui/button";
import {
  Sparkles,
  MoreHorizontal,
  CheckCircle,
  Upload,
  Users,
  UserPlus,
} from "lucide-react";

export default function Header() {
  return (
    <header
      className="bg-white border-b border-gray-200 sticky top-0 z-20"
      data-testid="header"
    >
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Breadcrumbs & Tabs */}
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            All Schedules / PRISM 123
          </span>
          <div className="flex items-center gap-4 mt-1">
            <h1 className="text-xl font-bold tracking-tight font-[Manrope] text-slate-900">
              PRISM 123
            </h1>
            <div className="flex items-center gap-1 text-sm">
              <button
                className="px-3 py-1 text-slate-900 font-medium border-b-2 border-blue-600"
                data-testid="tab-calendar"
              >
                Calendar
              </button>
              <button
                className="px-3 py-1 text-slate-400 font-medium hover:text-slate-600 transition-colors"
                data-testid="tab-swaps"
              >
                Swaps
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="auto-assign-btn">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto-Assign</span>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" data-testid="more-btn">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" data-testid="validate-btn">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Validate</span>
          </Button>
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800" data-testid="publish-btn">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Publish</span>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" data-testid="users-btn">
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" data-testid="invite-btn">
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
