import { useEffect, useState } from "react";
import { api } from "../api";
import * as XLSX from "xlsx";

export default function Timesheets() {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/Employees")
      .then(res => setEmployees(res.data))
      .catch(error => {
        console.error("Failed to load employees:", error);
      });
  }, []);

  const generate = async (e) => {
    e.preventDefault();

    try {
      const res = await api.get("/Timesheets/generate", {
        params: {
          employeeId: Number(employeeId),
          start,
          end
        }
      });

      setResult(res.data);
    } catch (error) {
      console.error("Failed to generate timesheet:", error);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);
    }
  };

  // South African Rand formatting
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
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
      ["Total Pay", Number(result.totalPay || 0)]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["!cols"] = [
      { wch: 25 },
      { wch: 30 }
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Timesheet"
    );

    const employeeName = result.employeeName
      .replace(/[^a-z0-9]/gi, "_")
      .replace(/_+/g, "_");

    const fileName =
      `TimeTrackPro_Timesheet_${employeeName}_${result.periodStart}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">
        📄 Generate Timesheet
      </h1>

      <form
        onSubmit={generate}
        className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl shadow mb-6"
      >
        <select
          className="border rounded-lg p-2 col-span-3"
          required
          value={employeeId}
          onChange={e => setEmployeeId(e.target.value)}
        >
          <option value="">Select employee…</option>

          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.fullName}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="border rounded-lg p-2"
          required
          value={start}
          onChange={e => setStart(e.target.value)}
        />

        <input
          type="date"
          className="border rounded-lg p-2"
          required
          value={end}
          onChange={e => setEnd(e.target.value)}
        />

        <button
          type="submit"
          className="bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700"
        >
          Generate
        </button>
      </form>

      {result && (
        <div className="bg-white p-5 rounded-xl shadow space-y-2">
          <h2 className="text-lg font-semibold">
            {result.employeeName}
          </h2>

          <p className="text-sm text-slate-500">
            {result.periodStart} → {result.periodEnd}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <p>
              Regular hours:{" "}
              <b>{result.regularHours}</b>
            </p>

            <p>
              Overtime hours:{" "}
              <b>{result.overtimeHours}</b>
            </p>

            <p>
              Regular pay:{" "}
              <b>{formatCurrency(result.regularPay)}</b>
            </p>

            <p>
              Overtime pay:{" "}
              <b>{formatCurrency(result.overtimePay)}</b>
            </p>
          </div>

          <p className="text-xl font-bold text-emerald-700 mt-3">
            Total pay: {formatCurrency(result.totalPay)}
          </p>

          <button
            type="button"
            onClick={downloadExcel}
            className="w-full mt-4 bg-emerald-600 text-white rounded-lg py-2 font-medium hover:bg-emerald-700"
          >
            Download Excel
          </button>
        </div>
      )}
    </div>
  );
}