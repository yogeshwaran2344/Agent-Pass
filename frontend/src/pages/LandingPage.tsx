import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { Button } from '../components/common/Button';
import { BrandMark } from '../components/common/BrandMark';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-[#1E3354] bg-[#0F1E36] text-white">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark className="w-7 h-7" />
            <span className="font-bold text-base tracking-tight">AgentPass</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-slate-200 hover:text-white hover:bg-white/10">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Create account</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Product Positioning */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-800 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Intent-Based Spend Governance &amp; PayPal Sandbox</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0F1E36] leading-[1.12]">
              Spending limits aren&apos;t enough. Verify agent{' '}
              <span className="text-blue-700">intent</span> before settlement.
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              An AI agent can stay within your dollar budget and still buy the wrong item.
              AgentPass intercepts proposed checkouts, compares them against the user&apos;s
              original instruction, locks funds via two-phase commitments, and settles over PayPal.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/dashboard">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Open Console
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="secondary">
                  Create Operator Account
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Concrete API Interception Inspector */}
          <div className="lg:col-span-6">
            <div className="rounded-lg border border-slate-200 border-t-2 border-t-blue-600 bg-white shadow-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-[#0F1E36] text-white flex items-center justify-between text-xs">
                <span className="font-mono font-medium text-blue-200">
                  POST /api/v1/intents/evaluate
                </span>
                <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-400/40 text-red-200 font-mono text-[11px] font-semibold">
                  BLOCKED · HARD_CONFLICT
                </span>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Stored Master Instruction
                  </div>
                  <div className="p-3 rounded-md bg-blue-50/60 border border-blue-200 font-mono text-slate-800 leading-relaxed">
                    &quot;Buy a laptop for college. Prioritize battery life. Do not purchase gaming laptops. Budget under $1,000.&quot;
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md border border-slate-200 bg-slate-50/70">
                    <div className="text-[11px] text-slate-500 mb-0.5">Proposed Item</div>
                    <div className="font-semibold text-slate-900">ROG Zephyrus RTX 4070 Gaming</div>
                  </div>
                  <div className="p-3 rounded-md border border-slate-200 bg-slate-50/70">
                    <div className="text-[11px] text-slate-500 mb-0.5">Proposed Amount</div>
                    <div className="font-mono font-semibold text-blue-700 tabular-nums">$899.00 USD</div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Per-transaction &amp; daily budget limit
                    </span>
                    <span className="font-mono text-emerald-700 font-medium">PASS ($899 &le; $1,000)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5 text-red-600" />
                      Negative constraint (&quot;gaming laptops&quot;)
                    </span>
                    <span className="font-mono text-red-700 font-medium">VIOLATED</span>
                  </div>
                </div>

                <div className="px-3 py-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                  PayPal order creation halted. Escalated to human approval queue.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Architectural Capabilities */}
        <div className="mt-16 pt-10 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-lg border border-slate-200 border-t-2 border-t-blue-600 bg-white shadow-subtle">
            <span className="text-[11px] font-mono font-semibold text-blue-700">01 · SEMANTIC GATE</span>
            <h3 className="text-sm font-semibold text-slate-900 mt-1 mb-1.5">
              Intent Verification
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Extracts positive priorities, prohibited categories, and budget ceilings from natural prompts, catching drift before funds move.
            </p>
          </div>
          <div className="p-5 rounded-lg border border-slate-200 border-t-2 border-t-teal-600 bg-white shadow-subtle">
            <span className="text-[11px] font-mono font-semibold text-teal-700">02 · DETERMINISTIC LEDGER</span>
            <h3 className="text-sm font-semibold text-slate-900 mt-1 mb-1.5">
              Two-Phase Commitments &amp; Delegations
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Reserves budget allocations atomically with TTL locks and enforces parent-to-child spending invariance with cycle detection.
            </p>
          </div>
          <div className="p-5 rounded-lg border border-slate-200 border-t-2 border-t-[#0070BA] bg-white shadow-subtle">
            <span className="text-[11px] font-mono font-semibold text-[#0070BA]">03 · PAYPAL RAILS</span>
            <h3 className="text-sm font-semibold text-slate-900 mt-1 mb-1.5">
              Kill Switch &amp; PayPal Checkout
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Revoke single agents, delegation sub-trees, or global access instantly. Settle approved orders through PayPal Sandbox with webhook idempotency.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
