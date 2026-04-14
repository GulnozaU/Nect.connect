"use client";

import Link from "next/link";
import {Variants} from "framer-motion";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  CalendarDays,
  LayoutDashboard,
  Instagram,
  Radio,
  Linkedin,
  MessageCircle,
  Facebook,
} from "lucide-react";

// ── Animation variants ──────────────────────────────────────────────────────
// ── Animation variants ──────────────────────────────────────────────────────

// 1. Explicitly type fadeUp as Variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.55, 
      ease: [0.22, 1, 0.36, 1] // Now correctly recognized as a tuple
    } 
  },
};

// 2. Explicitly type the return of the stagger function as Variants
const stagger = (delay = 0.08): Variants => ({
  hidden: {},
  show: { 
    transition: { staggerChildren: delay } 
  },
});

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger()}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────
const platforms = [
  { name: "LinkedIn",  icon: Linkedin,      color: "#0A66C2" },
  { name: "Instagram", icon: Instagram,     color: "#E1306C" },
  { name: "X",         icon: Radio,         color: "#ffffff" },
  { name: "Reddit",    icon: MessageCircle, color: "#FF4500" },
  { name: "Facebook",  icon: Facebook,      color: "#1877F2" },
];

const steps = [
  {
    n: "01",
    title: "Enter your idea",
    desc: "Type a topic, paste a link, or describe what you want to say. A sentence is enough.",
    icon: Sparkles,
  },
  {
    n: "02",
    title: "AI generates platform-specific posts",
    desc: "Get a LinkedIn article, an Instagram caption, a punchy tweet, and a Reddit post — all different, all native.",
    icon: Zap,
  },
  {
    n: "03",
    title: "Edit, schedule, and publish",
    desc: "Tweak any post, hit publish instantly or pick a date. Syncs to your Google Calendar automatically.",
    icon: CalendarDays,
  },
];

const differences = [
  { title: "Different post for every platform", desc: "LinkedIn gets long-form insight. Instagram gets captions and hashtags. X gets something punchy. Not the same text pasted everywhere." },
  { title: "AI understands platform culture", desc: "Reddit users hate marketing speak. LinkedIn rewards storytelling. Instagram needs visual hooks. Nect knows the difference." },
  { title: "You stay in control", desc: "Every post is fully editable before it goes anywhere. AI drafts, you approve. Always." },
  { title: "Schedule without a cron job", desc: "Pick a time, connect Google Calendar, and posts go out automatically — even while you sleep." },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["3 connected platforms", "20 AI generations/month", "10 scheduled posts", "Google Calendar sync"],
    cta: "Start free",
    href: "/auth?next=/onboarding",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    features: ["All 5 platforms", "Unlimited AI generations", "Unlimited scheduling", "Priority support", "Advanced analytics"],
    cta: "Start free trial",
    href: "/auth?next=/onboarding&plan=pro",
    highlight: true,
  },
];

// ── Component ───────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[700px] w-[700px] rounded-full bg-[#F97316]/15 blur-[140px]" />
        <div className="absolute -right-20 top-1/3 h-[500px] w-[500px] rounded-full bg-[#F97316]/8 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#F97316]/5 blur-[100px]" />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 md:px-10 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-white">
          <Sparkles className="h-4 w-4 text-[#F97316]" />
          Nect
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/auth"
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors sm:block"
          >
            Log in
          </Link>
          <Link
            href="/auth?next=/onboarding"
            className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-bold text-black hover:bg-[#ea580c] transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-5xl px-6 md:px-10">

        {/* ── Hero ── */}
        <section className="pt-20 pb-24 md:pt-28">
          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            animate="show"
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#F97316]/25 bg-[#F97316]/8 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#F97316]">
                <Sparkles className="h-3 w-3" />
                AI-powered social media
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
              Write once.{" "}
              <span className="relative">
                <span className="relative z-10 italic text-[#F97316]">Publish differently</span>
              </span>{" "}
              everywhere.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
              Nect generates unique, platform-native posts for Instagram, X, LinkedIn, Reddit, and Facebook — all from one idea. No copy-pasting. No reformatting.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/auth?next=/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-3.5 text-sm font-extrabold text-black hover:bg-[#ea580c] transition-colors"
              >
                Start creating posts
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3.5 text-sm font-semibold text-zinc-300 hover:border-white/20 hover:text-white transition-colors"
              >
                Try demo
              </Link>
              <Link
                href="/auth"
                className="hidden items-center gap-1 text-sm text-zinc-600 hover:text-zinc-400 transition-colors sm:inline-flex"
              >
                Log in <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            {/* Social proof line */}
            <motion.p variants={fadeUp} className="mt-6 text-xs text-zinc-700">
              No credit card required · Free plan available · Takes 60 seconds to set up
            </motion.p>
          </motion.div>

          {/* Platform badges */}
          <Section className="mt-16 flex flex-wrap gap-2">
            {platforms.map(({ name, icon: Icon, color }) => (
              <motion.div
                key={name}
                variants={fadeUp}
                className="flex items-center gap-2 rounded-full border border-white/8 bg-white/3 px-4 py-2 backdrop-blur"
              >
                <Icon className="h-4 w-4" style={{ color }} />
                <span className="text-sm font-medium text-zinc-400">{name}</span>
              </motion.div>
            ))}
            <motion.div variants={fadeUp} className="flex items-center gap-2 rounded-full border border-dashed border-white/10 px-4 py-2">
              <span className="text-sm text-zinc-700">More coming</span>
            </motion.div>
          </Section>
        </section>

        {/* ── How it works ── */}
        <section className="py-20 border-t border-white/[0.06]">
          <Section>
            <motion.p variants={fadeUp} className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F97316]">
              How it works
            </motion.p>
            <motion.h2 variants={fadeUp} className="mb-3 text-4xl font-extrabold leading-tight md:text-5xl">
              From idea to everywhere
              <br />
              <span className="text-zinc-600">in under 30 seconds.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mb-12 max-w-xl text-base text-zinc-500">
              The fastest path from "I have something to say" to "it's live on every platform."
            </motion.p>

            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(({ n, title, desc, icon: Icon }) => (
                <motion.div
                  key={n}
                  variants={fadeUp}
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] p-6 hover:border-[#F97316]/20 transition-colors"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-3xl font-black text-[#F97316]/20 group-hover:text-[#F97316]/40 transition-colors">{n}</span>
                    <div className="rounded-xl bg-[#F97316]/8 p-2">
                      <Icon className="h-4 w-4 text-[#F97316]" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-base font-bold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-600">{desc}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </section>

        {/* ── Differentiation ── */}
        <section className="py-20 border-t border-white/[0.06]">
          <Section>
            <motion.p variants={fadeUp} className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F97316]">
              Not just another scheduler
            </motion.p>
            <motion.h2 variants={fadeUp} className="mb-12 text-4xl font-extrabold leading-tight md:text-5xl">
              Built different.
              <br />
              <span className="text-zinc-600">Works different.</span>
            </motion.h2>

            <div className="grid gap-3 md:grid-cols-2">
              {differences.map(({ title, desc }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-6"
                >
                  <div className="mt-0.5 shrink-0">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F97316]">
                      <Check className="h-3 w-3 text-black" strokeWidth={3} />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-sm font-bold text-white">{title}</h3>
                    <p className="text-sm leading-relaxed text-zinc-600">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        </section>

        {/* ── Pricing ── */}
        <section className="py-20 border-t border-white/[0.06]">
          <Section>
            <motion.p variants={fadeUp} className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F97316]">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} className="mb-3 text-4xl font-extrabold leading-tight md:text-5xl">
              Start free.
              <br />
              <span className="text-zinc-600">Scale when ready.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mb-12 max-w-md text-base text-zinc-500">
              No credit card required to get started. Upgrade when you need unlimited.
            </motion.p>

            <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
              {plans.map((plan) => (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  className={`relative rounded-2xl border p-8 ${
                    plan.highlight
                      ? "border-[#F97316]/40 bg-[#F97316]/[0.04]"
                      : "border-white/8 bg-white/[0.02]"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-6">
                      <span className="rounded-full bg-[#F97316] px-3 py-1 text-xs font-extrabold text-black">
                        Most popular
                      </span>
                    </div>
                  )}
                  <p className="text-sm font-semibold text-zinc-400">{plan.name}</p>
                  <div className="mt-2 flex items-baseline gap-0.5">
                    <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-sm text-zinc-600">{plan.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-400">
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#F97316]" strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold transition-colors ${
                      plan.highlight
                        ? "bg-[#F97316] text-black hover:bg-[#ea580c]"
                        : "border border-white/10 text-zinc-300 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </Section>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-20 border-t border-white/[0.06]">
          <Section className="text-center">
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold md:text-6xl">
              Ready to post smarter?
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-zinc-500">
              Join creators who stopped copy-pasting and started creating platform-perfect content.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth?next=/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-8 py-4 text-base font-extrabold text-black hover:bg-[#ea580c] transition-colors"
              >
                Start creating posts
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth"
                className="rounded-xl border border-white/10 px-8 py-4 text-base font-semibold text-zinc-400 hover:border-white/20 hover:text-white transition-colors"
              >
                Log in
              </Link>
            </motion.div>
          </Section>
        </section>

      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-zinc-600">
            <Sparkles className="h-3.5 w-3.5 text-[#F97316]/50" />
            Nect
          </span>
          <div className="flex gap-6 text-xs text-zinc-700">
            <Link href="/auth" className="hover:text-zinc-400 transition-colors">Log in</Link>
            <Link href="/auth?next=/onboarding" className="hover:text-zinc-400 transition-colors">Sign up</Link>
            <Link href="/dashboard" className="hover:text-zinc-400 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}