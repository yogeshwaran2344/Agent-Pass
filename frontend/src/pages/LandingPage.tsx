import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, BrainCircuit, Sliders, Zap, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Landing Nav */}
      <nav className="h-20 border-b border-surface-border px-8 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/40">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">AGENTPASS</span>
            <span className="ml-2 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase">
              Financial Control
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <span>Intent-Based Financial Governance for Autonomous AI Agents</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
          Don’t just restrict an agent’s budget.{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">
            Govern its original intention.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          A purchase can easily satisfy budget limits while completely violating what the user wanted.
          AGENTPASS is the trust and control gateway that enforces continuous semantic intent verification,
          two-phase commitment reservation, and PayPal Sandbox rails.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link to="/dashboard">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Governance Console
            </Button>
          </Link>
          <Link to="/register">
            <Button size="lg" variant="secondary">
              Register AI Agent
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl border border-surface-border bg-surface-card/70 backdrop-blur-md">
            <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Intent Consistency</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Catches negative constraint conflicts (e.g. "college laptop, no gaming") even when within spending limits.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-surface-border bg-surface-card/70 backdrop-blur-md">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Deterministic Guardrails</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Microsecond hard limits for per-transaction, daily velocity, merchant whitelists, and category firewalls.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-surface-border bg-surface-card/70 backdrop-blur-md">
            <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">PayPal Sandbox Rails</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Two-phase commitment reservations and human approval before any PayPal Sandbox capture order dispatches.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
