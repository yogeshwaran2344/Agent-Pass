import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X, ShieldCheck, Lock, CreditCard, GitFork } from 'lucide-react';
import { Button } from '../components/common/Button';
import { BrandMark } from '../components/common/BrandMark';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F4EF] text-stone-900 flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-[#1A473B] bg-[#081F19] text-white">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark className="w-7 h-7" />
            <span className="font-bold text-base tracking-tight">AgentPass</span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded">
              PayPal Sandbox Ready
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-emerald-100 hover:text-white hover:bg-white/10">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Create account</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Rich Forest Pine Hero Band */}
      <section className="bg-[#0D2D24] text-white border-b border-[#1A473B]">
        <div className="max-w-6xl mx-auto px-6 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Product Positioning */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Intent-Based Spend Governance &amp; PayPal Rails</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.12]">
              Verify agent{' '}
              <span className="text-amber-400">intent</span>, not just dollar limits.
            </h1>

            <p className="text-base text-emerald-100/80 leading-relaxed max-w-xl">
              An AI agent can stay within budget and still buy the wrong product.
              AgentPass checks every proposed checkout against the user&apos;s original
              instruction, locks reservations with 2-phase commits, and settles via PayPal.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/dashboard">
                <Button size="lg" variant="paypal" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Open Console
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-emerald-400/40 text-white hover:bg-white/10 hover:text-white"
                >
                  Create Operator Account
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Live Inspection Card */}
          <div className="lg:col-span-6">
            <div className="rounded-lg border border-[#E5E2D9] bg-white text-stone-900 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E2D9] bg-emerald-800 text-white flex items-center justify-between text-xs">
                <span className="font-mono font-medium">
                  POST /api/v1/intents/evaluate
                </span>
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[11px] font-semibold">
                  BLOCKED · HARD_CONFLICT
                </span>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider mb-1">
                    Stored Master Instruction
                  </div>
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 font-mono text-stone-800 leading-relaxed">
                    &quot;Buy a laptop for college. Prioritize battery life. Do not purchase gaming laptops. Budget under $1,000.&quot;
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md border border-[#E5E2D9] bg-[#FAF8F4]">
                    <div className="text-[11px] text-stone-500 mb-0.5">Proposed Item</div>
                    <div className="font-semibold text-stone-900">ROG Zephyrus RTX 4070 Gaming</div>
                  </div>
                  <div className="p-3 rounded-md border border-[#E5E2D9] bg-[#FAF8F4]">
                    <div className="text-[11px] text-stone-500 mb-0.5">Proposed Amount</div>
                    <div className="font-mono font-semibold text-amber-800 tabular-nums">$899.00 USD</div>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-700 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-700" />
                      Per-transaction &amp; daily budget limit
                    </span>
                    <span className="font-mono text-emerald-700 font-semibold">PASS ($899 &le; $1,000)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-700 flex items-center gap-1.5">
                      <X className="w-4 h-4 text-red-600" />
                      Negative constraint (&quot;gaming laptops&quot;)
                    </span>
                    <span className="font-mono text-red-700 font-semibold">VIOLATED</span>
                  </div>
                </div>

                <div className="px-3 py-2 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-medium">
                  PayPal order creation halted. Escalated to human approval queue.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Capabilities */}
      <section className="max-w-6xl mx-auto w-full px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-lg border border-emerald-200 border-t-4 border-t-emerald-700 bg-white shadow-card">
            <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1.5">Intent Verification</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Extracts priorities, negative constraints, and price caps from prompts before checkout.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-teal-200 border-t-4 border-t-teal-600 bg-white shadow-card">
            <div className="w-9 h-9 rounded-md bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1.5">2-Phase Commitments</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Reserves funds with TTL holds to eliminate multi-agent race conditions and double spend.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-amber-200 border-t-4 border-t-amber-500 bg-white shadow-card">
            <div className="w-9 h-9 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3">
              <GitFork className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1.5">Delegation Chains</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Sub-agents inherit parent restrictions strictly with cycle detection and instant revocation.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-orange-200 border-t-4 border-t-orange-600 bg-white shadow-card">
            <div className="w-9 h-9 rounded-md bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700 mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1.5">PayPal Sandbox Rails</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Live v2 Orders API checkout, idempotent capture webhooks, and cryptographic audit trails.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
