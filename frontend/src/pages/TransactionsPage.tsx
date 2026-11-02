import React, { useState, useEffect } from 'react';
import { CreditCard, ExternalLink, CheckCircle2, Clock, Lock, Loader2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Transaction } from '../types';
import { transactionService } from '../services';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        const data = await transactionService.listTransactions();
        setTransactions(data);
      } catch (err) {
        console.error('Failed to load transactions', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTxs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <CreditCard className="w-4 h-4" />
          <span>Financial Obligations & Settlements</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Transactions & Commitments</h2>
        <p className="text-xs text-slate-400">
          Complete ledger of two-phase reserved commitments and PayPal Sandbox captured transactions.
        </p>
      </div>

      <Card title="Ledger Entries" subtitle="Chronological financial history">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Transaction / Hold ID</th>
                <th className="py-3 px-4">AI Agent</th>
                <th className="py-3 px-4">Merchant</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">PayPal Reference</th>
                <th className="py-3 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-200">{tx.id}</td>
                  <td className="py-3 px-4 font-medium text-indigo-300 font-mono">{tx.agent_id}</td>
                  <td className="py-3 px-4 text-white font-semibold">{tx.merchant}</td>
                  <td className="py-3 px-4 font-mono font-bold text-white">${tx.amount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'authorized' ? 'info' : 'warning'} dot>
                      {tx.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{tx.payment_method}</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {tx.created_at ? new Date(tx.created_at).toLocaleTimeString() : 'Recent'}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No transactions recorded yet in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
