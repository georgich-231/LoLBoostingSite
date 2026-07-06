# RiftProgress

Modern, mobile-first League of Legends elo boosting and ranked progression platform.

RiftProgress is built around elo boost order workflows: Riot Sign On/OAuth-ready account linking, profile dashboards, LP snapshots, match history, booster marketplace, Stripe-ready checkout, order tracking, booster tools, and admin operations. The product intentionally does not ask for Riot usernames/passwords or MFA changes.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- shadcn-style local UI primitives in `src/components/ui`
- Framer Motion for section animation
- Prisma + PostgreSQL schema in `prisma/schema.prisma`
- Stripe checkout service boundary in `src/server/services/stripe.ts`
- Riot OAuth/API service boundary in `src/server/services/riot.ts`
- Seed data in `prisma/seed.ts` for service catalog rows and a local test account

## MVP Pages

- `/` landing page with progression preview, services, trust, and FAQ
- `/auth` platform account and Riot linking onboarding
- `/dashboard` linked LoL profile, rank/LP, match history, champion stats, role performance, goals
- `/marketplace` services, booster cards, service configurator
- `/checkout` multi-step order flow
- `/orders` order dashboard, milestones, files, chat, notifications
- `/orders` real user boost history, payments, and milestones
- `/admin` users/orders, booster verification, Riot sync health, payments/refunds, audit logs

## API Routes

- `GET /api/profile`
- `GET /api/services`
- `GET|POST /api/orders`
- `GET /api/riot/link/start`
- `GET /api/riot/link/callback`
- `POST /api/riot/manual-link`
- `POST /api/riot/unlink`
- `GET|POST /api/riot/refresh`
- `POST /api/checkout/session`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`
- `GET /api/auth/discord/start`
- `GET /api/auth/discord/callback`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run prisma:generate
npm run db:push
npm run seed
npm run dev
```

Open `http://localhost:3000`.

## Database

Set `DATABASE_URL` in `.env.local`, then:

```bash
npm run db:push
npm run seed
```

Seeded account password:

```text
RiftProgress!2026
```

## Riot Integration Notes

The app now uses real Riot API calls when credentials are configured:

- `RIOT_API_KEY` is required for manual Riot ID linking and profile refresh.
- `RIOT_CLIENT_ID`, `RIOT_CLIENT_SECRET`, and `RIOT_REDIRECT_URI` are required for Riot Sign On/OAuth.
- `OAUTH_TOKEN_ENCRYPTION_KEY` is required before OAuth tokens can be stored.
- Riot OAuth requires a Production-level Riot integration approval.
- Riot credentials and API keys are never exposed to the browser.
- The dashboard syncs account-v1, summoner-v4, league-v4, match-v5, and Data Dragon assets.
- Redis-backed caching/rate-limit queues are still the recommended next production hardening step.

## Google and Discord Login

Google and Discord login use OAuth authorization-code flow and create or link a local `User` through the `OAuthAccount` table.

Add these values to `.env.local`:

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/discord/callback"
```

Register the exact redirect URLs in the Google Cloud Console and Discord Developer Portal. The Google scopes are `openid email profile`; Discord scopes are `identify email`.

## Stripe Notes

`src/server/services/stripe.ts` now requires `STRIPE_SECRET_KEY`. Without it, checkout returns a setup error instead of a placeholder payment URL. Add webhook handling before accepting real payments.

## Deployment

Recommended production path:

1. Deploy the Next.js app to Vercel.
2. Use managed PostgreSQL and set `DATABASE_URL`.
3. Use managed Redis for Riot API caching, rate limiting, and refresh jobs.
4. Configure Stripe test/live keys and webhook endpoint.
5. Configure Riot OAuth redirect URI to `/api/riot/link/callback`.
6. Add S3-compatible storage for profile images, receipts, and attachments.
7. Enforce HTTPS, secure cookies, CSRF protection for mutations, RBAC, audit logs, and token encryption.
