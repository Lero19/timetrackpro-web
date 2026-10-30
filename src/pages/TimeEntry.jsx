import { useEffect, useState } from "react";
import { api } from "../api";
import { Clock, CheckCircle2 } from "lucide-react";

export default function CaptureHours() {
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    workDate: "",
    clockIn: "09:00",
    clockOut: "17:00",
    breakMinutes: 30,
    notes: "",
  });

  useEffect(() => {
    api.get("/Employees")
      .then(res => setEmployees(res.data))
      .catch(error => console.error("Failed to load employees:", error));
  }, []);

  const loadEntries = (employeeId) => {
    api.get(`/TimeEntries/employee/${employeeId}`)
      .then(res => setEntries(res.data))
      .catch(error => console.error("Failed to load time entries:", error));
  };

  useEffect(() => {
    if (form.employeeId) loadEntries(form.employeeId);
  }, [form.employeeId]);

  const formatTimeForApi = (time) => (time && time.length === 5 ? `${time}:00` : time);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        employeeId: Number(form.employeeId),
        workDate: form.workDate,
        clockIn: formatTimeForApi(form.clockIn),
        clockOut: formatTimeForApi(form.clockOut),
        breakMinutes: Number(form.breakMinutes),
        notes: form.notes,
      };
      await api.post("/TimeEntries", payload);
      loadEntries(form.employeeId);
    } catch (error) {
      console.error("Failed to capture hours:", error);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Capture Hours</h1>
        <p className="text-gray-500 dark:text-slate-400">Daily time entry logging</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Log entry form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-gray-800 dark:text-white">Log Entry</h2>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <select
              className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2"
              required
              value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>

            <input
              type="date"
              className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2"
              required
              value={form.workDate}
              onChange={e => setForm({ ...form, workDate: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="time"
                className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2"
                value={form.clockIn}
                onChange={e => setForm({ ...form, clockIn: e.target.value })}
              />
              <input
                type="time"
                className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2"
                value={form.clockOut}
                onChange={e => setForm({ ...form, clockOut: e.target.value })}
              />
            </div>

            <input
              type="number"
              placeholder="Break (minutes)"
              className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2"
              value={form.breakMinutes}
              onChange={e => setForm({ ...form, breakMinutes: Number(e.target.value) })}
            />

            <input
              type="text"
              placeholder="Notes (optional)"
              className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Log Hours
            </button>
          </form>
        </div>

        {/* Recent entries */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 font-bold text-gray-800 dark:text-white">
            Recent Entries for Selected Employee
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-900/40">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300">Date</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300">Clock In</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300">Clock Out</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 text-right">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
                    {form.employeeId ? "No entries logged yet for this employee." : "Select an employee to see their recent entries."}
                  </td>
                </tr>
              )}
              {entries.map(en => (
                <tr key={en.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="px-6 py-3 text-gray-900 dark:text-white">{en.workDate}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-slate-400">{en.clockIn}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-slate-400">{en.clockOut}</td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900 dark:text-white">{en.hoursWorked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}