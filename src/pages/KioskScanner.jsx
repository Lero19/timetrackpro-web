/* import { useEffect, useRef, useState } from "react";
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
} */
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../api";

export default function KioskScanner() {
  const [status, setStatus] = useState({
    state: "ready",
    message: "Starting camera..."
  });

  const scannerRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    let disposed = false;
    let started = false;
    let cooldownTimer;
    let messageTimer;

    async function startScanner() {
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 280 },
          async (decodedText) => {
            if (busyRef.current || disposed) return;

            busyRef.current = true;

            try {
              await handleScan(decodedText);
            } finally {
              cooldownTimer = window.setTimeout(() => {
                busyRef.current = false;
              }, 2500);
            }
          },
          () => {
            // Ignore frames where no QR code was detected.
          }
        );

        started = true;

        if (!disposed) {
          setStatus({
            state: "ready",
            message: "Camera ready — scan your card"
          });
        } else {
          await scanner.stop().catch(() => {});
        }
      } catch (error) {
        console.error("QR camera startup failed:", error);

        if (!disposed) {
          setStatus({
            state: "error",
            message: `Camera failed to start: ${
              error?.message || String(error)
            }`
          });
        }
      }
    }

    async function handleScan(qrPayload) {
      try {
        const { data } = await api.post("/Clock/scan", { qrPayload });

        if (!disposed) {
          setStatus({
            state: data.action === "ClockedIn" ? "in" : "out",
            message: data.message
          });
        }
      } catch (err) {
        console.error("Clock scan request failed:", err);

        if (!disposed) {
          setStatus({
            state: "error",
            message:
              err.response?.data?.message ||
              "Scan failed — check the API connection and try again."
          });
        }
      }

      messageTimer = window.setTimeout(() => {
        if (!disposed) {
          setStatus({
            state: "ready",
            message: "Camera ready — scan your card"
          });
        }
      }, 3000);
    }

    startScanner();

    return () => {
      disposed = true;
      window.clearTimeout(cooldownTimer);
      window.clearTimeout(messageTimer);

      if (started && scanner.isScanning) {
        scanner.stop().catch((error) => {
          console.warn("Scanner cleanup failed:", error);
        });
      }

      scannerRef.current = null;
    };
  }, []);

  const bgColor =
    status.state === "in" ? "bg-emerald-600" :
    status.state === "out" ? "bg-indigo-600" :
    status.state === "error" ? "bg-red-600" :
    "bg-slate-900";

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-6 text-white transition-colors duration-300 ${bgColor}`}
    >
      <h1 className="text-3xl font-bold mb-2">TimeTrack Pro</h1>

      <p className="text-lg text-center mb-8">
        {status.message || "Scan your card to clock in or out"}
      </p>

      <div
        id="qr-reader"
        className="w-80 min-h-80 rounded-xl overflow-hidden border-4 border-white/30"
      />
    </div>
  );
}