import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { Users, Clock, DollarSign, TrendingUp, MoreHorizontal, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

function AnimatedNumber({ value, format = (v) => v }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const start = performance.now();
    let frame;
    const step = (now) => {
      const progress = Math.min((now - start) / 700, 1);
      setDisplay(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{format(display)}</>;
}

const CardShell = ({ title, subtitle, children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 ${className}`}
  >
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <button className="text-gray-300 dark:text-slate-600 hover:text-gray-500">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
    {children}
  </motion.div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState([]);
  const [payrollTrend, setPayrollTrend] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [s, a, p] = await Promise.allSettled([
        api.get("/Dashboard/stats"),
        api.get("/Clock/active"),
        api.get("/Dashboard/payroll-trend?monthsBack=6"),
      ]);
      if (cancelled) return;
      if (s.status === "fulfilled") setStats(s.value.data);
      if (a.status === "fulfilled") setActive(a.value.data ?? []);
      if (p.status === "fulfilled") {
        setPayrollTrend((p.value.data ?? []).map(r => ({
          ...r, grossPay: Number(r.grossPay) || 0, netPay: Number(r.netPay) || 0,
          paye: Number(r.paye) || 0, uif: Number(r.uif) || 0,
        })));
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (!stats) return <div className="text-center py-20 text-gray-400 dark:text-slate-500">Loading analytics…</div>;

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const EXPECTED_START_MINUTES = 8 * 60 + 15; // 08:15 — treat later clock-ins as "Late"

  const cards = [
    { label: "Total Employees", value: stats.totalEmployees, icon: Users, color: "bg-indigo-50 text-indigo-600", fmt: v => Math.round(v) },
    { label: "Hours This Month", value: stats.hoursThisMonth, icon: Clock, color: "bg-emerald-50 text-emerald-600", fmt: v => v.toFixed(1) },
    { label: "Labor Cost", value: stats.totalLaborCost, icon: DollarSign, color: "bg-amber-50 text-amber-600", fmt: v => `R${Math.round(v).toLocaleString()}` },
    { label: "Profit Margin", value: stats.profitMargin, icon: TrendingUp, color: "bg-rose-50 text-rose-600", fmt: v => `${v.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hello, Admin</h1>
          <p className="text-gray-400 dark:text-slate-500 mt-1">It's {dateLabel}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/capture" className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Capture Hours
          </Link>
          <Link to="/employees" className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Employee
          </Link>
          <Link to="/payslips" className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New Payslip
          </Link>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{c.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              <AnimatedNumber value={c.value} format={c.fmt} />
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardShell title="Workforce performance" subtitle="Hours worked by top employees" delay={0.2} className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topEmployees ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-slate-700" />
                <XAxis dataKey="name" stroke="currentColor" tick={{ fontSize: 12 }} className="text-gray-500 dark:text-slate-400" />
                <YAxis stroke="currentColor" tick={{ fontSize: 12 }} className="text-gray-500 dark:text-slate-400" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="hours" name="Hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardShell>

        <CardShell title="On site now" subtitle={`${active.length} currently clocked in`} delay={0.25}>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            <AnimatePresence>
              {active.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-slate-500 py-10 text-center">Nobody clocked in right now.</p>
              )}
              {active.map(emp => (
                <motion.div
                  key={emp.employeeId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm shrink-0">
                    {(emp.employeeName ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{emp.employeeName}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{emp.role}</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{emp.clockIn}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardShell>
      </div>

      {/* Employer attendance — styled table like the reference */}
      <CardShell title="Employee attendance" subtitle="Who's clocked in today, and when" delay={0.3}>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                <th className="px-6 py-2">Employee</th>
                <th className="px-6 py-2">Role</th>
                <th className="px-6 py-2">Clock in</th>
                <th className="px-6 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/60">
              {active.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400 dark:text-slate-500">No attendance recorded yet today.</td></tr>
              )}
              {active.map(emp => {
                const [h, m] = emp.clockIn.split(":").map(Number);
                const isLate = h * 60 + m > EXPECTED_START_MINUTES;
                return (
                  <tr key={emp.employeeId} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{emp.employeeName}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-slate-400">{emp.role}</td>
                    <td className="px-6 py-3 font-mono text-gray-700 dark:text-slate-300">{emp.clockIn}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isLate ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isLate ? "bg-rose-500" : "bg-indigo-500"}`} />
                        {isLate ? "Late" : "On-time"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardShell>

      <CardShell title="Payroll cost trend" subtitle="Total employer cost per month" delay={0.35}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={payrollTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-slate-700" />
            <XAxis dataKey="monthLabel" stroke="currentColor" tick={{ fontSize: 12 }} className="text-gray-500 dark:text-slate-400" />
            <YAxis stroke="currentColor" tick={{ fontSize: 12 }} tickFormatter={v => `R${(v / 1000).toFixed(0)}k`} className="text-gray-500 dark:text-slate-400" />
            <Tooltip
              formatter={(v) => [`R${Number(v).toLocaleString()}`, "Total cost"]}
              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
            />
            <Bar dataKey="grossPay" name="Total cost" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
    </div>
  );
}