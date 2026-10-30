import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/schema";
import { calculateEstimate, formatINR } from "@/lib/estimate";

const recent = new Map<string, number[]>(); // in-memory limiter; fine for a prototype, use Redis/DB in production

function limited(email: string) {
  const now = Date.now();
  const hits = (recent.get(email) ?? []).filter((t) => now - t < 5 * 60_000);
  hits.push(now);
  recent.set(email, hits);
  return hits.length > 3;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { website, ...lead } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // bot: pretend it worked

  if (limited(lead.email)) {
    return NextResponse.json({ error: "Too many requests. Please try again in a few minutes." }, { status: 429 });
  }

  // Never trust a price sent by the browser: recompute it on the server.
  let estimate;
  try {
    estimate = calculateEstimate(lead);
  } catch {
    return NextResponse.json({ error: "Invalid selection." }, { status: 400 });
  }

  const row = {
    name: lead.name, email: lead.email, phone: lead.phone || null,
    project_type: lead.projectType, features: lead.features, timeline: lead.timeline,
    price_min: estimate.priceMin, price_max: estimate.priceMax,
    days_min: estimate.daysMin, days_max: estimate.daysMax,
  };

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, TEAM_EMAIL } = process.env;

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/estimates`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      console.error("Supabase insert failed", res.status, await res.text());
      return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 500 });
    }
  } else {
    console.log("[lead] Supabase not configured, logging instead:", row);
  }

  if (RESEND_API_KEY && TEAM_EMAIL) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Cynbit Estimator <onboarding@resend.dev>",
          to: TEAM_EMAIL,
          subject: `New estimate lead: ${lead.name} (${formatINR(estimate.priceMin)} - ${formatINR(estimate.priceMax)})`,
          text: [
            `Name: ${lead.name}`, `Email: ${lead.email}`, `Phone: ${lead.phone || "-"}`,
            `Project: ${lead.projectType}`, `Features: ${lead.features.join(", ") || "none"}`,
            `Timeline: ${lead.timeline}`,
            `Estimate: ${formatINR(estimate.priceMin)} - ${formatINR(estimate.priceMax)}, ${estimate.daysMin}-${estimate.daysMax} days`,
          ].join("\n"),
        }),
      });
    } catch (e) {
      console.error("Email failed (lead already saved)", e); // don't fail the request over email
    }
  }

  return NextResponse.json({ ok: true, estimate });
}
