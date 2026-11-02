import React, { useState, useEffect } from 'react';
import { ScrollText, ShieldCheck, Check, Loader2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { AuditLogItem } from '../types';
import { auditService } from '../services';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await auditService.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

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
                <span className="text-slate-500 font-mono text-[11px]">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                </span>
              </div>
              <p className="text-slate-200">{log.description || log.action}</p>
              <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Actor: {log.actor_type}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Hash-Chained
                </span>
              </div>
            </div>
          ))}

          {logs.length === 0 && !isLoading && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No audit logs recorded yet in database.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
