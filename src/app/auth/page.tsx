import Link from "next/link";
import {
  BadgeCheck,
  Disc3,
  Link2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { AuthForms } from "@/components/auth-forms";
import { AuthStatusNotice } from "@/components/auth-status-notice";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/panel";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const onboarding = [
  "Create your platform account",
  "Connect League data after sign-in",
  "Choose a boost method and target",
  "Track payment, assignment, and completion",
];

const boosterOnboarding = [
  "Sign in with your booster account",
  "Open the booster dashboard",
  "Claim pending boost orders",
  "Keep customer chat saved for disputes",
];

export default async function AuthPage() {
  const user = await getCurrentUser();
  const isBooster = user?.role === "COACH";
  const steps = isBooster ? boosterOnboarding : onboarding;

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <section className="self-start">
        <Badge tone="emerald">{isBooster ? "Booster access" : "Account onboarding"}</Badge>
        <h1 className="mt-4 text-4xl font-black tracking-normal text-white sm:text-5xl">
          {isBooster
            ? "Manage boost orders from your booster dashboard."
            : "Sign in once, then place and track boost orders."}
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
          {isBooster
            ? "Booster accounts use a staff workflow. Use the booster dashboard to view pending purchases, assign yourself to orders, and keep customer chat saved on the order."
            : "RiftProgress separates platform authentication from Riot account linking and order access. Email, Google, and Discord can sign you into RiftProgress; Riot linking is used for rank context, while solo order access is handled after checkout when required."}
        </p>
        <div className="mt-8 grid gap-3">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/6 p-4"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-300 text-sm font-bold text-zinc-950">
                {index + 1}
              </span>
              <span className="font-medium text-zinc-200">{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <GlassPanel className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-400">RiftProgress account</p>
              <h2 className="text-2xl font-bold text-white">
                {user ? "Already signed in" : "Create account"}
              </h2>
            </div>
            <LockKeyhole className="text-emerald-300" size={24} aria-hidden />
          </div>
          {user ? (
            <div className="mt-5 rounded-md border border-emerald-300/20 bg-emerald-300/8 p-4">
              <p className="font-semibold text-white">{user.email}</p>
              <p className="mt-2 text-sm leading-6 text-emerald-100/80">
                {isBooster
                  ? "You are signed in as a booster. Continue to your booster dashboard to claim and manage orders."
                  : "You can continue to the boost marketplace or review existing orders without logging in again."}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link href={isBooster ? "/booster" : "/marketplace"} className={buttonVariants()}>
                  {isBooster ? "Booster dashboard" : "Order a boost"}
                </Link>
                <Link href={isBooster ? "/terms" : "/orders"} className={buttonVariants({ variant: "secondary" })}>
                  {isBooster ? "Order policy" : "View orders"}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5">
                <AuthForms />
              </div>
              <AuthStatusNotice />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href="/api/auth/google/start"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  <BadgeCheck size={17} aria-hidden />
                  Google
                </Link>
                <Link
                  href="/api/auth/discord/start"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  <Disc3 size={17} aria-hidden />
                  Discord
                </Link>
              </div>
            </>
          )}
        </GlassPanel>

        {user && !isBooster ? (
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md border border-emerald-300/25 bg-emerald-300/10">
                <ShieldCheck size={22} className="text-emerald-300" aria-hidden />
              </span>
              <div>
                <p className="text-sm text-zinc-400">League account data</p>
                <h2 className="text-xl font-bold text-white">Riot linking</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Configure Riot Sign On/OAuth credentials to use the approved OAuth
              redirect flow. Without those credentials, use the manual Riot ID link
              from the dashboard with a server-side Riot API key.
            </p>
            <div className="mt-4 rounded-md border border-emerald-300/20 bg-emerald-300/8 p-3 text-sm text-emerald-100">
              Riot linking is only for account data. Boost order access details,
              when required, belong inside the protected paid order handoff.
            </div>
            <Link href="/api/riot/link/start" className={buttonVariants({ className: "mt-5 w-full" })}>
              <Link2 size={17} aria-hidden />
              Link Riot account
            </Link>
          </GlassPanel>
        ) : null}
      </section>
    </main>
  );
}
