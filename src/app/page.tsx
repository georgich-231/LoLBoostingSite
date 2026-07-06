import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  ClipboardCheck,
  Gamepad2,
  Headphones,
  Link2,
  LockKeyhole,
  MessageSquareText,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/panel";
import { listActiveServices } from "@/server/services/catalog";
import { getCurrentUser } from "@/server/session";
import ireliaHeroImage from "@/app/images/irelia_hero_enhanced.jpg";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const trustItems = [
  {
    icon: SlidersHorizontal,
    title: "Method-specific pricing",
    text: "Division, net wins, placements, duo, and pay-per-game orders each use requirements that match how the service actually works.",
  },
  {
    icon: Gamepad2,
    title: "Solo or self-play",
    text: "Duo boost keeps the customer in game with the booster. Solo boost uses a protected post-checkout account-access handoff.",
  },
  {
    icon: LockKeyhole,
    title: "Private order handoff",
    text: "Account-access details belong inside the paid order workflow, not public forms, comments, or random chat messages.",
  },
  {
    icon: BarChart3,
    title: "Visible progress",
    text: "Customers can track order status, target, queue, role, champion preferences, add-ons, milestones, and payment state.",
  },
];

const serviceMethods = [
  {
    title: "Division boost",
    detail: "Current rank, LP, target rank, and target LP drive the quote. Targets below the current account state are blocked.",
  },
  {
    title: "Net wins",
    detail: "The paid win count is delivered above losses. Losses do not reduce the ordered net-win target.",
  },
  {
    title: "Placements",
    detail: "Placement orders support up to five League placement games, priced by current rank tier and selected game count.",
  },
  {
    title: "Duo boost",
    detail: "Self-play queueing with the booster. Duo orders do not require sharing League account login details.",
  },
  {
    title: "Pay per game",
    detail: "A lower-cost game bundle where every played game counts, whether it ends in a win or a loss.",
  },
];

const orderProtections = [
  {
    icon: ClipboardCheck,
    title: "Before work starts",
    text: "Orders can be reviewed, corrected, reassigned, or cancelled before a booster begins. If no work has started, support can resolve the order without charging completed progress.",
  },
  {
    icon: CircleDollarSign,
    title: "Partial progress",
    text: "If an active order cannot be completed, the unfinished part is reviewed separately from delivered progress, with replacement, store credit, or a partial refund depending on fault and evidence.",
  },
  {
    icon: UsersRound,
    title: "Customer obligations",
    text: "Customers must provide accurate rank, queue, region, access, and availability details. Logging in during a solo boost, changing credentials, or blocking access can pause the order.",
  },
  {
    icon: Headphones,
    title: "Support review",
    text: "Issues should be raised through order chat or support first. Support can inspect milestones, chat logs, payment state, and booster notes before deciding the fairest outcome.",
  },
];

const riskNotes = [
  "RiftProgress is independent and is not endorsed by Riot Games.",
  "Riot's rules restrict account sharing and may allow penalties for account or ranked manipulation.",
  "Solo boosting can require temporary League account access after checkout; duo boost is self-play.",
  "Customers should change passwords and review account security after a solo order is complete.",
];

const faq = [
  {
    question: "Which boosting services can I order?",
    answer:
      "The store supports division boosts, net wins, placement games, duo boosts, and pay-per-game orders. Each option has its own quote inputs and validation.",
  },
  {
    question: "How does solo boost account access work?",
    answer:
      "Division boosts, net wins, placement boosts, and pay-per-game orders usually require the League account username and password after checkout. Duo boost is self-play and does not require sharing login details.",
  },
  {
    question: "What happens if an order cannot be completed?",
    answer:
      "Support reviews who caused the issue, how much progress was delivered, and whether a replacement booster can finish it. If the booster or platform cannot complete the remaining work, the unresolved portion can be handled through store credit, reassignment, or a partial refund under the Terms of Service.",
  },
  {
    question: "What if I log in during a solo boost?",
    answer:
      "Solo orders can be paused if the customer logs in, changes credentials, enters queue, removes access, or otherwise prevents the booster from working. Support may reschedule, reassign, or recalculate the remaining value depending on the order state.",
  },
  {
    question: "Can I order without linking Riot first?",
    answer:
      "Yes. Linked accounts can auto-fill rank context when available, but customers can also enter queue, current rank, LP, target, and optional role or champion preferences manually.",
  },
  {
    question: "Where can I read the full order rules?",
    answer:
      "The Terms of Service explain order completion, refunds, chargebacks, account-access handling, booster obligations, customer obligations, and dispute review.",
  },
];

const climbMilestones: Array<{
  label: string;
  rank: string;
  time: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: "start" | "middle" | "end";
}> = [
  {
    label: "Start",
    rank: "Gold II",
    time: "Day 0",
    x: 54,
    y: 214,
    labelX: 54,
    labelY: 188,
    anchor: "middle",
  },
  {
    label: "Session 1",
    rank: "Platinum IV",
    time: "Day 2",
    x: 188,
    y: 176,
    labelX: 188,
    labelY: 146,
    anchor: "middle",
  },
  {
    label: "Session 2",
    rank: "Emerald III",
    time: "Day 4",
    x: 354,
    y: 126,
    labelX: 354,
    labelY: 96,
    anchor: "middle",
  },
  {
    label: "",
    rank: "Diamond IV",
    time: "Day 6",
    x: 518,
    y: 74,
    labelX: 518,
    labelY: 54,
    anchor: "middle",
  },
];

export default async function Home() {
  const [services, user] = await Promise.all([
    listActiveServices(),
    getCurrentUser(),
  ]);
  const isBooster = user?.role === "COACH";
  const primaryCtaHref = isBooster ? "/booster" : "/marketplace";
  const primaryCtaLabel = isBooster ? "Open booster dashboard" : "Configure boost";
  const orderCtaHref = user ? "/dashboard" : "/auth";
  const orderCtaLabel = user ? "View profile" : "Sign in to order";

  return (
    <main>
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
        <Image
          src={ireliaHeroImage}
          alt="League of Legends champion backdrop"
          fill
          priority
          sizes="100vw"
          quality={100}
          className="object-cover object-[62%_42%] saturate-110 contrast-110"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,12,0.97)_0%,rgba(7,8,12,0.83)_42%,rgba(7,8,12,0.38)_100%)]" />
        <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div className="max-w-3xl">
            <Badge tone="emerald">League of Legends boosting services</Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.05] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Rank up with transparent League boosting orders.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              Pick division boost, net wins, placements, duo queue, or
              pay-per-game. Every method has its own quote inputs, add-ons,
              account-access expectations, support trail, and completion rules
              before the order reaches a booster.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={primaryCtaHref} className={buttonVariants({ size: "lg" })}>
                <SlidersHorizontal size={18} aria-hidden />
                {primaryCtaLabel}
              </Link>
              {!isBooster ? (
                <Link
                  href={orderCtaHref}
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  <Link2 size={18} aria-hidden />
                  {orderCtaLabel}
                </Link>
              ) : null}
              <Link
                href="/terms"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                Terms and order policy
                <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
            <div className="mt-6 grid max-w-2xl gap-2 text-sm text-zinc-400 sm:grid-cols-3">
              <span className="rounded-md border border-white/10 bg-white/6 px-3 py-2">
                Rank-aware EUR quotes
              </span>
              <span className="rounded-md border border-white/10 bg-white/6 px-3 py-2">
                Solo and duo workflows
              </span>
              <span className="rounded-md border border-white/10 bg-white/6 px-3 py-2">
                Support-reviewed disputes
              </span>
            </div>
          </div>

          <GlassPanel className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-zinc-400">Boost result preview</p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  Gold II to Diamond IV climb
                </h2>
              </div>
              <Badge tone="amber">+738 LP path</Badge>
            </div>
            <div className="mt-5">
              <BoostClimbChart />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/7 p-3">
                <p className="text-xs text-zinc-500">Before boost</p>
                <p className="mt-1 text-xl font-bold text-white">Gold II</p>
                <p className="text-sm text-zinc-400">62 LP</p>
              </div>
              <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3">
                <p className="text-xs text-emerald-100/70">After boost</p>
                <p className="mt-1 text-xl font-bold text-emerald-100">Diamond IV</p>
                <p className="text-sm text-emerald-100/70">secured climb</p>
              </div>
              <div className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3">
                <p className="text-xs text-amber-100/70">Order type</p>
                <p className="mt-1 text-xl font-bold text-amber-100">Division</p>
                <p className="text-sm text-amber-100/70">rank to rank</p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      <section className="border-y border-white/10 bg-zinc-950 py-12">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <MetricCard
            label="Active services"
            value={`${services.length}`}
            detail="Configured from the service catalog"
            accent="cyan"
          />
          <MetricCard
            label="Pricing basis"
            value="Rank + LP"
            detail="Quotes adjust by queue, tier, LP, and method"
            accent="emerald"
          />
          <MetricCard
            label="Order modes"
            value="Solo / Duo"
            detail="Self-play duo or post-checkout solo access"
            accent="amber"
          />
          <MetricCard
            label="Tracking"
            value="Live status"
            detail="Customers see payment, target, and milestones"
            accent="rose"
          />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="max-w-3xl">
              <Badge tone="cyan">What you can order</Badge>
              <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                Five boosting methods, each with the right requirements.
              </h2>
              <p className="mt-4 leading-7 text-zinc-400">
                The selected service controls the quote and checkout fields.
                Customers do not have to guess which information matters: the
                form changes based on the actual boost type.
              </p>
            </div>
          </AnimatedSection>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {serviceMethods.map((method, index) => (
              <AnimatedSection key={method.title} delay={index * 0.04}>
                <GlassPanel className="h-full p-5">
                  <div className="flex h-full flex-col">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-sm font-black text-cyan-100">
                      {index + 1}
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-white">{method.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">
                      {method.detail}
                    </p>
                  </div>
                </GlassPanel>
              </AnimatedSection>
            ))}
          </div>
          <Link
            href={isBooster ? "/booster" : "/marketplace"}
            className={buttonVariants({
              variant: "secondary",
              className: "mt-6",
            })}
          >
            {isBooster ? "Open booster dashboard" : "Open boost configurator"}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      <section className="border-y border-white/10 bg-black/20 py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <AnimatedSection>
            <Badge tone="amber">Boosting workflow</Badge>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Built for boosting orders, not coaching sessions.
            </h2>
            <p className="mt-4 leading-7 text-zinc-400">
              Customers should know what they are buying, what the booster
              needs, and where the order stands. Solo boost access is handled
              after checkout inside the order workflow, while duo boost remains
              a self-play service.
            </p>
          </AnimatedSection>
          <div className="grid gap-4 sm:grid-cols-2">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <GlassPanel key={item.title} className="p-5">
                  <Icon size={22} className="text-emerald-300" aria-hidden />
                  <h3 className="mt-4 font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
                </GlassPanel>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <AnimatedSection>
            <Badge tone="rose">Order protection</Badge>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Clear rules for incomplete orders and disputes.
            </h2>
            <p className="mt-4 leading-7 text-zinc-400">
              Boosting orders can be interrupted by account access, schedule
              conflicts, queue restrictions, customer login overlap, booster
              availability, season resets, or Riot enforcement. The order policy
              explains how support decides whether to continue, reassign,
              credit, or partially refund an order.
            </p>
            <Link
              href="/terms"
              className={buttonVariants({ variant: "secondary", className: "mt-6" })}
            >
              Read Terms of Service
              <ArrowRight size={16} aria-hidden />
            </Link>
          </AnimatedSection>
          <div className="grid gap-4 sm:grid-cols-2">
            {orderProtections.map((item) => {
              const Icon = item.icon;

              return (
                <GlassPanel key={item.title} className="p-5">
                  <Icon size={22} className="text-amber-200" aria-hidden />
                  <h3 className="mt-4 font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
                </GlassPanel>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-zinc-950 py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <AnimatedSection>
            <Badge tone="amber">Risk disclosure</Badge>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Customers should understand the Riot account risk before ordering.
            </h2>
            <p className="mt-4 leading-7 text-zinc-400">
              Riot Games is not affiliated with RiftProgress. Riot account rules
              can restrict account sharing and ranked manipulation, so the site
              should disclose that risk plainly before checkout.
            </p>
          </AnimatedSection>
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3">
              <ShieldAlert size={24} className="text-rose-200" aria-hidden />
              <h3 className="text-xl font-bold text-white">Before you buy</h3>
            </div>
            <div className="mt-5 grid gap-3">
              {riskNotes.map((note) => (
                <div
                  key={note}
                  className="flex gap-3 rounded-md border border-white/10 bg-white/6 p-3 text-sm leading-6 text-zinc-300"
                >
                  <ShieldCheck size={16} className="mt-1 shrink-0 text-emerald-300" aria-hidden />
                  {note}
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <Badge tone="emerald">FAQ</Badge>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Clear answers before customers place an order.
            </h2>
            <div className="mt-8 grid gap-3">
              {faq.map((item) => (
                <GlassPanel key={item.question} className="p-5">
                  <h3 className="font-semibold text-white">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.answer}</p>
                </GlassPanel>
              ))}
            </div>
          </div>
          <GlassPanel className="self-start p-5">
            <div className="flex items-center gap-3">
              <Trophy className="text-amber-200" size={28} aria-hidden />
              <div>
                <p className="text-sm text-zinc-400">Order flow</p>
                <h3 className="text-xl font-bold text-white">From service to checkout</h3>
              </div>
            </div>
            <ol className="mt-6 grid gap-3">
              {[
                "Choose a boosting service",
                "Select Solo/Duo or Flex queue",
                "Enter current rank, LP, and target",
                "Choose add-ons such as role selection or champion requests",
                "Pay and track the order dashboard",
              ].map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-white/6 p-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-300 text-sm font-bold text-zinc-950">
                    {index + 1}
                  </span>
                  <span className="font-medium text-zinc-200">{step}</span>
                </li>
              ))}
            </ol>
            <Link
              href={isBooster ? "/booster" : "/marketplace"}
              className={buttonVariants({ className: "mt-6 w-full" })}
            >
              <MessageSquareText size={17} aria-hidden />
              {isBooster ? "Open booster dashboard" : "Configure a boost"}
            </Link>
            <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-zinc-400">
              <ShieldCheck size={16} className="mt-1 text-emerald-300" aria-hidden />
              For solo boost, account-access details should be handled only
              inside the protected paid order handoff.
            </p>
          </GlassPanel>
        </div>
      </section>
    </main>
  );
}

function BoostClimbChart() {
  const width = 580;
  const height = 260;
  const baseline = 224;
  const path = "M 54 214 C 118 212 140 192 188 176 C 252 154 286 146 354 126 C 426 102 462 84 518 74";
  const fillPath = `${path} L 518 ${baseline} L 54 ${baseline} Z`;

  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,18,0.96),rgba(7,8,12,0.82))]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[260px] w-full"
        role="img"
        aria-label="Boost climb chart from Gold II before the boost to Diamond IV after the boost"
      >
        <defs>
          <linearGradient id="boost-line" x1="8%" y1="84%" x2="92%" y2="16%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="48%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="boost-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.34" />
            <stop offset="58%" stopColor="#06b6d4" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
          </linearGradient>
          <filter id="boost-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={width} height={height} fill="rgba(0,0,0,0)" />
        {[44, 88, 132, 176, 220].map((y) => (
          <line
            key={y}
            x1="32"
            x2="548"
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.07)"
          />
        ))}
        <line
          x1="54"
          x2="518"
          y1={baseline}
          y2={baseline}
          stroke="rgba(255,255,255,0.14)"
          strokeDasharray="5 8"
        />
        <path d={fillPath} fill="url(#boost-fill)" />
        <path
          d={path}
          fill="none"
          stroke="rgba(52,211,153,0.22)"
          strokeLinecap="round"
          strokeWidth="16"
          filter="url(#boost-glow)"
        />
        <path
          d={path}
          fill="none"
          stroke="url(#boost-line)"
          strokeLinecap="round"
          strokeWidth="5"
        />

        {climbMilestones.map((milestone, index) => (
          <g key={`${milestone.rank}-${milestone.time}`}>
            <line
              x1={milestone.x}
              x2={milestone.x}
              y1={milestone.y + 14}
              y2={baseline}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="4 7"
            />
            <circle
              cx={milestone.x}
              cy={milestone.y}
              r={index === climbMilestones.length - 1 ? 10 : 8}
              fill="#09090b"
              stroke={index === climbMilestones.length - 1 ? "#fbbf24" : "#34d399"}
              strokeWidth="4"
            />
            <circle
              cx={milestone.x}
              cy={milestone.y}
              r="3"
              fill={index === climbMilestones.length - 1 ? "#fbbf24" : "#67e8f9"}
            />
            <g>
              {milestone.label ? (
                <text
                  x={milestone.labelX}
                  y={milestone.labelY}
                  textAnchor={milestone.anchor}
                  fill="rgba(244,244,245,0.72)"
                  fontSize="11"
                  fontWeight="700"
                >
                  {milestone.label}
                </text>
              ) : null}
              <text
                x={milestone.labelX}
                y={milestone.labelY + (milestone.label ? 14 : 0)}
                textAnchor={milestone.anchor}
                fill={index === climbMilestones.length - 1 ? "#fde68a" : "#a7f3d0"}
                fontSize="12"
                fontWeight="800"
              >
                {milestone.rank}
              </text>
            </g>
            <text
              x={milestone.x}
              y="246"
              textAnchor="middle"
              fill="rgba(244,244,245,0.6)"
              fontSize="12"
              fontWeight="700"
            >
              {milestone.time}
            </text>
          </g>
        ))}

        <rect x="38" y="18" width="112" height="26" rx="6" fill="rgba(103,232,249,0.08)" />
        <text x="94" y="35" textAnchor="middle" fill="#bae6fd" fontSize="12" fontWeight="800">
          Before boost
        </text>
        <rect x="420" y="18" width="108" height="26" rx="6" fill="rgba(251,191,36,0.1)" />
        <text x="474" y="35" textAnchor="middle" fill="#fde68a" fontSize="12" fontWeight="800">
          After boost
        </text>
      </svg>
    </div>
  );
}
