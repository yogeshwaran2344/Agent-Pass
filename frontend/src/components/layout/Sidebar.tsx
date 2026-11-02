import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Bot,
  Sliders,
  BrainCircuit,
  CheckCircle2,
  GitFork,
  CreditCard,
  ShieldAlert,
  ScrollText,
  LineChart,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface SidebarProps {
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingApprovalsCount = 0 }) => {
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'My Agents', to: '/agents', icon: Bot },
    { name: 'Permissions', to: '/permissions', icon: Sliders },
    {
      name: 'Intent Intelligence',
      to: '/intents',
      icon: BrainCircuit,
      badge: 'Core AI',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    },
    {
      name: 'Approval Center',
      to: '/approvals',
      icon: CheckCircle2,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    { name: 'Delegation Chain', to: '/delegations', icon: GitFork },
    { name: 'Transactions', to: '/transactions', icon: CreditCard },
    {
      name: 'Security & Kill Switch',
      to: '/security',
      icon: ShieldAlert,
      badge: 'Protected',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    { name: 'Audit Logs', to: '/audit', icon: ScrollText },
    { name: 'Analytics', to: '/analytics', icon: LineChart },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-surface/90 border-r border-surface-border flex flex-col h-screen sticky top-0 backdrop-blur-xl z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-surface-border/60 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/40">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-white">AGENTPASS</span>
            <span className="text-[10px] uppercase font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.2 rounded">
              v1.0
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Financial Governance Gateway</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon
                    className={clsx(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={clsx(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
                      isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer with Quick Logout */}
      <div className="p-4 border-t border-surface-border/60 bg-surface-card/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-xs font-bold text-indigo-300">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="truncate text-xs">
              <div className="font-semibold text-slate-200 truncate">{user?.full_name || 'Operator'}</div>
              <div className="text-slate-400 text-[11px] truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
