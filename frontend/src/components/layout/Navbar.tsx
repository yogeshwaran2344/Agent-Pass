import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, ShieldCheck, Zap, Check, CheckCheck, Loader2 } from 'lucide-react';
import { NotificationItem } from '../../types';
import { notificationService } from '../../services';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Graceful fallback if backend is momentarily starting up
    }
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.listNotifications();
      setNotifications(data);
      const unread = data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = () => {
    if (!isDropdownOpen) {
      loadNotifications();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const getPageTitle = (pathname: string): { title: string; category: string } => {
    switch (pathname) {
      case '/dashboard':
        return { title: 'Governance Overview', category: 'Platform' };
      case '/agents':
        return { title: 'AI Agent Registry', category: 'Management' };
      case '/permissions':
        return { title: 'Smart Policy & Limits', category: 'Policy Engine' };
      case '/intents':
        return { title: 'Intent Intelligence & Consistency', category: 'Core AI' };
      case '/approvals':
        return { title: 'Context-Aware Human Approval Queue', category: 'Human-in-the-Loop' };
      case '/delegations':
        return { title: 'Delegation Chain & Provenance', category: 'Hierarchy' };
      case '/transactions':
        return { title: 'Transactions & Commitments', category: 'Ledger' };
      case '/security':
        return { title: 'Security Center & Kill Switch', category: 'Defenses' };
      case '/audit':
        return { title: 'Immutable Audit Trail', category: 'Compliance' };
      case '/analytics':
        return { title: 'Spending & Risk Analytics', category: 'Reports' };
      case '/settings':
        return { title: 'Platform Settings', category: 'Configuration' };
      default:
        return { title: 'Financial Gateway', category: 'AGENTPASS' };
    }
  };

  const { title, category } = getPageTitle(location.pathname);

  return (
    <header className="h-16 border-b border-surface-border bg-surface/70 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>AGENTPASS</span>
          <span>/</span>
          <span className="text-slate-300 font-medium">{category}</span>
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
      </div>

      {/* Status Badges & Controls */}
      <div className="flex items-center gap-4">
        {/* PayPal Sandbox Active Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>PayPal Sandbox Active</span>
        </div>

        {/* Deterministic Guard Firewall Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Intent Firewall: Active</span>
        </div>

        {/* Notifications Icon & Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggleDropdown}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-surface-border"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-indigo-500 text-white rounded-full text-[10px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-surface-border bg-surface-card shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-surface-border flex items-center justify-between bg-surface">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-medium">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
                {isLoading ? (
                  <div className="py-8 flex justify-center items-center text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Loading alerts...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors flex items-start justify-between gap-3 ${
                        n.is_read ? 'bg-surface-card/40' : 'bg-indigo-950/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          )}
                          <span className="font-semibold text-white">{n.title}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-slate-400 hover:text-emerald-400 p-1 flex-shrink-0"
                          title="Mark read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
