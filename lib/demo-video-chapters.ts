export type DemoChapter = {
  id: string;
  title: string;
  caption: string;
  startSec: number;
  endSec?: number;
};

/** H.264 in MP4 — plays in Chrome, Firefox, Safari (`public/demo_YC-S26.mp4`) */
export const DEMO_VIDEO_PATH_MP4 = "/demo_YC-S26.mp4";

/** QuickTime container — fallback; original asset name is `demo_YC-S26.mov` in repo root / `public/` */
export const DEMO_VIDEO_PATH_MOV = "/demo_YC-S26.mov";

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
