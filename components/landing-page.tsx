"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Linkedin,
  Orbit,
  Radio,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const platforms = [
  { name: "X", icon: Radio },
  { name: "Instagram", icon: Instagram },
  { name: "Reddit", icon: MessageCircle },
  { name: "Facebook", icon: Facebook },
  { name: "LinkedIn", icon: Linkedin },
];

export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.35),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(249,115,22,0.2),transparent_35%)]" />
      <section className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="space-y-6"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-[#f97316]/40 bg-[#f97316]/10 px-4 py-1 text-xs uppercase tracking-[0.18em] text-[#f97316]">
            <Sparkles className="h-3.5 w-3.5" />
            Nect
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold italic leading-[0.95] md:text-7xl">
            <span className="font-serif">Forge your influence.</span>
          </h1>
          <p className="max-w-3xl text-lg text-zinc-300 md:text-xl">
            Nect is the ultimate orchestration engine for Insta, X, Reddit,
            Facebook, and LinkedIn. One tab. Total dominance.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-[#F97316] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#fb923c]"
            >
              Try as guest
            </Link>
            <Link
              href="/auth?next=/onboarding"
              className="rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
            >
              Create account
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.75, delay: 0.15 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
        >
          {platforms.map((platform, index) => {
            const Icon = platform.icon;
            return (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="group relative overflow-hidden rounded-2xl border border-[#f97316]/45 bg-zinc-950/80 p-5 backdrop-blur md:col-span-2"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute -left-10 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-[#f97316]/20 blur-2xl" />
                </div>
                <div className="relative flex items-center justify-between">
                  <p className="text-sm text-zinc-300">{platform.name}</p>
                  <Icon className="h-5 w-5 text-[#f97316]" />
                </div>
              </motion.div>
            );
          })}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: 0.44, duration: 0.45 }}
            className="relative col-span-1 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 md:col-span-6"
          >
            <div className="flex items-center gap-3 text-zinc-300">
              <Orbit className="h-5 w-5 text-[#f97316]" />
              Orchestrate campaigns, drafts, and publishing in one command
              center.
            </div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
