"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

import {
  DEMO_CHAPTERS,
  DEMO_VIDEO_PATH,
  type DemoChapter,
} from "@/lib/demo-video-chapters";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function chapterAtTime(t: number, chapters: DemoChapter[]): string | null {
  const sorted = [...chapters].sort((a, b) => b.startSec - a.startSec);
  for (const ch of sorted) {
    if (t >= ch.startSec) return ch.id;
  }
  return chapters[0]?.id ?? null;
}

export function LandingDemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const softEndRef = useRef<number | null>(null);
  const [activeId, setActiveId] = useState<string>(DEMO_CHAPTERS[0]?.id ?? "");

  const goToChapter = useCallback((ch: DemoChapter) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = ch.startSec;
    softEndRef.current = ch.endSec ?? null;
    setActiveId(ch.id);
    void v.play().catch(() => {
      /* autoplay blocked until user gesture — controls still work */
    });
  }, []);

  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const end = softEndRef.current;
    if (end != null && v.currentTime >= end) {
      v.pause();
      softEndRef.current = null;
    }
    const id = chapterAtTime(v.currentTime, DEMO_CHAPTERS);
    if (id) setActiveId(id);
  }, []);

  const onSeeked = useCallback(() => {
    softEndRef.current = null;
    const v = videoRef.current;
    if (!v) return;
    const id = chapterAtTime(v.currentTime, DEMO_CHAPTERS);
    if (id) setActiveId(id);
  }, []);

  return (
    <section id="demo" className="border-t border-white/[0.06] py-20 md:py-28">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        className="mx-auto max-w-4xl"
      >
        <motion.p variants={fadeUp} className="mb-2 text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#F97316]">
          Product demo
        </motion.p>
        <motion.h2 variants={fadeUp} className="mb-3 text-center text-3xl font-extrabold leading-tight md:text-5xl">
          See Nect in action
        </motion.h2>
        <motion.p variants={fadeUp} className="mx-auto mb-10 max-w-xl text-center text-sm text-zinc-500 md:text-base">
          Jump to the part of the walkthrough that matches each feature. Edit the chapter start times in{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-zinc-400">lib/demo-video-chapters.ts</code>{" "}
          after you skim the recording once.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.65)]"
        >
          <div className="relative aspect-video w-full bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              controls
              playsInline
              preload="metadata"
              onTimeUpdate={onTimeUpdate}
              onSeeked={onSeeked}
              aria-label="Nect product demo video"
            >
              <source src={DEMO_VIDEO_PATH} type="video/quicktime" />
              Your browser may not play this MOV preview — open the site in Safari or Chrome on desktop, or convert the
              file to MP4 for broader support.
            </video>
          </div>

          <div className="border-t border-white/[0.06] bg-black/60 p-4 backdrop-blur-sm md:p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Jump to a feature</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {DEMO_CHAPTERS.map((ch) => {
                const on = activeId === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => goToChapter(ch)}
                    className={`flex w-full flex-col rounded-xl border px-3 py-3 text-left transition-all duration-200 sm:flex-row sm:items-center sm:gap-3 ${
                      on
                        ? "border-[#F97316]/45 bg-[#F97316]/[0.08] shadow-[0_0_20px_rgba(249,115,22,0.12)]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/50 text-[#F97316]">
                      <Play className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-white">{ch.title}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-zinc-500">{ch.caption}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
