TimeTrack Pro — QR Code Clock-In Kiosk (Phase 17 →)
Employees scan a card on a tablet to auto clock in/out — no manual capture needed
The architecture, in plain terms
Each employee gets a unique QR code printed on a card. The QR code encodes their Employee ID plus a secret token (so someone can't just guess/forge another employee's code).
A cheap Android tablet sits at the entrance, running your React app in kiosk mode (full-screen, locked to one app) with the camera pointed outward.
The tablet's browser uses the camera to scan QR codes live (a JS library does this — no native app needed).
On a successful scan, the tablet calls a new backend endpoint: "toggle this employee's clock status."
If they have no open entry today → creates a new TimeEntry with ClockIn = now.
If they already clocked in today and haven't clocked out → sets ClockOut = now on that entry.
The tablet shows a big green "✅ Welcome, [Name] — Clocked In at 08:03" confirmation for 2–3 seconds, then returns to scan-ready state.

This slots directly into your existing system — it's just a new, automated way of creating the same TimeEntry rows your Capture Hours page already creates manually. Nothing about Timesheets or Payslips needs to change.

Phase 17 — Hardware

For 20–100 employees, you don't need anything fancy:

Any Android tablet, 8"–10", R1,500–R3,000 range (Samsung Galaxy Tab A series, Lenovo Tab M-series are common cheap, reliable choices). Front camera quality matters more than raw specs — a decent front camera (5MP+) scans QR codes fast.
A tablet kiosk stand/mount (~R200–R500) — locks it in place at the entrance, angled so people can scan without fumbling.
A cheap QR/barcode card printer is optional — you don't need special printing. Plain printed cards (even laminated paper) work fine; a standard office printer + laminator pouch is enough for 20–100 cards.
Reliable WiFi at the kiosk location — the tablet needs to reach your API. If your backend is only running on your dev machine for now, the tablet needs to be on the same network as that machine (fine for testing; for production you'll eventually host the API somewhere reachable, like Azure/a VPS).
Phase 18 — Give each employee a unique, unforgeable QR code

Add a field to the Employee model so each employee has a permanent, random identifier separate from their database Id (this stops someone from just writing EMP-1, EMP-2... on a fake card and guessing their way in).

Models/Employee.cs — add one property:

csharp
public string QrToken { get; set; } = Guid.NewGuid().ToString("N"); // auto-generated, unique, unguessable

Run a migration to add this column:

powershell
Add-Migration AddQrTokenToEmployee
Update-Database

What goes inside the QR code itself: encode a simple string like TTP:{EmployeeId}:{QrToken} — for example TTP:7:a1b2c3d4e5f6.... The backend will parse this and verify both the ID and the token match before accepting a scan.

Phase 19 — Backend: generate the QR code image + the scan endpoint

Install a QR-generation package:

powershell
Install-Package QRCoder

Controllers/EmployeesController.cs — add an endpoint that returns a scannable QR code image for a given employee (useful for printing cards):

csharp
using QRCoder;

[HttpGet("{id}/qr")]
public async Task<IActionResult> GetQrCode(int id)
{
    var emp = await _db.Employees.FindAsync(id);
    if (emp is null) return NotFound();

    string payload = $"TTP:{emp.Id}:{emp.QrToken}";

    using var qrGenerator = new QRCodeGenerator();
    using var qrData = qrGenerator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q);
    using var qrCode = new PngByteQRCode(qrData);
    byte[] qrBytes = qrCode.GetGraphic(20); // 20 = pixel size per module

    return File(qrBytes, "image/png");
}

Visit https://localhost:xxxx/api/Employees/7/qr in a browser for any real employee ID — you should see a scannable QR image. That's what gets printed on their card (add their name/photo around it in whatever document tool you like — even just pasting the image into a Word doc works for 20–100 cards).

Phase 20 — The actual clock-in/out logic

Create Controllers/ClockController.cs:

csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeTrack_Pro.Data;
using TimeTrack_Pro.Models;

namespace TimeTrack_Pro.Controllers
{
    public class ClockScanRequest
    {
        public string QrPayload { get; set; } = string.Empty; // the raw scanned string, e.g. "TTP:7:a1b2c3..."
    }

    public class ClockScanResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? EmployeeName { get; set; }
        public string? Action { get; set; } // "ClockedIn" or "ClockedOut"
        public string? Time { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ClockController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ClockController(AppDbContext db) => _db = db;

        [HttpPost("scan")]
        public async Task<IActionResult> Scan(ClockScanRequest request)
        {
            var parts = request.QrPayload.Split(':');
            if (parts.Length != 3 || parts[0] != "TTP" || !int.TryParse(parts[1], out int employeeId))
                return BadRequest(new ClockScanResult { Success = false, Message = "Invalid QR code." });

            string token = parts[2];

            var employee = await _db.Employees
                .FirstOrDefaultAsync(e => e.Id == employeeId && e.QrToken == token && e.IsActive);

            if (employee is null)
                return BadRequest(new ClockScanResult { Success = false, Message = "Unrecognized or inactive employee card." });

            var today = DateOnly.FromDateTime(DateTime.Now);
            var now = TimeOnly.FromDateTime(DateTime.Now);

            // Look for today's entry that hasn't been clocked out yet
            // (a "default" ClockOut of 00:00 marks an open entry — see note below)
            var openEntry = await _db.TimeEntries
                .Where(t => t.EmployeeId == employeeId && t.WorkDate == today && t.ClockOut == default)
                .FirstOrDefaultAsync();

            if (openEntry is null)
            {
                // No open entry today → clock IN
                var entry = new TimeEntry
                {
                    EmployeeId = employee.Id,
                    WorkDate = today,
                    ClockIn = now,
                    ClockOut = default, // still "open" until they scan again
                    Notes = "QR kiosk clock-in"
                };
                _db.TimeEntries.Add(entry);
                await _db.SaveChangesAsync();

                return Ok(new ClockScanResult
                {
                    Success = true,
                    EmployeeName = employee.FullName,
                    Action = "ClockedIn",
                    Time = now.ToString("HH:mm"),
                    Message = $"Welcome, {employee.FullName} — Clocked In at {now:HH:mm}"
                });
            }
            else
            {
                // Open entry exists → clock OUT
                openEntry.ClockOut = now;
                await _db.SaveChangesAsync();

                return Ok(new ClockScanResult
                {
                    Success = true,
                    EmployeeName = employee.FullName,
                    Action = "ClockedOut",
                    Time = now.ToString("HH:mm"),
                    Message = $"Goodbye, {employee.FullName} — Clocked Out at {now:HH:mm}"
                });
            }
        }
    }
}

⚠️ Important beginner note on the "open entry" trick: this code uses ClockOut == default (midnight, 00:00) to mean "not clocked out yet." That's a simple trick but has one edge case: if someone's shift genuinely starts near midnight, this can misbehave. For 20–100 employees doing normal daytime shifts this is perfectly fine to start with — just know it's a simplification, not a limitation you need to solve on day one.

✅ Checkpoint: Test in Swagger — POST /api/Clock/scan with body { "qrPayload": "TTP:7:yourrealtoken" } (get the real token from your database, e.g. via the Employees GET endpoint — you'll want to temporarily expose QrToken in the response, or just check it directly in timetrackpro.db using a SQLite browser tool). First call → "Clocked In". Second call with the same payload → "Clocked Out".

Phase 21 — The kiosk screen (React)

Install a QR-scanning library:

bash
npm install html5-qrcode

Create src/pages/KioskScanner.jsx:

jsx
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../api";

export default function KioskScanner() {
  const [status, setStatus] = useState({ state: "ready", message: "" });
  const scannerRef = useRef(null);
  const busyRef = useRef(false); // prevents double-scanning the same code rapidly

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" }, // outward-facing camera
      { fps: 10, qrbox: 280 },
      async (decodedText) => {
        if (busyRef.current) return;
        busyRef.current = true;
        await handleScan(decodedText);
        setTimeout(() => { busyRef.current = false; }, 2500); // cooldown before next scan
      },
      () => {} // ignore per-frame "no QR found" noise
    );

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  const handleScan = async (qrPayload) => {
    try {
      const { data } = await api.post("/Clock/scan", { qrPayload });
      setStatus({
        state: data.action === "ClockedIn" ? "in" : "out",
        message: data.message,
      });
    } catch (err) {
      setStatus({
        state: "error",
        message: err.response?.data?.message || "Scan failed — try again.",
      });
    }
    setTimeout(() => setStatus({ state: "ready", message: "" }), 3000);
  };

  const bgColor =
    status.state === "in" ? "bg-emerald-600" :
    status.state === "out" ? "bg-indigo-600" :
    status.state === "error" ? "bg-red-600" :
    "bg-slate-900";

  return (
    <div className={`h-screen w-screen flex flex-col items-center justify-center text-white transition-colors duration-300 ${bgColor}`}>
      <h1 className="text-3xl font-bold mb-2">TimeTrack Pro</h1>
      <p className="text-lg text-slate-200 mb-8">
        {status.message || "Scan your card to clock in or out"}
      </p>
      <div id="qr-reader" className="w-80 h-80 rounded-xl overflow-hidden border-4 border-white/30" />
    </div>
  );
}

Add the route in App.jsx — give it its own full-screen path, outside the normal <Layout> wrapper (no sidebar needed on the kiosk itself):

jsx
<Route path="/kiosk" element={<KioskScanner />} />

(Add this as a sibling to the <Route path="/" element={<Layout />}> block, not nested inside it — the kiosk screen shouldn't have your admin sidebar.)

Phase 22 — Turn the tablet into a kiosk
On the Android tablet, open Chrome and navigate to http://<your-computer's-local-IP>:5173/kiosk (not localhost — the tablet needs your computer's actual network IP address, e.g. http://192.168.1.42:5173/kiosk; find yours with ipconfig in a terminal).
The browser will ask for camera permission — allow it.
In Chrome's menu, choose "Add to Home Screen" — this creates an app-like icon.
Install a free kiosk-lock app from the Play Store (e.g. "Fully Kiosk Browser", very popular and free for basic use) and point it at the same /kiosk URL. This locks the tablet to only that screen, disables the home/back buttons, and can auto-restart the page if the tablet reboots — ideal for an unattended entrance kiosk.
Mount the tablet in its stand at the entrance, camera facing outward where people walk past.
Phase 23 — Print the employee cards

For 20–100 employees, the simplest approach:

Loop through your employees, hit GET /api/Employees/{id}/qr for each, and save the PNGs.
Paste each QR image into a simple Word/PDF template with the employee's name underneath.
Print, laminate (optional but durable), done. A full script to auto-generate all cards in one PDF is a nice Phase 24 if you want it later — just ask.
⚠️ Security note

This payload (TTP:7:token) is good enough for an internal office tool, but anyone who photographs a card could screenshot-replay it from their phone. For a stricter system later, you could add a short expiry or rotate tokens periodically — not necessary to start, but worth knowing as a future improvement, not a current flaw you need to fix today.

🔁 Continuing in another AI tool

"I'm building 'TimeTrack Pro' (namespace TimeTrack_Pro) — adding a QR-code kiosk clock-in feature. Each Employee has a QrToken GUID; ClockController.Scan toggles clock-in/out based on an open TimeEntry for today; a React KioskScanner.jsx page uses html5-qrcode to scan continuously on an Android tablet in kiosk mode via Fully Kiosk Browser. I've completed through Phase [X]. Continue from Phase [X+1]."