import React, { useState, useEffect, useRef } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { Bell, Check, CheckCheck, Loader2, Menu, X } from 'lucide-react';
import { NotificationItem } from '../../types';
import { notificationService, paypalService } from '../../services';
import { BrandMark } from '../common/BrandMark';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paypalMode, setPaypalMode] = useState<'live_sandbox' | 'mock_sandbox'>('mock_sandbox');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const [count, ppStatus] = await Promise.all([
        notificationService.getUnreadCount(),
        paypalService.getStatus(),
      ]);
      setUnreadCount(count);
      setPaypalMode(ppStatus.mode);
    } catch {
      // Graceful fallback
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
    fetchStatus();
    const interval = setInterval(() => {
      notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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
        return { title: 'Overview', category: 'Console' };
      case '/agents':
        return { title: 'Agent Registry', category: 'Directory' };
      case '/permissions':
        return { title: 'Permissions & Limits', category: 'Policy' };
      case '/intents':
        return { title: 'Intent Verification', category: 'Rules' };
      case '/approvals':
        return { title: 'Approval Queue', category: 'Review' };
      case '/delegations':
        return { title: 'Delegations', category: 'Hierarchy' };
      case '/transactions':
        return { title: 'Transactions', category: 'Ledger' };
      case '/security':
        return { title: 'Kill Switch', category: 'Controls' };
      case '/audit':
        return { title: 'Audit Log', category: 'Compliance' };
      case '/analytics':
        return { title: 'Analytics', category: 'Reports' };
      case '/settings':
        return { title: 'Settings', category: 'Account' };
      default:
        return { title: 'Console', category: 'AgentPass' };
    }
  };

  const { title, category } = getPageTitle(location.pathname);

  const mobileLinks = [
    { name: 'Overview', to: '/dashboard' },
    { name: 'Agents', to: '/agents' },
    { name: 'Permissions', to: '/permissions' },
    { name: 'Intent Rules', to: '/intents' },
    { name: 'Approvals', to: '/approvals' },
    { name: 'Delegations', to: '/delegations' },
    { name: 'Transactions', to: '/transactions' },
    { name: 'Kill Switch', to: '/security' },
    { name: 'Audit Log', to: '/audit' },
    { name: 'Analytics', to: '/analytics' },
    { name: 'Settings', to: '/settings' },
  ];

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="md:hidden flex items-center gap-2">
          <BrandMark className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>{category}</span>
            <span>/</span>
            <span className="text-slate-700 font-medium">{title}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              paypalMode === 'live_sandbox' ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
          />
          <span>
            {paypalMode === 'live_sandbox' ? 'PayPal Sandbox Connected' : 'PayPal Sandbox (Mock)'}
          </span>
        </div>

        {/* Notifications Icon & Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggleDropdown}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-slate-200"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-slate-900 text-white rounded-full text-[10px] font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">Alerts</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800 font-medium">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {isLoading ? (
                  <div className="py-8 flex justify-center items-center text-slate-500 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Loading...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors flex items-start justify-between gap-3 ${
                        n.is_read ? 'bg-white' : 'bg-blue-50/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                          <span className="font-semibold text-slate-900">{n.title}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-slate-400 hover:text-emerald-600 p-1 shrink-0"
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

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-14 bg-white border-b border-slate-200 shadow-lg p-4 z-40 md:hidden grid grid-cols-2 gap-1.5">
          {mobileLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-xs font-medium ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
};
