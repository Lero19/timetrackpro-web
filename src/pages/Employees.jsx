import { useEffect, useState } from "react";
import { api } from "../api";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    fullName: "", role: "", payType: 0, rate: "", overtimeMultiplier: 1.5,
  });

  const load = () => api.get("/Employees").then(res => setEmployees(res.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post("/Employees", { ...form, rate: Number(form.rate) });
    setForm({ fullName: "", role: "", payType: 0, rate: "", overtimeMultiplier: 1.5 });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Employees</h1>

      <form onSubmit={submit} className="grid grid-cols-2 gap-3 bg-white p-4 rounded-xl shadow mb-6">
        <input className="border rounded-lg p-2 col-span-2" placeholder="Full name"
          value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
        <input className="border rounded-lg p-2" placeholder="Role"
          value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required />
        <select className="border rounded-lg p-2" value={form.payType}
          onChange={e => setForm({ ...form, payType: Number(e.target.value) })}>
          <option value={0}>Hourly</option>
          <option value={1}>Salaried</option>
        </select>
        <input type="number" step="0.01" className="border rounded-lg p-2" placeholder="Rate ($)"
          value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} required />
        <input type="number" step="0.1" className="border rounded-lg p-2" placeholder="OT multiplier"
          value={form.overtimeMultiplier} onChange={e => setForm({ ...form, overtimeMultiplier: Number(e.target.value) })} />
        <button className="col-span-2 bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700">
          Add Employee
        </button>
      </form>

      <div className="space-y-2">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-3 rounded-lg shadow flex justify-between">
            <div>
              <p className="font-semibold">{emp.fullName}</p>
              <p className="text-sm text-slate-500">{emp.role} · {emp.payType === 0 ? "Hourly" : "Salaried"}</p>
            </div>
            <p className="font-mono text-slate-700">${emp.rate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}