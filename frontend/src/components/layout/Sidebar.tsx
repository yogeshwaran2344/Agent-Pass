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
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { BrandMark } from '../common/BrandMark';

interface SidebarProps {
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingApprovalsCount = 0 }) => {
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Agents', to: '/agents', icon: Bot },
    { name: 'Permissions', to: '/permissions', icon: Sliders },
    { name: 'Intent Rules', to: '/intents', icon: BrainCircuit },
    {
      name: 'Approvals',
      to: '/approvals',
      icon: CheckCircle2,
      count: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { name: 'Delegations', to: '/delegations', icon: GitFork },
    { name: 'Transactions', to: '/transactions', icon: CreditCard },
    { name: 'Kill Switch', to: '/security', icon: ShieldAlert },
    { name: 'Audit Log', to: '/audit', icon: ScrollText },
    { name: 'Analytics', to: '/analytics', icon: LineChart },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-60 bg-[#0D2D24] border-r border-[#1A473B] flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-5 border-b border-[#1A473B] gap-2.5">
        <BrandMark className="w-7 h-7" />
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-sm tracking-tight text-white">AgentPass</span>
          <span className="text-[10px] font-mono text-emerald-300/80">sandbox</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'group flex items-center justify-between px-3 py-2 text-[13px] font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-2.5">
                  <item.icon
                    className={clsx(
                      'w-4 h-4',
                      isActive ? 'text-white' : 'text-emerald-300/70 group-hover:text-white'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={clsx(
                      'text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-400 text-[#0D2D24]'
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3.5 border-t border-[#1A473B] bg-[#081F19]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="truncate text-xs">
              <div className="font-medium text-white truncate">{user?.full_name || 'Operator'}</div>
              <div className="text-emerald-200/70 text-[11px] truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out"
            className="p-1.5 text-emerald-200/70 hover:text-red-300 hover:bg-red-500/15 rounded-md transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
