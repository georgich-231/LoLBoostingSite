import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CircleDollarSign,
  FileText,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/panel";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Terms of Service | RiftProgress",
  description:
    "RiftProgress boosting terms covering orders, account access, incomplete work, refunds, disputes, customer obligations, and booster obligations.",
};

const summaryCards = [
  {
    icon: FileText,
    title: "Digital boosting services",
    text: "Orders are virtual services for League of Legends boosts, including division, net wins, placements, duo, and pay-per-game.",
  },
  {
    icon: CircleDollarSign,
    title: "Progress-based outcomes",
    text: "Started orders are reviewed by delivered progress, remaining work, and who caused the interruption.",
  },
  {
    icon: LockKeyhole,
    title: "Account-access handoff",
    text: "Solo services may require temporary League account access after checkout. Duo boost remains self-play.",
  },
  {
    icon: UsersRound,
    title: "Support review first",
    text: "Customers and boosters should use order chat/support before opening external payment disputes.",
  },
];

const termsSections = [
  {
    title: "1. Agreement and eligibility",
    body: [
      "These Terms govern use of RiftProgress and any boosting order placed through the platform. By creating an account, configuring an order, paying for an order, or using support, you agree to these Terms.",
      "You must be legally able to enter a contract in your location. If you are under the age required by your local law, a parent or legal guardian must review and accept these Terms for you.",
      "RiftProgress may update these Terms before launch or after major service changes. Continued use after an update means you accept the updated Terms.",
    ],
  },
  {
    title: "2. Independent service and Riot risk disclosure",
    body: [
      "RiftProgress is independent and is not affiliated with, endorsed by, sponsored by, or approved by Riot Games, Inc.",
      "Riot Games rules may restrict account sharing, credential sharing, ranked manipulation, and similar conduct. Riot may suspend, restrict, or terminate accounts under its own rules. Customers accept this risk when ordering a solo or duo boosting service.",
      "RiftProgress cannot guarantee that Riot will not investigate or penalize an account. Riot-side penalties, rank adjustments, account locks, season changes, or enforcement actions are not automatically refundable unless the issue is directly tied to verified booster misconduct during an active order.",
    ],
  },
  {
    title: "3. Services and completion standards",
    body: [
      "Division boost is complete when the purchased target rank and LP are reached, unless the order description says otherwise.",
      "Net wins boost is complete when the ordered number of wins above losses has been delivered. Losses during the order do not reduce the paid net-win target.",
      "Placement boost is complete when the selected number of placement games has been played. League placements are capped at five games in the configurator.",
      "Duo boost is complete when the agreed duo sessions or rank target are delivered while the customer self-plays with the booster.",
      "Pay-per-game is complete when the purchased number of games has been played, regardless of win or loss, because the service does not include a net-win guarantee.",
    ],
  },
  {
    title: "4. Customer obligations",
    body: [
      "Customers must provide accurate queue, server, rank, LP, role, champion preference, and account-access information. Incorrect or missing information can delay the order or change the quote.",
      "For solo services, customers must not log into the League account, queue games, change credentials, change account security settings, spend currency, delete content, or interrupt the booster while the order is active unless support instructs them to do so.",
      "Customers must keep chat respectful and must not ask boosters to use scripts, bots, cheats, exploits, account buying, intentional feeding, harassment, or any other prohibited activity.",
      "If an account requires MFA, unlock steps, SMS verification, email verification, or region/queue changes, the customer must respond promptly. Long inactivity may pause the order and trigger review.",
    ],
  },
  {
    title: "5. Booster and platform obligations",
    body: [
      "Boosters must work only on the assigned order scope, avoid unauthorized purchases or changes, keep customer information confidential, and follow the agreed queue, role, champion, and schedule instructions where purchased.",
      "Boosters must not use scripts, bots, cheats, account theft, abusive chat, intentional feeding, or other conduct that would reasonably endanger the account beyond the inherent boosting risk.",
      "RiftProgress may reassign a booster, pause an order, request additional information, or escalate the order to admin review if quality, safety, availability, or communication issues appear.",
    ],
  },
  {
    title: "6. Cancellations, refunds, credits, and incomplete orders",
    body: [
      "If no booster has been assigned and no work has started, support may approve cancellation for store credit or a refund to the original payment method. Original-method refunds may exclude non-refundable payment processing fees charged by external processors.",
      "If a booster has been assigned but no measurable progress has been delivered, support may reassign the order or approve a refund/credit after deducting reasonable operational costs where allowed by law.",
      "If progress has been delivered, refunds or credits are limited to the undelivered portion of the order. Delivered games, wins, LP, placement games, duo sessions, and purchased add-ons already used are not refunded.",
      "If RiftProgress or the assigned booster cannot complete the remaining service, support may offer a replacement booster, store credit, or a partial refund for the unresolved portion.",
      "If the customer causes the order to become impossible or delayed, including by changing credentials, logging in during solo service, providing wrong details, getting the account locked, refusing required verification, or disappearing from support, support may pause the order and calculate any remaining credit after delivered progress and operational costs.",
      "Completed orders are not refundable except where required by law or where support confirms a material service error that was not already corrected.",
    ],
  },
  {
    title: "7. Account restrictions, bans, and third-party decisions",
    body: [
      "Riot account restrictions, suspensions, honor changes, LP adjustments, ranked restrictions, chargeback locks, or account recovery issues are handled case by case.",
      "RiftProgress does not promise compensation for Riot enforcement that occurs because boosting/account sharing violates Riot rules, because of customer actions, because of pre-existing account history, because of customer-provided third-party software, or after the order is completed.",
      "If a restriction occurs during an active order and there is evidence of booster misconduct, support may review chat logs, gameplay notes, timing, screenshots, and order records to decide whether replacement, credit, or refund is appropriate.",
    ],
  },
  {
    title: "8. Payments and chargebacks",
    body: [
      "Prices are shown in EUR unless another currency is explicitly displayed. Payment providers may apply their own conversion rates, processing fees, review rules, fraud checks, and settlement timing.",
      "Customers should contact support before opening a payment dispute or chargeback. A chargeback on an active or completed order may freeze the account, pause open services, and require admin review.",
      "Fraudulent payments, unauthorized payment methods, resale activity, abuse of coupons or credits, or false claims may lead to order cancellation and account suspension.",
    ],
  },
  {
    title: "9. Support, evidence, and dispute review",
    body: [
      "Support may use order status, chat logs, milestone history, payment state, rank snapshots, screenshots, customer messages, booster notes, and platform logs to decide an issue.",
      "Customers should report issues as soon as possible. Waiting until after completion can limit the available remedies because progress, games, and account state may be harder to verify.",
      "Support decisions aim to preserve delivered value, complete the remaining order where practical, and compensate only the unresolved portion where completion is not possible.",
    ],
  },
  {
    title: "10. Privacy and account-access handling",
    body: [
      "Platform account passwords are stored as hashes. League account access details, when needed for solo services, should be shared only through the protected paid order handoff or the support channel designated for that order.",
      "Customers should change their League password after a solo service is complete and should not reuse passwords across unrelated services.",
      "RiftProgress may delete, redact, or restrict access to sensitive order information when it is no longer needed for delivery, support, fraud prevention, legal compliance, or dispute review.",
    ],
  },
  {
    title: "11. No legal, financial, or Riot representation",
    body: [
      "These Terms are operational website terms for the RiftProgress platform and should be reviewed by a qualified lawyer before production launch.",
      "RiftProgress cannot speak for Riot Games, payment providers, banks, app stores, or any other third party. Third-party decisions remain outside RiftProgress control.",
    ],
  },
];

export default async function TermsPage() {
  const user = await getCurrentUser();
  const isBooster = user?.role === "COACH";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <Badge tone="emerald">Terms of Service</Badge>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-normal text-white sm:text-6xl">
            Order rules for boosting, refunds, and support disputes.
          </h1>
          <p className="mt-5 max-w-2xl leading-7 text-zinc-400">
            Last updated July 6, 2026. These terms define how RiftProgress
            handles solo and duo boosts, incomplete orders, account-access
            issues, refunds, credits, support reviews, and customer/booster
            responsibilities.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {isBooster ? (
              <Link href="/booster" className={buttonVariants()}>
                Booster dashboard
              </Link>
            ) : (
              <>
                <Link href="/marketplace" className={buttonVariants()}>
                  Configure a boost
                </Link>
                <Link href="/orders" className={buttonVariants({ variant: "secondary" })}>
                  View orders
                </Link>
              </>
            )}
          </div>
        </div>
        <GlassPanel className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 text-amber-200" size={24} aria-hidden />
            <div>
              <h2 className="text-xl font-bold text-white">Production note</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                This page is drafted for operational clarity. It should be
                reviewed against your company details, payment provider rules,
                consumer-law obligations, and final credential-handoff system
                before launch.
              </p>
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;

          return (
            <GlassPanel key={item.title} className="p-5">
              <Icon size={22} className="text-emerald-300" aria-hidden />
              <h2 className="mt-4 font-bold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
            </GlassPanel>
          );
        })}
      </section>

      <section className="mt-10 grid gap-5">
        {termsSections.map((section) => (
          <GlassPanel key={section.title} className="p-5">
            <h2 className="text-xl font-bold text-white">{section.title}</h2>
            <div className="mt-4 grid gap-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-zinc-400">
                  {paragraph}
                </p>
              ))}
            </div>
          </GlassPanel>
        ))}
      </section>

      <section className="mt-10 rounded-lg border border-emerald-300/20 bg-emerald-300/8 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 text-emerald-300" size={22} aria-hidden />
            <div>
              <h2 className="font-bold text-white">Need help with an order?</h2>
              <p className="mt-1 text-sm leading-6 text-emerald-100/80">
                Use the support assistant or the order dashboard so the issue is
                attached to the right customer, service, payment, and milestone
                history.
              </p>
            </div>
          </div>
          <Link
            href={isBooster ? "/booster" : "/orders"}
            className={buttonVariants({ variant: "secondary" })}
          >
            <MessageSquareText size={17} aria-hidden />
            {isBooster ? "Open booster dashboard" : "Open orders"}
          </Link>
        </div>
      </section>
    </main>
  );
}
