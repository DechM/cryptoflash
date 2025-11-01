"use client";

import { usePlan } from "@/hooks/usePlan";
import type { PlanId } from "@/lib/plan";
import { Crown, Zap, Shield, Sparkles, Check } from "lucide-react";

function Card({
  title,
  price,
  children,
  highlight,
  cta,
  onClick,
  current,
}: {
  title: string;
  price: string;
  children: React.ReactNode;
  highlight?: boolean;
  cta: string;
  onClick: () => void;
  current: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 w-full flex flex-col ${
        highlight
          ? "border-[#00ff88]/40 shadow-[0_0_40px_-12px_rgba(0,255,136,.45)] bg-gradient-to-br from-[#00ff88]/10 to-[#00d9ff]/10"
          : "border-white/10 bg-white/5"
      } backdrop-blur-lg`}
    >
      <div className="text-xl font-semibold mb-1 text-white">{title}</div>
      <div className="text-3xl mb-4 font-bold gradient-text">{price}</div>
      <div className="space-y-2 text-sm text-[#b8c5d6] mb-6 flex-grow">
        {children}
      </div>
      <button
        disabled={current}
        onClick={onClick}
        className={`mt-4 w-full h-11 rounded-xl font-semibold transition-all ${
          current
            ? "bg-white/10 cursor-not-allowed text-[#6b7280]"
            : highlight
            ? "bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black hover:opacity-90"
            : "bg-[#00ff88] text-black hover:bg-[#00ff88]/90"
        }`}
      >
        {current ? "Current Plan" : cta}
      </button>
    </div>
  );
}

export default function PlanCards() {
  const { plan, changePlan } = usePlan();

  const onSelect = (p: PlanId) => () => changePlan(p);

  return (
    <div className="grid md:grid-cols-3 gap-5 w-full">
      <Card
        title="Free"
        price="$0/mo"
        cta="Choose Free"
        onClick={onSelect("free")}
        current={plan === "free"}
      >
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-[#6b7280]" />
          <span>Basic Alerts (≥95%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-[#6b7280]" />
          <span>1 Token Tracking</span>
        </div>
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-[#6b7280]" />
          <span>10 Alerts/Day</span>
        </div>
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-[#6b7280]" />
          <span>Standard Dashboard</span>
        </div>
      </Card>

      <Card
        title="Pro"
        price="$4.99/mo"
        cta="Subscribe Now"
        highlight
        onClick={onSelect("pro")}
        current={plan === "pro"}
      >
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-[#00ff88]" />
          <span>Early Alerts (≥85%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-[#00ff88]" />
          <span>10 Token Tracking</span>
        </div>
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-[#00ff88]" />
          <span>Advanced Filters</span>
        </div>
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-[#00ff88]" />
          <span>History 30 days</span>
        </div>
      </Card>

      <Card
        title="Ultimate"
        price="$19.99/mo"
        cta="Subscribe Now"
        onClick={onSelect("ultimate")}
        current={plan === "ultimate"}
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-[#ff006e]" />
          <span>Earliest Alerts (≥80%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-[#ff006e]" />
          <span>Unlimited Tracking</span>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-[#ff006e]" />
          <span>Premium Analytics</span>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-[#ff006e]" />
          <span>API Access</span>
        </div>
      </Card>
    </div>
  );
}

