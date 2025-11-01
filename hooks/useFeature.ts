"use client";

import { getLimit } from "@/lib/plan";
import { usePlan } from "@/hooks/usePlan";
import type { Feature } from "@/lib/plan";

export function useFeature() {
  const { plan } = usePlan();

  return {
    plan,
    limit: <T extends Feature>(k: T): number | boolean => getLimit(plan, k),
    isEnabled: <T extends Feature>(k: T): boolean => Boolean(getLimit(plan, k)),
  };
}

