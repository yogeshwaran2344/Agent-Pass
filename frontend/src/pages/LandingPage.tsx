import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { Button } from '../components/common/Button';
import { BrandMark } from '../components/common/BrandMark';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark className="w-7 h-7" />
            <span className="font-bold text-base tracking-tight text-slate-900">AgentPass</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Create account</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Product Positioning */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 text-xs font-medium shadow-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Deterministic Spend Controls &amp; PayPal Sandbox</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12]">
              Spending limits aren&apos;t enough. Verify agent intent before settlement.
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              An AI agent can stay within your dollar budget and still buy the wrong item.
              AgentPass intercepts proposed checkouts, checks them against the user&apos;s
              original instruction, reserves funds via two-phase commitments, and settles over PayPal.
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
            <div className="rounded-lg border border-slate-200 bg-white shadow-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <span className="font-mono font-medium text-slate-600">
                  POST /api/v1/intents/evaluate
                </span>
                <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 font-mono text-[11px] font-semibold">
                  BLOCKED · HARD_CONFLICT
                </span>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Stored Master Instruction
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200 font-mono text-slate-800 leading-relaxed">
                    &quot;Buy a laptop for college. Prioritize battery life. Do not purchase gaming laptops. Budget under $1,000.&quot;
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md border border-slate-200 bg-white">
                    <div className="text-[11px] text-slate-400 mb-0.5">Proposed Item</div>
                    <div className="font-medium text-slate-900">ROG Zephyrus RTX 4070 Gaming</div>
                  </div>
                  <div className="p-3 rounded-md border border-slate-200 bg-white">
                    <div className="text-[11px] text-slate-400 mb-0.5">Proposed Amount</div>
                    <div className="font-mono font-semibold text-slate-900 tabular-nums">$899.00 USD</div>
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
        <div className="mt-20 pt-12 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
              1. Intent Verification
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Extracts positive priorities, prohibited categories, and budget ceilings from natural prompts, catching drift before funds move.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
              2. Two-Phase Commitments &amp; Delegations
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Reserves budget allocations atomically with TTL locks and enforces parent-to-child spending invariance with cycle detection.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
              3. Scoped Kill Switch &amp; PayPal Rails
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Revoke single agents, delegation sub-trees, or global access instantly. Settle approved purchases through PayPal Sandbox with webhook idempotency.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
