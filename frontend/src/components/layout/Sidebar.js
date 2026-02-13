import {
  Home,
  Calendar,
  Truck,
  ArrowLeftRight,
  Bell,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", icon: Home },
  { label: "Schedules", icon: Calendar, active: true },
  { label: "Movements", icon: Truck },
  { label: "Swaps", icon: ArrowLeftRight },
];

const BOTTOM_ITEMS = [
  { label: "Notification", icon: Bell },
  { label: "Profile", icon: User },
];

export default function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-30 flex flex-col w-16 lg:w-56 transition-all"
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200">
        <span className="font-bold text-lg tracking-tight font-[Manrope] text-slate-900 hidden lg:block">
          AT
        </span>
        <span className="font-bold text-lg tracking-tight font-[Manrope] text-slate-900 lg:hidden">
          AT
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                item.active
                  ? "bg-slate-100 text-slate-900 border-l-2 border-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="py-3 px-2 border-t border-gray-200 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
