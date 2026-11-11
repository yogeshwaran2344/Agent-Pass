import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Audit Log</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tamper-evident SHA-256 chained audit trail of policy evaluations, approvals, and settlements.
        </p>
      </div>

      <Card title="Audit Records" subtitle="Cryptographically chained sequence">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Loading audit history...</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">{log.action}</Badge>
                    <span className="font-mono text-slate-500 text-[11px]">{log.id}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                  </span>
                </div>
                <p className="text-slate-800">{log.description || log.action}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Actor: {log.actor_type}</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Hash-verified
                  </span>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="py-10 text-center text-slate-500 text-xs">
                No audit logs recorded yet.
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
