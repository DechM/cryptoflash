import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map(s => s.trim());
  const planCookie = cookies.find(s => s.startsWith("cf_plan="));
  const plan = planCookie?.split("=")[1] || "free";
  
  // Validate plan
  const validPlans = ["free", "pro", "ultimate"];
  const validPlan = validPlans.includes(plan) ? plan : "free";
  
  return NextResponse.json({ plan: validPlan });
}

