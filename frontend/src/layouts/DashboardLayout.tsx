import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { useAuthStore } from '../store/useAuthStore';
import { approvalService } from '../services';

export const DashboardLayout: React.FC = () => {
  const { checkAuth } = useAuthStore();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  useEffect(() => {
    checkAuth();

    const loadPendingCount = async () => {
      try {
        const pending = await approvalService.getPendingApprovals();
        setPendingApprovalsCount(pending.length);
      } catch {
        // Ignore transient network errors
      }
    };

    loadPendingCount();
    const interval = setInterval(loadPendingCount, 20000);
    return () => clearInterval(interval);
  }, [checkAuth]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <Sidebar pendingApprovalsCount={pendingApprovalsCount} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
