"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import {
  DEMO_VIDEO_PATH_MP4,
  DEMO_VIDEO_PATH_MOV,
  DEMO_VIDEO_PLAYBACK_RATE,
} from "@/lib/demo-video-chapters";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function LandingDemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoBroken, setVideoBroken] = useState(false);

  const applySpeedAndPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = DEMO_VIDEO_PLAYBACK_RATE;
    void v.play().catch(() => {});
  }, []);

  useEffect(() => {
    applySpeedAndPlay();
  }, [applySpeedAndPlay]);

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
          Demo
        </motion.p>
        <motion.h2 variants={fadeUp} className="mb-8 text-center text-3xl font-extrabold leading-tight md:text-5xl">
          See Nect in action
        </motion.h2>

        <motion.div
          variants={fadeUp}
          className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.65)]"
        >
          <div className="relative aspect-video w-full bg-black">
            {videoBroken ? (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="max-w-md text-sm text-zinc-400">
                  This browser could not load the demo. Try opening the file directly.
                </p>
                <a
                  href={DEMO_VIDEO_PATH_MP4}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#fb923c]"
                >
                  Open demo (MP4)
                </a>
              </div>
            ) : (
              <video
                ref={videoRef}
                className="h-full w-full object-contain pointer-events-none select-none"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                disablePictureInPicture
                onLoadedMetadata={applySpeedAndPlay}
                onError={() => setVideoBroken(true)}
                aria-label="Nect product demo video playing at double speed"
              >
                <source src={DEMO_VIDEO_PATH_MP4} type="video/mp4" />
                <source src={DEMO_VIDEO_PATH_MOV} type="video/quicktime" />
              </video>
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
