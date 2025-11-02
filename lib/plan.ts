export type PlanId = "free" | "pro" | "ultimate";

export type Feature =
  | "alerts.threshold_min"      // минимален праг за аларми (0..100)
  | "alerts.max_tokens"         // колко токъна може да траква
  | "alerts.max_per_day"        // лимит на дневни аларми
  | "alerts.whale"              // whale alerts (Ultimate only)
  | "refresh.ms"                // честота на обновяване
  | "filters.advanced"          // достъп до advanced филтри
  | "history.days"              // колко дни история
  | "analytics.premium"         // премиум метрики
  | "api.enabled";              // достъп до API

export const PLAN_LIMITS: Record<PlanId, Record<Feature, number | boolean>> = {
  free: {
    "alerts.threshold_min": 95,
    "alerts.max_tokens": 1,
    "alerts.max_per_day": 10,
    "alerts.whale": false,
    "refresh.ms": 30_000,
    "filters.advanced": false,
    "history.days": 0,
    "analytics.premium": false,
    "api.enabled": false,
  },
  pro: {
    "alerts.threshold_min": 85,
    "alerts.max_tokens": 10,
    "alerts.max_per_day": 100,
    "alerts.whale": false, // Pro: priority alerts only, no whale alerts
    "refresh.ms": 15_000,
    "filters.advanced": true,
    "history.days": 30,
    "analytics.premium": false,
    "api.enabled": false,
  },
  ultimate: {
    "alerts.threshold_min": 80,
    "alerts.max_tokens": 10_000, // Unlimited
    "alerts.max_per_day": 10_000, // Unlimited
    "alerts.whale": true, // Ultimate: whale alerts enabled
    "refresh.ms": 10_000,
    "filters.advanced": true,
    "history.days": 365, // 1 year
    "analytics.premium": true,
    "api.enabled": true,
  },
};

export function hasAdvanced(plan: PlanId): boolean {
  return Boolean(PLAN_LIMITS[plan]["filters.advanced"]);
}

export function getLimit<T extends Feature>(plan: PlanId, key: T): number | boolean {
  return PLAN_LIMITS[plan][key];
}

