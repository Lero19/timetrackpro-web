import { useEffect, useState } from "react";
import { api } from "../api";
import { Clock, CheckCircle } from "lucide-react";

export default function CaptureHours() {
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    employeeId: "", workDate: "", clockIn: "09:00", clockOut: "17:00", breakMinutes: 30, notes: ""
  });

  useEffect(() => {
    api.get("/Employees").then(r => setEmployees(r.data));
  }, []);

  const loadEntries = (employeeId) => {
    if (!employeeId) return;
    api.get(`/TimeEntries/employee/${employeeId}`).then(r => setEntries(r.data));
  };

  useEffect(() => {
    if (form.employeeId) loadEntries(form.employeeId);
  }, [form.employeeId]);

  const formatTime = (time) => time.length === 5 ? `${time}:00` : time;

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      employeeId: Number(form.employeeId),
      workDate: form.workDate,
      clockIn: formatTime(form.clockIn),
      clockOut: formatTime(form.clockOut),
      breakMinutes: Number(form.breakMinutes),
      notes: form.notes,
    };
    await api.post("/TimeEntries", payload);
    loadEntries(form.employeeId);
    setForm({ employeeId: form.employeeId, workDate: "", clockIn: "09:00", clockOut: "17:00", breakMinutes: 30, notes: "" });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Capture Hours</h1>
        <p className="text-gray-500">Daily time entry logging</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-gray-800">Log Entry</h2>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <select className="w-full border rounded-lg px-3 py-2" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required>
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={form.workDate} onChange={e => setForm({...form, workDate: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
              <input type="time" className="w-full border rounded-lg px-3 py-2" value={form.clockIn} onChange={e => setForm({...form, clockIn: e.target.value})} />
              <input type="time" className="w-full border rounded-lg px-3 py-2" value={form.clockOut} onChange={e => setForm({...form, clockOut: e.target.value})} />
            </div>
            <input type="number" placeholder="Break (minutes)" className="w-full border rounded-lg px-3 py-2" value={form.breakMinutes} onChange={e => setForm({...form, breakMinutes: e.target.value})} />
            <input type="text" placeholder="Notes (optional)" className="w-full border rounded-lg px-3 py-2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Log Hours
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b font-bold text-gray-800">Recent Entries for Selected Employee</div>
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Clock In</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Clock Out</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">{e.workDate}</td>
                  <td className="px-6 py-3 text-gray-600">{e.clockIn}</td>
                  <td className="px-6 py-3 text-gray-600">{e.clockOut}</td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900">{e.hoursWorked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}