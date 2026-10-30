import { useEffect, useState } from "react";
import { api } from "../api";
import { Plus, Pencil, Trash2, X, Search, Filter, MoreVertical, Phone, Hash, Building2, CircleDot, Calendar, Wallet } from "lucide-react";

const PAGE_SIZE = 10;

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-600", "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600", "bg-rose-100 text-rose-600",
  "bg-sky-100 text-sky-600", "bg-purple-100 text-purple-600",
];

function avatarColor(name) {
  const sum = (name || "?").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initials(name) {
  return (name || "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function EmployeeManager() {
  const [employees, setEmployees] = useState([]);
  const [onLeaveCount, setOnLeaveCount] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openRowId, setOpenRowId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    fullName: "", role: "", department: "", payType: 0, rate: "", costRate: "", overtimeMultiplier: 1.5, isActive: true
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await api.get("/Employees");
    setEmployees(data);

    // Best-effort: counts employees currently on approved leave.
    // Safe to fail silently if the LeaveRequests shape differs.
    try {
      const { data: leave } = await api.get("/LeaveRequests");
      const today = new Date().toISOString().slice(0, 10);
      const active = leave.filter(l =>
        (l.status === "Approved" || l.status === 1) &&
        l.startDate <= today && l.endDate >= today
      );
      setOnLeaveCount(active.length);
    } catch {
      setOnLeaveCount(0);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ fullName: "", role: "", department: "", payType: 0, rate: "", costRate: "", overtimeMultiplier: 1.5, isActive: true });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({ ...emp, rate: (emp.rate ?? 0).toString(), costRate: (emp.costRate ?? 0).toString() });
    setShowModal(true);
    setOpenRowId(null);
  };

  const save = async () => {
    const payload = {
      ...form,
      rate: Number(form.rate),
      costRate: Number(form.costRate),
      overtimeMultiplier: Number(form.overtimeMultiplier)
    };
    if (editing) {
      await api.put(`/Employees/${editing.id}`, payload);
    } else {
      await api.post("/Employees", payload);
    }
    setShowModal(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this employee?")) return;
    await api.delete(`/Employees/${id}`);
    setOpenRowId(null);
    load();
  };

  const filtered = employees.filter(e =>
    `${e.fullName} ${e.role} ${e.department ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = employees.filter(e => e.isActive).length;
  const inactiveCount = employees.filter(e => !e.isActive).length;

  const stats = [
    { label: "Total Employees", value: employees.length, icon: Hash, color: "bg-indigo-50 text-indigo-600" },
    { label: "Active Employees", value: activeCount, icon: CircleDot, color: "bg-emerald-50 text-emerald-600" },
    { label: "On Leave", value: onLeaveCount, icon: Calendar, color: "bg-amber-50 text-amber-600" },
    { label: "Inactive", value: inactiveCount, icon: X, color: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Employees</h1>
          <p className="text-gray-500 dark:text-slate-400">Add, edit, and manage burn rates</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg ${s.color}`}><s.icon className="w-4 h-4" /></div>
              <p className="text-xs text-gray-500 dark:text-slate-400">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Employee List (Total {filtered.length})</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search employee here"
                className="pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700 border border-transparent focus:border-indigo-300 text-sm outline-none text-gray-700 dark:text-slate-200 w-56"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">ID</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Role</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Department</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Pay Rate</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-rose-500">Burn Rate</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/60">
              {pageItems.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/30 relative">
                  <td className="px-6 py-4 text-sm font-mono text-gray-400 dark:text-slate-500">
                    EMP-{String(emp.id).slice(-3).padStart(3, "0")}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setOpenRowId(openRowId === emp.id ? null : emp.id)} className="flex items-center gap-3 text-left">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor(emp.fullName)}`}>
                        {initials(emp.fullName)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{emp.fullName}</span>
                    </button>

                    {openRowId === emp.id && (
                      <div className="absolute z-20 mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-lg p-4">
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-slate-700">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${avatarColor(emp.fullName)}`}>
                            {initials(emp.fullName)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{emp.fullName}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">{emp.role}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-slate-500 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> ID</span><span className="text-gray-700 dark:text-slate-200">EMP-{String(emp.id).slice(-3).padStart(3, "0")}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-slate-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Department</span><span className="text-gray-700 dark:text-slate-200">{emp.department || "—"}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contact</span><span className="text-gray-700 dark:text-slate-200">—</span></div>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-slate-500 flex items-center gap-1.5"><CircleDot className="w-3.5 h-3.5" /> Status</span><span className={emp.isActive ? "text-emerald-600" : "text-gray-500"}>{emp.isActive ? "Active" : "Inactive"}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Join Date</span><span className="text-gray-700 dark:text-slate-200">—</span></div>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-slate-500 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Rate</span><span className="text-gray-700 dark:text-slate-200">R{emp.rate}</span></div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300 capitalize">{emp.role}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{emp.department || "—"}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">R{emp.rate}/hr</td>
                  <td className="px-6 py-4 text-rose-600 font-medium">R{emp.costRate}/hr</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(emp.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400 dark:text-slate-500 text-sm">No employees match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-5 border-t border-gray-100 dark:border-slate-700 text-sm text-gray-500 dark:text-slate-400">
          <span>Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40">Previous</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? "Edit" : "Add"} Employee</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Full Name" className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Role" className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
                <input placeholder="Department" className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2" value={form.payType} onChange={e => setForm({ ...form, payType: Number(e.target.value) })}>
                  <option value={0}>Hourly</option>
                  <option value={1}>Salaried</option>
                </select>
                <input placeholder="OT Multiplier" type="number" step="0.1" className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2" value={form.overtimeMultiplier} onChange={e => setForm({ ...form, overtimeMultiplier: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-slate-400">Pay Rate (R/hr)</label>
                  <input type="number" className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-rose-600 font-medium">Burn / Cost Rate (R/hr)</label>
                  <input type="number" className="w-full border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-3 py-2" value={form.costRate} onChange={e => setForm({ ...form, costRate: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                <span className="text-sm text-gray-700 dark:text-slate-300">Active employee</span>
              </label>
              <button onClick={save} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl">
                {editing ? "Update" : "Create"} Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}