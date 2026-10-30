import { useEffect, useState } from "react";
import { api } from "../api";
import { FileText } from "lucide-react";

export default function PayslipManager() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employeeId: "", start: "", end: "" });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/Employees").then(r => setEmployees(r.data));
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(Number(amount || 0));

  // Generate button: fetch a lightweight timesheet preview first (reuses existing
  // endpoint) so the page can show something on screen before downloading the PDF.
  const generate = async (e) => {
    e.preventDefault();
    setError("");
    setPreview(null);
    try {
      const { data } = await api.get("/Timesheets/generate", {
        params: {
          employeeId: Number(form.employeeId),
          start: form.start,
          end: form.end,
        },
      });
      setPreview(data);
    } catch {
      setError("Could not calculate this period — check that the employee has logged hours in this range.");
    }
  };

  const downloadPayslip = async () => {
    if (!preview) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${api.defaults.baseURL}/Payslips/generate?employeeId=${preview.employeeId}&start=${preview.periodStart}&end=${preview.periodEnd}`
      );
      if (!response.ok) {
        setError("Could not generate the payslip PDF — check that this employee has time entries in this period.");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Payslip_${preview.employeeName.replace(/\s+/g, "_")}_${preview.periodStart}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Payslips</h1>
        <p className="text-gray-500">Calculate pay, tax and UIF, then download an official PDF payslip</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-4">Select Employee &amp; Period</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Employee</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">From</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              value={form.start}
              onChange={e => setForm({ ...form, start: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">To</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              value={form.end}
              onChange={e => setForm({ ...form, end: e.target.value })}
            />
          </div>
          <button
            onClick={generate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Generate Payslip
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      {preview && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{preview.employeeName}</h2>
              <p className="text-gray-500">{preview.periodStart} → {preview.periodEnd}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(preview.totalPay)}</p>
              <p className="text-sm text-gray-500">Gross &middot; before tax &amp; UIF</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
            <div><p className="text-xs text-gray-500">Regular Hours</p><p className="font-bold text-gray-900">{preview.regularHours}</p></div>
            <div><p className="text-xs text-gray-500">Overtime Hours</p><p className="font-bold text-gray-900">{preview.overtimeHours}</p></div>
            <div><p className="text-xs text-gray-500">Regular Pay</p><p className="font-bold text-gray-900">{formatCurrency(preview.regularPay)}</p></div>
            <div><p className="text-xs text-gray-500">Overtime Pay</p><p className="font-bold text-gray-900">{formatCurrency(preview.overtimePay)}</p></div>
          </div>

          <p className="text-xs text-gray-400">
            Exact PAYE and UIF deductions are calculated on the payslip itself — download it below to see the full breakdown.
          </p>

          <button
            onClick={downloadPayslip}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {loading ? "Generating..." : "Download Payslip (PDF)"}
          </button>
        </div>
      )}
    </div>
  );
}