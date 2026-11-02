import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { AgentsPage } from './pages/AgentsPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { IntentIntelligencePage } from './pages/IntentIntelligencePage';
import { ApprovalCenterPage } from './pages/ApprovalCenterPage';
import { DelegationPage } from './pages/DelegationPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SecurityCenterPage } from './pages/SecurityCenterPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Layout Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/permissions" element={<PermissionsPage />} />
          <Route path="/intents" element={<IntentIntelligencePage />} />
          <Route path="/approvals" element={<ApprovalCenterPage />} />
          <Route path="/delegations" element={<DelegationPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/security" element={<SecurityCenterPage />} />
          <Route path="/audit" element={<AuditLogsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
