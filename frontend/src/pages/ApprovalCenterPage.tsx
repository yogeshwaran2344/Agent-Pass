import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Check,
  Clock,
  Zap,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ApprovalRequest } from '../types';
import { approvalService, paypalService, transactionService } from '../services';
import { getErrorMessage } from '../services/api';

export const ApprovalCenterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PayPal Live Checkout Pending Approval state
  const [pendingPayPalCheckout, setPendingPayPalCheckout] = useState<{
    orderId: string;
    approveUrl: string;
    amount: number;
    merchant: string;
  } | null>(null);

  // PayPal Payment Modal / Success state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const data = await approvalService.getPendingApprovals();
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load pending approvals', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // Auto-capture if user returns from PayPal Sandbox Checkout (?token=<ORDER_ID>)
  useEffect(() => {
    const returnedOrderId = searchParams.get('token');
    if (returnedOrderId) {
      const finalizeReturnedOrder = async () => {
        setIsProcessingPayment(true);
        setBanner(null);
        try {
          const captureRes = await paypalService.captureOrder(returnedOrderId);
          setPaymentSuccessData({
            orderId: returnedOrderId,
            captureId: captureRes.capture_id,
            amount: pendingPayPalCheckout?.amount || 0,
            merchant: pendingPayPalCheckout?.merchant || 'PayPal Merchant',
            status: captureRes.status,
          });
          setPendingPayPalCheckout(null);
          searchParams.delete('token');
          searchParams.delete('PayerID');
          setSearchParams(searchParams, { replace: true });
          await fetchApprovals();
        } catch (err) {
          setBanner({ type: 'error', text: getErrorMessage(err) });
        } finally {
          setIsProcessingPayment(false);
        }
      };
      finalizeReturnedOrder();
    }
  }, [searchParams]);

  const handleCapturePendingOrder = async () => {
    if (!pendingPayPalCheckout) return;
    setIsProcessingPayment(true);
    setBanner(null);
    try {
      const captureRes = await paypalService.captureOrder(pendingPayPalCheckout.orderId);
      setPaymentSuccessData({
        orderId: pendingPayPalCheckout.orderId,
        captureId: captureRes.capture_id,
        amount: pendingPayPalCheckout.amount,
        merchant: pendingPayPalCheckout.merchant,
        status: captureRes.status,
      });
      setPendingPayPalCheckout(null);
      await fetchApprovals();
    } catch (err) {
      setBanner({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAction = async (approval: ApprovalRequest, action: 'approve' | 'reject' | 'clarify') => {
    setBanner(null);
    try {
      if (action === 'approve') {
        setIsProcessingPayment(true);
        // Step 1: Record human approval in backend
        await approvalService.takeAction(approval.id, 'approve', 'Approved manual override by operator.');

        // Step 2: Create transaction authorized with this human approval ID
        const txRes = await transactionService.createTransaction({
          agent_id: approval.agent_id,
          approval_id: approval.id,
          amount: approval.amount,
          merchant: approval.merchant_name,
          payment_method: 'paypal_sandbox',
          idempotency_key: `appr_${approval.id}`,
        });

        // Step 3: Create PayPal order on Sandbox REST API via backend
        const returnUrl = `${window.location.origin}/approvals`;
        const cancelUrl = `${window.location.origin}/approvals`;
        const ppOrder = await paypalService.createOrder(txRes.id, returnUrl, cancelUrl);

        // Step 4: If live PayPal Sandbox returned an approval URL, prompt buyer checkout;
        // otherwise (mock sandbox mode) capture immediately!
        if (ppOrder.approve_url) {
          setPendingPayPalCheckout({
            orderId: ppOrder.paypal_order_id,
            approveUrl: ppOrder.approve_url,
            amount: approval.amount,
            merchant: approval.merchant_name,
          });
        } else {
          const captureRes = await paypalService.captureOrder(ppOrder.paypal_order_id);
          setPaymentSuccessData({
            orderId: ppOrder.paypal_order_id,
            captureId: captureRes.capture_id,
            amount: approval.amount,
            merchant: approval.merchant_name,
            status: captureRes.status,
          });
        }
      } else {
        await approvalService.takeAction(
          approval.id,
          action,
          `Action ${action} initiated by human operator.`
        );
        setBanner({
          type: 'success',
          text: `Request marked as ${action}. Autonomous agent notified.`,
        });
      }
      await fetchApprovals();
    } catch (err) {
      setBanner({ type: 'error', text: getErrorMessage(err) });
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

      {banner && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            banner.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{banner.text}</span>
        </div>
      )}

      {/* Live PayPal Sandbox Buyer Checkout Modal */}
      {pendingPayPalCheckout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-card border border-amber-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <Badge variant="warning" dot>LIVE PAYPAL SANDBOX ORDER CREATED</Badge>
              <h3 className="text-lg font-bold text-white mt-3">Complete PayPal Sandbox Checkout</h3>
              <p className="text-xs text-slate-400 mt-1">
                Order <span className="font-mono text-indigo-300">{pendingPayPalCheckout.orderId}</span> requires Sandbox Buyer approval before funds can be captured.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-surface-border text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant:</span>
                <span className="text-white font-bold">{pendingPayPalCheckout.merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="text-amber-400 font-bold">${pendingPayPalCheckout.amount.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <a
                href={pendingPayPalCheckout.approveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0070ba] hover:bg-[#005ea6] text-white text-xs font-bold transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>1. Open PayPal Sandbox Checkout</span>
              </a>
              <Button
                variant="primary"
                className="w-full"
                isLoading={isProcessingPayment}
                onClick={handleCapturePendingOrder}
              >
                2. Capture & Settle Approved Order
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setPendingPayPalCheckout(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

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
                <span className="text-emerald-400 font-bold">
                  {paymentSuccessData.amount ? `$${paymentSuccessData.amount.toFixed(2)} USD` : 'Confirmed'}
                </span>
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

      {/* Loading */}
      {isLoading && approvals.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <p className="text-xs text-slate-400">Checking pending approval requests in backend...</p>
        </div>
      ) : (
        /* Approvals List */
        <div className="space-y-4">
          {approvals.map((req) => (
            <Card key={req.id} className="border-amber-500/30 bg-surface-card/90">
              <div className="space-y-4">
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
                      onClick={() => handleAction(req, 'clarify')}
                    >
                      Request Clarification
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<XCircle className="w-4 h-4" />}
                      onClick={() => handleAction(req, 'reject')}
                    >
                      Reject Proposal
                    </Button>
                    <Button
                      size="sm"
                      variant="paypal"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      isLoading={isProcessingPayment}
                      onClick={() => handleAction(req, 'approve')}
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
      )}
    </div>
  );
};
