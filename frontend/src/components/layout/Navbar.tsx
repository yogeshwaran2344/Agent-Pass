import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { Badge } from '../common/Badge';

export const Navbar: React.FC = () => {
  const location = useLocation();

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

        {/* Notifications Icon */}
        <button
          className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-surface-border"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
        </button>
      </div>
    </header>
  );
};
