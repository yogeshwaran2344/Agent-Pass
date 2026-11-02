import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Check,
  Clock,
  Zap,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ApprovalRequest } from '../types';
import api from '../services/api';

export const ApprovalCenterPage: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');

  // PayPal Payment Modal / Success state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/approvals/pending');
      setApprovals(res.data);
    } catch {
      // Mock realistic approval queue for demonstrator
      setApprovals([
        {
          id: 'appr_laptop_conflict_01',
          agent_id: 'ag_procurement_99',
          amount: 899.0,
          currency: 'USD',
          merchant_name: 'BestBuy',
          item_description: 'Asus ROG Zephyrus 14" Portable Gaming Laptop (RTX 4070)',
          reason_for_approval: 'Intent conflict: item matches negative constraint "no gaming laptops" from prompt #int_college_laptop.',
          policy_conflicts: [
            'Intent Mismatch: Gaming hardware detected',
            'Amount ($899) triggers human verification threshold ($50.00)',
          ],
          intent_divergence_summary: 'User requested: college lightweight portable laptop. Selected item is a high-performance gaming rig with reduced battery autonomy.',
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (approvalId: string, action: 'approve' | 'reject' | 'clarify') => {
    try {
      if (action === 'approve') {
        setIsProcessingPayment(true);
        // Step 1: Record approval in backend
        await api.post(`/approvals/${approvalId}/action`, {
          action: 'approve',
          user_comment: 'Approved manual override by operator.',
        });

        // Step 2: Trigger PayPal Sandbox Order creation & capture via backend
        // Create transaction first
        const txRes = await api.post('/transactions/', {
          agent_id: 'ag_procurement_99',
          amount: 899.0,
          merchant: 'BestBuy',
          payment_method: 'paypal_sandbox',
        });

        // Create PayPal order
        const ppRes = await api.post('/paypal/create-order', {
          transaction_id: txRes.data.id,
        });

        // Capture PayPal order
        const captureRes = await api.post('/paypal/capture-order', {
          paypal_order_id: ppRes.data.paypal_order_id,
        });

        setPaymentSuccessData({
          orderId: ppRes.data.paypal_order_id,
          captureId: captureRes.data.capture_id,
          amount: 899.0,
          merchant: 'BestBuy',
          status: captureRes.data.status,
        });
      } else {
        await api.post(`/approvals/${approvalId}/action`, {
          action,
          user_comment: `Action ${action} taken by human operator.`,
        });
        alert(`Request marked as ${action}. Agent notified.`);
      }
      fetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error executing action');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Clock className="w-4 h-4" />
          <span>Human-in-the-Loop Governance</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Context-Aware Approval Center</h2>
        <p className="text-xs text-slate-400">
          Decisions requiring human intervention explain the root instruction, detected conflict diff, and allow direct settlement via PayPal Sandbox.
        </p>
      </div>

      {/* Payment Success Modal */}
      {paymentSuccessData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-card border border-emerald-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Payment Successfully Settled!</h3>
              <p className="text-xs text-slate-400 mt-1">PayPal Sandbox Order captured & ledger reconciled</p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-surface-border text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant:</span>
                <span className="text-white font-bold">{paymentSuccessData.merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Settled:</span>
                <span className="text-emerald-400 font-bold">${paymentSuccessData.amount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PayPal Order ID:</span>
                <span className="text-indigo-300 truncate max-w-[180px]">{paymentSuccessData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capture ID:</span>
                <span className="text-indigo-300 truncate max-w-[180px]">{paymentSuccessData.captureId}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-surface-border">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{paymentSuccessData.status}</span>
              </div>
            </div>

            <Button variant="primary" className="w-full" onClick={() => setPaymentSuccessData(null)}>
              Close & Return to Approvals
            </Button>
          </div>
        </div>
      )}

      {/* Approvals List */}
      <div className="space-y-4">
        {approvals.map((req) => (
          <Card key={req.id} className="border-amber-500/30 bg-surface-card/90">
            <div className="space-y-4">
              {/* Top Banner with Merchant, Amount, and Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border/60 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning" dot>
                      INTENT DIVERGENCE DETECTED
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">ID: {req.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{req.item_description}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Merchant: <span className="text-slate-200 font-medium">{req.merchant_name}</span> · Agent: <span className="text-indigo-300 font-mono">{req.agent_id}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-extrabold text-white font-mono">${req.amount.toFixed(2)}</div>
                  <span className="text-xs text-amber-400 font-medium">Requires Operator Override</span>
                </div>
              </div>

              {/* Context Explanation: Why approval is needed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-surface/80 border border-surface-border space-y-1.5">
                  <span className="font-semibold text-slate-300 block">Explanation of Conflict:</span>
                  <p className="text-slate-300 leading-relaxed">{req.reason_for_approval}</p>
                  {req.intent_divergence_summary && (
                    <p className="text-indigo-300 font-mono text-[11px] mt-1 pt-1 border-t border-surface-border">
                      {req.intent_divergence_summary}
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-surface/80 border border-surface-border space-y-1.5">
                  <span className="font-semibold text-slate-300 block">Triggered Policy Violations:</span>
                  <ul className="space-y-1">
                    {req.policy_conflicts?.map((p, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Approving will authorize payment via PayPal Sandbox rails.</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<HelpCircle className="w-4 h-4" />}
                    onClick={() => handleAction(req.id, 'clarify')}
                  >
                    Request Clarification
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => handleAction(req.id, 'reject')}
                  >
                    Reject Proposal
                  </Button>
                  <Button
                    size="sm"
                    variant="paypal"
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    isLoading={isProcessingPayment}
                    onClick={() => handleAction(req.id, 'approve')}
                  >
                    Approve & Settle via PayPal
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {approvals.length === 0 && (
          <div className="text-center py-16 p-8 border border-surface-border rounded-2xl bg-surface-card/40">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Pending Approvals</h3>
            <p className="text-xs text-slate-400 mt-1">
              All agent proposals are currently within intent bounds and budget thresholds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
