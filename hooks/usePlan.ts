"use client";

import useSWR from "swr";
import type { PlanId } from "@/lib/plan";

const fetcher = (u: string) => fetch(u).then(r => r.json());

export function usePlan() {
  const { data, mutate } = useSWR<{ plan: PlanId }>("/api/plan/me", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  const plan = (data?.plan ?? "free") as PlanId;

  async function changePlan(next: PlanId) {
    try {
      const r = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: next }),
      });
      const j = await r.json();
      
      if (j.checkoutUrl) {
        window.location.href = j.checkoutUrl;
        return;
      }
      
      // Refresh plan data after cookie update
      await mutate();
    } catch (error) {
      console.error("Error changing plan:", error);
    }
  }

  return { plan, changePlan };
}

