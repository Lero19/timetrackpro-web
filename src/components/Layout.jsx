import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, FileText, Receipt, CalendarDays, Search, Bell, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from "../context/ThemeContext";

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/employees', label: 'Employees' },
  { to: '/capture', label: 'Capture Hours' },
  { to: '/timesheets', label: 'Timesheets' },
  { to: '/payslips', label: 'Payslips' },
  { to: '/leave', label: 'Leave' },
];

export default function Layout() {
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-4 h-4 text-white dark:text-slate-900" />
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-gray-50 dark:bg-slate-800 rounded-full p-1">
              {nav.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Search anything"
                className="pl-9 pr-4 py-2 rounded-full bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-indigo-300 text-sm outline-none text-gray-700 dark:text-slate-200 w-52"
              />
            </div>
            <button onClick={toggle} className="p-2 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              {dark ? <Sun className="w-5 h-5 text-gray-500 dark:text-slate-400" /> : <Moon className="w-5 h-5 text-gray-500 dark:text-slate-400" />}
            </button>
            <button className="relative p-2 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              TT
            </div>
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="md:hidden flex gap-1 overflow-x-auto px-6 pb-3">
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}