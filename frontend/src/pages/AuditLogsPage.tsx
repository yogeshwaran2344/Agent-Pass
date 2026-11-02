import React from 'react';
import { ScrollText, ShieldCheck, Check } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const AuditLogsPage: React.FC = () => {
  const logs = [
    {
      id: 'aud_91283',
      action: 'PAYPAL_ORDER_CAPTURED',
      entity: 'TRANSACTION',
      actor: 'HUMAN_OPERATOR',
      detail: 'Manual approval override granted for Asus laptop $899 at BestBuy.',
      hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      time: '15 min ago',
    },
    {
      id: 'aud_91282',
      action: 'INTENT_CONSISTENCY_CHECK',
      entity: 'USER_INTENT',
      actor: 'AGENTPASS_FIREWALL',
      detail: 'Flagged negative constraint conflict (gaming laptop) against prompt #int_college_laptop.',
      hash: 'sha256:4a5b2...8f1a',
      time: '16 min ago',
    },
    {
      id: 'aud_91281',
      action: 'BUDGET_RESERVED',
      entity: 'COMMITMENT',
      actor: 'AGENT',
      detail: 'Agent ag_procurement_99 reserved $899.00 USD for 15 minutes.',
      hash: 'sha256:9c12b...44a1',
      time: '20 min ago',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ScrollText className="w-4 h-4" />
          <span>Compliance & Tamper-Evident Trail</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Immutable Audit Logs</h2>
        <p className="text-xs text-slate-400">
          Cryptographically chained audit records for every permission evaluation, intent scan, human approval, and PayPal settlement.
        </p>
      </div>

      <Card title="Chained Audit Log Records" subtitle="SHA-256 hash-verified sequence">
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl bg-surface border border-surface-border text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="purple">{log.action}</Badge>
                  <span className="font-mono text-slate-400 text-[11px]">{log.id}</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">{log.time}</span>
              </div>
              <p className="text-slate-200">{log.detail}</p>
              <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Actor: {log.actor}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Hash Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
