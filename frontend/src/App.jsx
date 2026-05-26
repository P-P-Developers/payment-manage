import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Panels from './pages/Panels';
import PanelLedger from './pages/PanelLedger';
import Payments from './pages/Payments';
import Users from './pages/Users';
import Logs from './pages/Logs';
import SmtpSettings from './pages/SmtpSettings';
import Settings from './pages/Settings';

export default function App() {
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('app_system_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.logo) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = parsed.logo;
        }
      }
    } catch (e) {
      console.error('Failed to parse settings for favicon', e);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="panels" element={<Panels />} />
          <Route path="panels/:id" element={<PanelLedger />} />
          <Route path="payments" element={<Payments />} />
          <Route path="users" element={<Users />} />
          <Route path="logs" element={<Logs />} />
          <Route path="smtp" element={<SmtpSettings />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
