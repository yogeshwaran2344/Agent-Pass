import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Check,
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

  const [pendingPayPalCheckout, setPendingPayPalCheckout] = useState<{
    orderId: string;
    approveUrl: string;
    amount: number;
    merchant: string;
  } | null>(null);

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
        await approvalService.takeAction(approval.id, 'approve', 'Approved manual override by operator.');

        const txRes = await transactionService.createTransaction({
          agent_id: approval.agent_id,
          approval_id: approval.id,
          amount: approval.amount,
          merchant: approval.merchant_name,
          payment_method: 'paypal_sandbox',
          idempotency_key: `appr_${approval.id}`,
        });

        const returnUrl = `${window.location.origin}/approvals`;
        const cancelUrl = `${window.location.origin}/approvals`;
        const ppOrder = await paypalService.createOrder(txRes.id, returnUrl, cancelUrl);

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
          `Action ${action} initiated by operator.`
        );
        setBanner({
          type: 'success',
          text: `Request marked as ${action}.`,
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Approval Queue</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review flagged transactions, inspect constraint diffs, and authorize PayPal Sandbox captures.
        </p>
      </div>

      {banner && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center gap-2 ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{banner.text}</span>
        </div>
      )}

      {pendingPayPalCheckout && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-lg p-6 shadow-xl space-y-4">
            <div>
              <Badge variant="warning" dot>PAYPAL CHECKOUT PENDING</Badge>
              <h3 className="text-base font-semibold text-slate-900 mt-3">Complete PayPal Sandbox Checkout</h3>
              <p className="text-xs text-slate-500 mt-1">
                Order <span className="font-mono text-slate-800">{pendingPayPalCheckout.orderId}</span> requires Sandbox Buyer approval before capture.
              </p>
            </div>

            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant</span>
                <span className="text-slate-900 font-semibold">{pendingPayPalCheckout.merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="text-slate-900 font-semibold tabular-nums">${pendingPayPalCheckout.amount.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={pendingPayPalCheckout.approveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#0070ba] hover:bg-[#005ea6] text-white text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>1. Open PayPal Sandbox Checkout</span>
              </a>
              <Button
                variant="primary"
                className="w-full"
                isLoading={isProcessingPayment}
                onClick={handleCapturePendingOrder}
              >
                2. Capture &amp; Settle Approved Order
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

      {paymentSuccessData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-lg p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <Check className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-semibold text-slate-900">Payment Settled</h3>
              <p className="text-xs text-slate-500 mt-1">PayPal Sandbox capture confirmed and reconciled</p>
            </div>

            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant</span>
                <span className="text-slate-900 font-semibold">{paymentSuccessData.merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="text-emerald-700 font-semibold tabular-nums">
                  {paymentSuccessData.amount ? `$${paymentSuccessData.amount.toFixed(2)} USD` : 'Confirmed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID</span>
                <span className="text-slate-800 truncate max-w-[180px]">{paymentSuccessData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Capture ID</span>
                <span className="text-slate-800 truncate max-w-[180px]">{paymentSuccessData.captureId}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Status</span>
                <span className="text-emerald-700 font-semibold">{paymentSuccessData.status}</span>
              </div>
            </div>

            <Button variant="primary" className="w-full" onClick={() => setPaymentSuccessData(null)}>
              Done
            </Button>
          </div>
        </div>
      )}

      {isLoading && approvals.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          <p className="text-xs text-slate-500">Loading pending approval requests...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((req) => (
            <Card key={req.id}>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" dot>REVIEW REQUIRED</Badge>
                      <span className="text-xs text-slate-400 font-mono">{req.id}</span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mt-1">{req.item_description}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Merchant: <span className="text-slate-800 font-medium">{req.merchant_name}</span> · Agent: <span className="font-mono text-slate-700">{req.agent_id}</span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-xl font-semibold text-slate-900 font-mono tabular-nums">${req.amount.toFixed(2)}</div>
                    <span className="text-[11px] text-amber-700 font-medium">Awaiting operator sign-off</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-medium text-slate-700 block">Conflict Summary</span>
                    <p className="text-slate-600 leading-relaxed">{req.reason_for_approval}</p>
                    {req.intent_divergence_summary && (
                      <p className="text-slate-700 font-mono text-[11px] mt-1.5 pt-1.5 border-t border-slate-200">
                        {req.intent_divergence_summary}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="font-medium text-slate-700 block">Policy Violations</span>
                    <ul className="space-y-1">
                      {req.policy_conflicts?.map((p, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-red-700">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Approving dispatches payment authorization to PayPal Sandbox.
                  </span>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleAction(req, 'clarify')}
                    >
                      Clarify
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleAction(req, 'reject')}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="paypal"
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      isLoading={isProcessingPayment}
                      onClick={() => handleAction(req, 'approve')}
                    >
                      Approve &amp; Pay via PayPal
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {approvals.length === 0 && (
            <div className="text-center py-14 p-8 border border-slate-200 rounded-lg bg-white shadow-subtle">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900">No pending approvals</h3>
              <p className="text-xs text-slate-500 mt-1">
                All agent proposals are within policy limits and intent constraints.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
