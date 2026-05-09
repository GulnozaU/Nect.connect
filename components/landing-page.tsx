// FILE PATH: components/landing-page.tsx

"use client";

import Link from "next/link";
import { motion, useInView, Variants } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Check,
  Zap,
  CalendarDays,
  Instagram,
  Radio,
  Linkedin,
  MessageCircle,
  Facebook,
  Sparkles,
  BarChart2,
  Shield,
} from "lucide-react";

// ── Spiral/orbit logo SVG ────────────────────────────────────────────────────
function NectLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C8 2 4 5 4 9c0 2 1 3.5 2.5 4.5"
        stroke="#F97316"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 22c4 0 8-3 8-7 0-2-1-3.5-2.5-4.5"
        stroke="#F97316"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M4 12c0-2.5 2-4.5 4-5.5S13 5.5 15 7s2.5 3.5 2 5.5-2.5 4-5 4.5"
        stroke="#F97316"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2.5 2"
        fill="none"
        opacity="0.5"
      />
      <circle cx="12" cy="12" r="2" fill="#F97316" />
      <circle cx="6.5" cy="13.5" r="1.2" fill="#F97316" opacity="0.6" />
      <circle cx="17.5" cy="10.5" r="1.2" fill="#F97316" opacity="0.6" />
    </svg>
  );
}

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 320, damping: 18 } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function InView({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const platforms = [
  { name: "LinkedIn",  icon: Linkedin,      color: "#0A66C2" },
  { name: "Coming:Instagram", icon: Instagram,     color: "#E1306C" },
  { name: "X",         icon: Radio,         color: "#e4e4e7" },
  { name: "Coming:Reddit",    icon: MessageCircle, color: "#FF4500" },
  { name: "Coming:Facebook",  icon: Facebook,      color: "#1877F2" },
];

const steps = [
  {
    n: "01",
    title: "Enter your idea",
    desc: "Type a topic, paste a link, or describe what you want to say. A sentence is enough to start.",
    icon: Sparkles,
  },
  {
    n: "02",
    title: "AI writes platform-native posts",
    desc: "Get a LinkedIn article, an Instagram caption, a punchy tweet, and a Reddit post — all completely different.",
    icon: Zap,
  },
  {
    n: "03",
    title: "Edit, schedule, and publish",
    desc: "Tweak any post inline, hit publish instantly or pick a date. Syncs to Google Calendar automatically.",
    icon: CalendarDays,
  },
];

const differences = [
  {
    icon: Zap,
    title: "Different post for every platform",
    desc: "LinkedIn gets long-form insight. Instagram gets captions and hashtags. X gets something punchy. Not the same text pasted everywhere.",
  },
  {
    icon: MessageCircle,
    title: "AI understands platform culture",
    desc: "Reddit hates marketing speak. LinkedIn rewards storytelling. Instagram needs visual hooks. Nect knows the difference.",
  },
  {
    icon: CalendarDays,
    title: "Schedule without infrastructure",
    desc: "Pick a time, connect Google Calendar, and posts go out automatically. No cron jobs, no external services.",
  },
  {
    icon: BarChart2,
    title: "Track everything in one place",
    desc: "See which posts are pending, published, or failed. Your full content calendar visible at a glance.",
  },
  {
    icon: Shield,
    title: "You stay in control",
    desc: "Every post is fully editable before it goes anywhere. AI drafts, you approve. No surprises.",
  },
  {
    icon: Sparkles,
    title: "Select up to 3 platforms at once",
    desc: "Generate posts for LinkedIn, Instagram, and X simultaneously. One idea, three platform-perfect drafts in seconds.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "3 connected platforms",
      "20 AI generations/month",
      "Google Calendar sync",
    ],
    cta: "Start free",
    href: "/auth?next=/onboarding",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$7",
    period: "/month",
    features: [
      "All 5 platforms",
      "Unlimited AI generations",
      "Priority support",
      "Advanced analytics",
    ],
    cta: "Start free trial",
    href: "/auth?next=/onboarding&plan=pro",
    highlight: true,
  },
];

/*const testimonials = [
  {
    quote: "I used to spend 45 minutes repurposing one blog post across platforms. Now it takes 90 seconds.",
    name: "Sarah K.",
    role: "Content Creator",
  },
  {
    quote: "The LinkedIn posts actually sound like me. Not like a robot. That's the difference.",
    name: "Marcus T.",
    role: "Startup Founder",
  },
  {
    quote: "Scheduled 3 weeks of content in one afternoon. My engagement went up 40%.",
    name: "Priya M.",
    role: "Marketing Lead",
  },
];*/

// ── Component ────────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white selection:bg-[#F97316]/20">

      {/* Ambient background glows — matches dashboard */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[700px] w-[700px] rounded-full bg-[#F97316]/12 blur-[140px]" />
        <div className="absolute -right-20 top-[30%] h-[500px] w-[500px] rounded-full bg-[#F97316]/6 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#F97316]/4 blur-[100px]" />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-50 flex items-center justify-between border-b border-white/[0.06] px-6 py-4 backdrop-blur-sm md:px-10">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-white">
          <NectLogo className="h-6 w-6" />
          <span className="text-base tracking-tight">Nect</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/auth"
            className="hidden rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition-colors duration-150 hover:text-white sm:block"
          >
            Log in
          </Link>
          <Link
            href="/auth?next=/onboarding"
            className="rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-bold text-black transition-all duration-150 hover:bg-[#fb923c] hover:shadow-[0_0_20px_rgba(249,115,22,0.45)] active:scale-[0.96]"
          >
            Get started free
          </Link>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-5xl px-6 md:px-10">

        {/* ── Hero ── */}
        <section className="pb-28 pt-20 md:pt-32">
          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl">

            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#F97316]/20 bg-[#F97316]/[0.07] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#F97316]">
                <NectLogo className="h-3.5 w-3.5" />
                AI-powered social media
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl font-extrabold leading-[1.04] tracking-tight md:text-7xl">
              Write once.{" "}
              <span className="italic text-[#F97316]">Publish differently</span>
              {" "}everywhere.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              Nect generates unique, platform-native posts for Instagram, X, LinkedIn, Reddit, and Facebook — all from one idea. No copy-pasting. No reformatting. No guessing what works where.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              {/* Primary — glows on hover */}
              <Link
                href="/auth?next=/onboarding"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-7 py-3.5 text-sm font-extrabold text-black transition-all duration-200 hover:bg-[#fb923c] hover:shadow-[0_0_32px_rgba(249,115,22,0.55)] active:scale-[0.97]"
              >
                Start creating posts
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              {/* Secondary — border lights up orange */}
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 text-sm font-semibold text-zinc-300 transition-all duration-200 hover:border-[#F97316]/50 hover:text-white hover:shadow-[0_0_18px_rgba(249,115,22,0.15)] active:scale-[0.97]"
              >
                Try demo
              </Link>

              {/* Tertiary — text link */}
              <Link
                href="/auth"
                className="group hidden items-center gap-1 text-sm text-zinc-600 transition-colors duration-150 hover:text-zinc-300 sm:inline-flex"
              >
                Log in
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-5 text-xs text-zinc-700">
              No credit card required · Free plan available · Takes 60 seconds to set up
            </motion.p>
          </motion.div>

          {/* Platform pills */}
          <InView className="mt-16 flex flex-wrap gap-2">
            {platforms.map(({ name, icon: Icon, color }) => (
              <motion.div
                key={name}
                variants={popIn}
                className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.05]"
              >
                <Icon className="h-4 w-4" style={{ color }} />
                <span className="text-sm font-medium text-zinc-400">{name}</span>
              </motion.div>
            ))}
            <motion.div variants={popIn} className="flex items-center gap-2 rounded-full border border-dashed border-white/8 px-4 py-2">
              <span className="text-sm text-zinc-700">More coming</span>
            </motion.div>
          </InView>
        </section>

        {/* ── How it works ── */}
        <section className="border-t border-white/[0.06] py-24">
          <InView>
            <motion.p variants={fadeUp} className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F97316]">
              How it works
            </motion.p>
            <motion.h2 variants={fadeUp} className="mb-3 text-4xl font-extrabold leading-tight md:text-5xl">
              From idea to everywhere
              <br />
              <span className="text-zinc-600">in under 30 seconds.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mb-14 max-w-lg text-base text-zinc-500">
              The fastest way from "I have something to say" to "it's live everywhere."
            </motion.p>

            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(({ n, title, desc, icon: Icon }) => (
                <motion.div
                  key={n}
                  variants={fadeUp}
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] p-6 transition-all duration-300 hover:border-[#F97316]/25 hover:shadow-[0_0_24px_rgba(249,115,22,0.07)]"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-4xl font-black text-[#F97316]/15 transition-colors duration-300 group-hover:text-[#F97316]/30">
                      {n}
                    </span>
                    <div className="rounded-xl bg-[#F97316]/8 p-2.5 transition-colors duration-200 group-hover:bg-[#F97316]/15">
                      <Icon className="h-5 w-5 text-[#F97316]" />
                    </div>
                  </div>
                  <h3 className="mb-2.5 text-base font-bold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-600">{desc}</p>
                </motion.div>
              ))}
            </div>
          </InView>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-white/[0.06] py-24">
          <InView>
            <motion.p variants={fadeUp} className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F97316]">
              Why Nect
            </motion.p>
            <motion.h2 variants={fadeUp} className="mb-14 text-4xl font-extrabold leading-tight md:text-5xl">
              Not just another scheduler.
              <br />
              <span className="text-zinc-600">Built different.</span>
            </motion.h2>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {differences.map(({ icon: Icon, title, desc }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="group rounded-2xl border border-white/8 bg-white/[0.02] p-5 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.03]"
                >
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/8 transition-colors duration-200 group-hover:bg-[#F97316]/15">
                    <Icon className="h-4 w-4 text-[#F97316]" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-relaxed text-zinc-600">{desc}</p>
                </motion.div>
              ))}
            </div>
          </InView>
        </section>

   

        {/* ── Pricing ── */}
        <section className="border-t border-white/[0.06] py-24">
          <InView>
            <motion.p variants={fadeUp} className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F97316]">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} className="mb-3 text-4xl font-extrabold leading-tight md:text-5xl">
              Start free.
              <br />
              <span className="text-zinc-600">Scale when ready.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mb-14 max-w-md text-base text-zinc-500">
              No credit card required. Upgrade whenever you need unlimited.
            </motion.p>

            <div className="grid max-w-2xl gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  className={`relative rounded-2xl border p-8 transition-all duration-300 ${
                    plan.highlight
                      ? "border-[#F97316]/35 bg-[#F97316]/[0.04] hover:border-[#F97316]/55 hover:shadow-[0_0_36px_rgba(249,115,22,0.1)]"
                      : "border-white/8 bg-white/[0.02] hover:border-white/14"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-6">
                      <span className="rounded-full bg-[#F97316] px-3 py-1 text-xs font-extrabold text-black">
                        Most popular
                      </span>
                    </div>
                  )}
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{plan.name}</p>
                  <div className="mt-3 flex items-baseline gap-0.5">
                    <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-sm text-zinc-600">{plan.period}</span>
                  </div>
                  <ul className="mb-8 mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-400">
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#F97316]" strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold transition-all duration-200 active:scale-[0.97] ${
                      plan.highlight
                        ? "bg-[#F97316] text-black hover:bg-[#fb923c] hover:shadow-[0_0_24px_rgba(249,115,22,0.5)]"
                        : "border border-white/10 text-zinc-300 hover:border-[#F97316]/40 hover:text-white hover:shadow-[0_0_14px_rgba(249,115,22,0.12)]"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </InView>
        </section>

        {/* ── Final CTA ── */}
        <section className="border-t border-white/[0.06] py-24">
          <InView className="text-center">
            <motion.div variants={fadeUp} className="mb-4 flex justify-center">
              <NectLogo className="h-10 w-10" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold md:text-6xl">
              Ready to post smarter?
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-zinc-500">
              Join creators who stopped copy-pasting and started publishing platform-perfect content.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth?next=/onboarding"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-8 py-4 text-base font-extrabold text-black transition-all duration-200 hover:bg-[#fb923c] hover:shadow-[0_0_40px_rgba(249,115,22,0.55)] active:scale-[0.97]"
              >
                Start creating posts
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth"
                className="rounded-xl border border-white/10 px-8 py-4 text-base font-semibold text-zinc-400 transition-all duration-200 hover:border-[#F97316]/40 hover:text-white hover:shadow-[0_0_16px_rgba(249,115,22,0.12)] active:scale-[0.97]"
              >
                Log in
              </Link>
            </motion.div>
          </InView>
        </section>

      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-400 transition-colors">
            <NectLogo className="h-4 w-4" />
            Nect
          </Link>
          <p className="text-xs text-zinc-700">Built for creators who move fast · 2026</p>
          <div className="flex gap-6 text-xs text-zinc-700">
            <Link href="/auth" className="transition-colors hover:text-zinc-400">Log in</Link>
            <Link href="/auth?next=/onboarding" className="transition-colors hover:text-zinc-400">Sign up</Link>
            <Link href="/dashboard" className="transition-colors hover:text-zinc-400">Dashboard</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}