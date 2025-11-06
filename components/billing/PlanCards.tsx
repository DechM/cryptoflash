"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlan } from "@/hooks/usePlan";
import { useSession } from "@/hooks/useSession";
import type { PlanId } from "@/lib/plan";
import { Crown, Zap, Shield, Sparkles, Check, Lock } from "lucide-react";
import { SolanaPayModal } from "./SolanaPayModal";
import Link from "next/link";

function Card({
  title,
  price,
  children,
  highlight,
  cta,
  onClick,
  current,
  disabled,
  disabledMessage,
}: {
  title: string;
  price: string;
  children: React.ReactNode;
  highlight?: boolean;
  cta: string;
  onClick: () => void;
  current: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 md:p-6 w-full flex flex-col ${
        highlight
          ? "border-[#00FFA3]/40 shadow-[0_0_40px_-12px_rgba(0,255,163,.45)] bg-gradient-to-br from-[#00FFA3]/10 to-[#00D1FF]/10"
          : "border-white/10 bg-white/5"
      } backdrop-blur-lg`}
    >
      <div className="text-lg md:text-xl font-semibold mb-1 text-white">{title}</div>
      <div className="text-2xl md:text-3xl mb-4 font-bold gradient-text">{price}</div>
      <div className="space-y-2 text-xs md:text-sm text-[#b8c5d6] mb-6 flex-grow">
        {children}
      </div>
      <div className="relative">
        <button
          disabled={current || disabled}
          onClick={onClick}
          title={disabled ? disabledMessage : undefined}
          className={`mt-4 w-full rounded-xl font-semibold transition-all ${
            current
              ? "bg-white/10 cursor-not-allowed text-[#6b7280] min-h-[44px] h-11 md:h-12"
              : disabled
              ? "bg-white/5 cursor-not-allowed text-[#6b7280] border border-white/10 min-h-[36px] md:min-h-[44px] h-9 md:h-11"
              : highlight
              ? "btn-cta-upgrade"
              : "btn-cta-premium"
          }`}
        >
          {current ? "Current Plan" : disabled ? (
            <span className="flex items-center justify-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Login to Purchase</span>
            </span>
          ) : (
            cta
          )}
        </button>
        {disabled && disabledMessage && (
          <p className="mt-2 text-xs text-center text-[#6b7280]">{disabledMessage}</p>
        )}
      </div>
    </div>
  );
}

export default function PlanCards() {
  const router = useRouter()
  const { plan, changePlan } = usePlan();
  const { user, loading: sessionLoading } = useSession();
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    solanaPayUrl: string;
    sessionId: string;
    plan: 'pro' | 'ultimate';
    amount: number;
  } | null>(null);

  const handleSolanaPay = async (selectedPlan: 'pro' | 'ultimate') => {
    // Check if user is logged in
    if (!user) {
      router.push(`/login?next=${encodeURIComponent('/premium')}`)
      return
    }

    try {
      const response = await fetch('/api/pay/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: selectedPlan })
      });

      const data = await response.json();

      if (data.error) {
        if (data.error.includes('Authentication') || response.status === 401) {
          router.push(`/login?next=${encodeURIComponent('/premium')}`)
          return
        }
        alert(data.error);
        return;
      }

      setPaymentModal({
        isOpen: true,
        solanaPayUrl: data.solanaPayUrl,
        sessionId: data.sessionId,
        plan: selectedPlan,
        amount: data.amount
      });
    } catch (error: any) {
      console.error('Error creating payment session:', error);
      alert('Failed to create payment session');
    }
  };

  const handlePaymentSuccess = async () => {
    // Refresh plan state
    await changePlan(paymentModal?.plan || 'free');
  };

  const onSelect = (p: PlanId) => () => {
    if (p === 'free') {
      changePlan('free');
    } else {
      // For Pro/Ultimate, use Solana Pay
      handleSolanaPay(p as 'pro' | 'ultimate');
    }
  };

  return (
    <>
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
            <span>30s Refresh</span>
          </div>
        </Card>

        <Card
          title="Pro"
          price="19.99 USDC/mo"
          cta="Pay with Solana"
          highlight
          onClick={onSelect("pro")}
          current={plan === "pro"}
          disabled={!user && !sessionLoading}
          disabledMessage={!user ? "Login required to purchase" : undefined}
        >
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-[#00FFA3]" />
            <span>Early Alerts (≥85%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-[#00FFA3]" />
            <span>10 Token Tracking</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-[#00FFA3]" />
            <span>Advanced Filters</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-[#00FFA3]" />
            <span>History 30 days</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-[#00FFA3]" />
            <span>Priority Alerts</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-[#00FFA3]" />
            <span>15s Refresh</span>
          </div>
        </Card>

        <Card
          title="Ultimate"
          price="39.99 USDC/mo"
          cta="Pay with Solana"
          onClick={onSelect("ultimate")}
          current={plan === "ultimate"}
          disabled={!user && !sessionLoading}
          disabledMessage={!user ? "Login required to purchase" : undefined}
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-[#FF2E86]" />
            <span>Earliest Alerts (≥80%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-[#FF2E86]" />
            <span>Unlimited Tracking</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-[#FF2E86]" />
            <span>Whale Alerts</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-[#FF2E86]" />
            <span>Premium Analytics</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-[#FF2E86]" />
            <span>History 365 days</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-[#FF2E86]" />
            <span>10s Refresh</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-[#FF2E86]" />
            <span>Test Alert</span>
          </div>
        </Card>
      </div>

      {paymentModal && (
        <SolanaPayModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal(null)}
          solanaPayUrl={paymentModal.solanaPayUrl}
          sessionId={paymentModal.sessionId}
          plan={paymentModal.plan}
          amount={paymentModal.amount}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}

