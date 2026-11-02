import React from 'react';
import { CreditCard, ExternalLink, CheckCircle2, Clock, Lock } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const TransactionsPage: React.FC = () => {
  const transactions = [
    {
      id: 'tx_7819_live',
      agent: 'ProcurementBot-Alpha',
      merchant: 'BestBuy',
      amount: 899.0,
      status: 'completed',
      type: 'PayPal Capture',
      paypal_order: 'PAYPAL-MOCK-ORDER-9B12',
      time: '15 min ago',
    },
    {
      id: 'comm_reserve_33',
      agent: 'FlightBooker-Delta',
      merchant: 'United Airlines',
      amount: 240.0,
      status: 'reserved',
      type: 'Pre-Allocation Hold',
      paypal_order: 'Pending Hold',
      time: '1 hour ago',
    },
    {
      id: 'tx_6612_settled',
      agent: 'ResearchAssistant',
      merchant: 'GitHub',
      amount: 45.0,
      status: 'completed',
      type: 'PayPal Capture',
      paypal_order: 'PAYPAL-MOCK-ORDER-A7F9',
      time: 'Yesterday',
    },
  ];

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
                  <td className="py-3 px-4 font-medium text-indigo-300">{tx.agent}</td>
                  <td className="py-3 px-4 text-white font-semibold">{tx.merchant}</td>
                  <td className="py-3 px-4 font-mono font-bold text-white">${tx.amount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <Badge variant={tx.status === 'completed' ? 'success' : 'warning'} dot>
                      {tx.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{tx.paypal_order}</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
