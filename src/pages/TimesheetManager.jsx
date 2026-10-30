import { useEffect, useState } from "react";
import { api } from "../api";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

export default function TimesheetManager() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employeeId: "", start: "", end: "" });
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/Employees").then(r => setEmployees(r.data));
  }, []);

  const generate = async (e) => {
    e.preventDefault();
    const { data } = await api.get("/Timesheets/generate", {
      params: {
        employeeId: Number(form.employeeId),
        start: form.start,
        end: form.end
      }
    });
    setResult(data);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(Number(amount || 0));
  };

  const downloadExcel = () => {
    if (!result) return;

    const worksheetData = [
      ["TimeTrack Pro - Timesheet"],
      [],
      ["Employee", result.employeeName],
      ["Period Start", result.periodStart],
      ["Period End", result.periodEnd],
      [],
      ["Description", "Value"],
      ["Regular Hours", Number(result.regularHours || 0)],
      ["Overtime Hours", Number(result.overtimeHours || 0)],
      ["Regular Pay", Number(result.regularPay || 0)],
      ["Overtime Pay", Number(result.overtimePay || 0)],
      ["Total Pay", Number(result.totalPay || 0)],
      [],
      ["Date", "Clock In", "Clock Out", "Hours Worked"],
      ...result.entries.map(e => [e.workDate, e.clockIn, e.clockOut, e.hoursWorked])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheet");

    const safeName = result.employeeName.replace(/[^a-z0-9]/gi, "_").replace(/_+/g, "_");
    XLSX.writeFile(workbook, `TimeTrackPro_Timesheet_${safeName}_${result.periodStart}.xlsx`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
        <p className="text-gray-500">Generate and manage official pay periods</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-4">Generate New Timesheet</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Employee</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
              <option value="">Select...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <input type="date" className="border rounded-lg px-3 py-2" value={form.start} onChange={e => setForm({...form, start: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <input type="date" className="border rounded-lg px-3 py-2" value={form.end} onChange={e => setForm({...form, end: e.target.value})} />
          </div>
          <button onClick={generate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium">
            Generate
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{result.employeeName}</h2>
              <p className="text-gray-500">{result.periodStart} → {result.periodEnd}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(result.totalPay)}</p>
              <p className="text-sm text-gray-500">{result.totalHours} hrs total</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
            <div><p className="text-xs text-gray-500">Regular Hours</p><p className="font-bold text-gray-900">{result.regularHours}</p></div>
            <div><p className="text-xs text-gray-500">Overtime Hours</p><p className="font-bold text-gray-900">{result.overtimeHours}</p></div>
            <div><p className="text-xs text-gray-500">Regular Pay</p><p className="font-bold text-gray-900">{formatCurrency(result.regularPay)}</p></div>
            <div><p className="text-xs text-gray-500">Overtime Pay</p><p className="font-bold text-gray-900">{formatCurrency(result.overtimePay)}</p></div>
          </div>

          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-700">In</th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-700">Out</th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-700 text-right">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.entries.map((entry, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{entry.workDate}</td>
                  <td className="px-4 py-2 text-gray-600">{entry.clockIn}</td>
                  <td className="px-4 py-2 text-gray-600">{entry.clockOut}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">{entry.hoursWorked}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={downloadExcel}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>
      )}
    </div>
  );
}