/**
 * Demo chapter markers for the landing page video.
 *
 * Tune `startSec` (and optional `endSec`) after one pass through `public/demo/nect-demo.mov`
 * (QuickTime: Window → Show Movie Inspector for duration and timing).
 *
 * Optional `endSec`: when set, the landing player pauses there after you jump to that chapter
 * (a soft “cut” without re-encoding).
 *
 * To make real separate files (e.g. for social clips), install ffmpeg and run e.g.:
 *   ffmpeg -y -i public/demo/nect-demo.mov -ss 0 -t 32 -c copy public/demo/clip-idea.mov
 */
export type DemoChapter = {
  id: string;
  title: string;
  caption: string;
  startSec: number;
  endSec?: number;
};

export const DEMO_VIDEO_PATH = "/demo/nect-demo.mov";

/** Order matches: idea → AI drafts → edit & schedule → calendar / overview */
export const DEMO_CHAPTERS: DemoChapter[] = [
  {
    id: "idea",
    title: "One idea in",
    caption: "Type a topic or paste a line — that’s enough to start.",
    startSec: 0,
  },
  {
    id: "drafts",
    title: "Platform-native drafts",
    caption: "LinkedIn, X, and more — each post written for that network, not copy-pasted.",
    startSec: 35,
  },
  {
    id: "edit",
    title: "Edit & refine",
    caption: "Tweak tone and copy before anything goes live.",
    startSec: 70,
  },
  {
    id: "schedule",
    title: "Schedule & calendar",
    caption: "Pick a time or sync with Google Calendar so posts ship on time.",
    startSec: 105,
  },
];
