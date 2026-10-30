import { useEffect, useState } from 'react';
import {api} from '../api';
import { CalendarDays, CheckCircle, XCircle } from 'lucide-react';

export default function LeaveManager() {
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ employeeId: '', type: 0, startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data));
    load();
  }, []);

  const load = async () => {
    const { data } = await api.get('/leaverequests');
    setRequests(data);
  };

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/leaverequests', {
      ...form,
      employeeId: Number(form.employeeId)
    });
    setForm({ employeeId: '', type: 0, startDate: '', endDate: '', reason: '' });
    load();
  };

  const typeLabel = (t) => ['Annual', 'Sick', 'Family', 'Unpaid'][t] || 'Other';
  const statusBadge = (s) => {
    const styles = {
      0: 'bg-amber-100 text-amber-700',
      1: 'bg-green-100 text-green-700',
      2: 'bg-red-100 text-red-700'
    };
    const labels = { 0: 'Pending', 1: 'Approved', 2: 'Rejected' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[s]}`}>{labels[s]}</span>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-gray-500">Track balances and approve requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-gray-800">Request Leave</h2>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <select className="w-full border rounded-lg px-3 py-2" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required>
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
            <select className="w-full border rounded-lg px-3 py-2" value={form.type} onChange={e => setForm({...form, type: Number(e.target.value)})}>
              <option value={0}>Annual Leave</option>
              <option value={1}>Sick Leave</option>
              <option value={2}>Family Responsibility</option>
              <option value={3}>Unpaid Leave</option>
            </select>
            <div className="grid grid-cols-2 gap-4">
              <input type="date" className="w-full border rounded-lg px-3 py-2" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required />
              <input type="date" className="w-full border rounded-lg px-3 py-2" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required />
            </div>
            <input type="text" placeholder="Reason" className="w-full border rounded-lg px-3 py-2" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg">Submit Request</button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b font-bold text-gray-800">Leave Requests</div>
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Employee</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Dates</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Days</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{r.employee?.fullName || r.employeeId}</td>
                  <td className="px-6 py-3 text-gray-600">{typeLabel(r.type)}</td>
                  <td className="px-6 py-3 text-gray-600">{r.startDate} → {r.endDate}</td>
                  <td className="px-6 py-3 text-gray-900 font-bold">{r.daysRequested}</td>
                  <td className="px-6 py-3">{statusBadge(r.status)}</td>
                  <td className="px-6 py-3 text-right space-x-2">
                    <button onClick={() => api.put(`/leaverequests/${r.id}/status`, 1).then(load)} className="text-green-600 hover:text-green-800"><CheckCircle className="w-4 h-4 inline" /></button>
                    <button onClick={() => api.put(`/leaverequests/${r.id}/status`, 2).then(load)} className="text-red-600 hover:text-red-800"><XCircle className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}