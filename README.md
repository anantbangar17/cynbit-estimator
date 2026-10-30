# Cynbit Project Estimator (prototype)

An instant price-and-timeline estimator for Cynbit Technologies. Visitors pick a project type, features and urgency, see a live itemised quote, and can leave their details to receive it. The sales team gets a structured lead instead of a vague message.

## Why
The Cynbit site has no pricing guidance, so a visitor must book a call just to learn whether the company is affordable. This gives value first, then asks for contact details.

## Stack
Next.js 14 (App Router) + TypeScript, Zod validation, Vitest, plain CSS. Supabase (REST) for leads and Resend for email are optional: without env vars the API logs leads to the server console.

## Run
    npm install
    npm run dev        # http://localhost:3000
    npm test           # pricing unit tests
Copy `.env.example` to `.env.local` and run `supabase/schema.sql` to store leads.

## How it works
- `lib/pricing.json`: all prices in one file. Change numbers here, no code edits. Current values are placeholders.
- `lib/estimate.ts`: pure pricing function, shared by browser (live preview) and server.
- `app/api/estimate/route.ts`: validates input, **recomputes the price on the server** so a tampered browser can't fake a quote, drops honeypot bots, rate-limits per email, saves the lead, emails the team.

## Known limitations
- Rate limiting is in memory (resets on serverless cold start). Use a database or Redis in production.
- No auto-reply to the visitor: Resend's test sender only delivers to your own address until a domain is verified.
- Prices are invented for the demo.
