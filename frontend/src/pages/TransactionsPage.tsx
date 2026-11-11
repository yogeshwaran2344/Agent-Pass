import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Transactions &amp; Ledger</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Chronological ledger of authorized holds and PayPal Sandbox settled transactions.
        </p>
      </div>

      <Card title="Ledger Entries" subtitle="Authorized and captured agent settlements">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Loading transactions...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Transaction ID</th>
                  <th className="py-2.5 px-4">Agent</th>
                  <th className="py-2.5 px-4">Merchant</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Rail</th>
                  <th className="py-2.5 px-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">{tx.id.slice(0, 12)}...</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{tx.agent_id}</td>
                    <td className="py-3 px-4 text-slate-900 font-medium">{tx.merchant}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          tx.status === 'completed'
                            ? 'success'
                            : tx.status === 'authorized'
                            ? 'info'
                            : tx.status === 'failed'
                            ? 'danger'
                            : 'warning'
                        }
                        dot
                      >
                        {tx.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{tx.payment_method}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'Recent'}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
