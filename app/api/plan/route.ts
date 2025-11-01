import { NextResponse } from "next/server";
import type { PlanId } from "@/lib/plan";

const COOKIE = "cf_plan";

export async function GET() {
  const res = NextResponse.json({ plan: "free" });
  return res;
}

export async function POST(req: Request) {
  try {
    const { plan } = await req.json().catch(() => ({ plan: "free" }));
    const pid = (plan as PlanId) ?? "free";

    // Ако има Stripe ключове → създай checkout session и върни URL
    const secret = process.env.STRIPE_SECRET_KEY;
    const priceId = pid === "pro" 
      ? process.env.STRIPE_PRICE_PRO 
      : pid === "ultimate" 
      ? process.env.STRIPE_PRICE_ULTIMATE 
      : undefined;

    if (secret && priceId && pid !== "free") {
      try {
        const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            mode: "subscription",
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/premium?status=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/premium?status=cancel`,
            "line_items[0][price]": priceId,
            "line_items[0][quantity]": "1",
          }).toString(),
        });

        const data = await response.json();
        if (data.url) {
          return NextResponse.json({ checkoutUrl: data.url });
        }
      } catch (e: any) {
        console.error("Stripe checkout error:", e.message);
        // Fall through to mock upgrade
      }
    }

    // Мок ъпгрейд: запис в cookie и връщаме ok
    const res = NextResponse.json({ ok: true, plan: pid, mock: !secret || !priceId });
    res.cookies.set(COOKIE, pid, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return res;
  } catch (error: any) {
    console.error("Error in plan POST:", error);
    return NextResponse.json(
      { error: "Failed to process plan change" },
      { status: 500 }
    );
  }
}

