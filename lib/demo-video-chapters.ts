export type DemoChapter = {
  id: string;
  title: string;
  caption: string;
  startSec: number;
  endSec?: number;
};

/** Served from `public/demo_YC-S26.mov` — same file as `demo_YC-S26.mov` in project root */
export const DEMO_VIDEO_PATH = "/demo_YC-S26.mov";

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
