import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EmployeeManager from './pages/EmployeeManager';
import CaptureHours from './pages/CaptureHours';
import TimesheetManager from './pages/TimesheetManager';
import LeaveManager from './pages/LeaveManager';
import PayslipManager from "./pages/PayslipManager";
import KioskScanner from "./pages/KioskScanner";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<EmployeeManager />} />
        <Route path="capture" element={<CaptureHours />} />
        <Route path="timesheets" element={<TimesheetManager />} />
        <Route path="/payslips" element={<PayslipManager />} />
        <Route path="leave" element={<LeaveManager />} />
      </Route>
      <Route path="/kiosk" element={<KioskScanner />} />
    </Routes>
  );
}