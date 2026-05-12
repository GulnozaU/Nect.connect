/**
 * Normalizes AI-generated LinkedIn text into feed-native layout:
 * short vertical rhythm (line-by-line / sentence blocks), not a single wall of text.
 * Preserves a trailing hashtag block when present.
 */

function splitHashtagFooter(text: string): { body: string; tags: string } {
  const trimmed = text.trimEnd();
  const lines = trimmed.split(/\n/);

  let end = lines.length;
  while (end > 0) {
    const line = lines[end - 1].trim();
    if (!line) {
      end--;
      continue;
    }
    if (/^(#\w[\w-]*)(\s+#\w[\w-]*)*$/i.test(line)) {
      end--;
      continue;
    }
    break;
  }

  const tagBlock = lines.slice(end).join("\n").trim();
  const body = lines.slice(0, end).join("\n").trimEnd();
  if (!tagBlock) return { body: trimmed, tags: "" };
  return { body, tags: tagBlock };
}

/** Collapse 3+ newlines; trim each line's edges without destroying intentional spaces in the middle of a line. */
function normalizeNewlines(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * If a segment is still a dense paragraph, split on sentence boundaries
 * so each sentence becomes its own block (LinkedIn-style scroll).
 */
function breakDenseParagraph(segment: string): string {
  const s = segment.trim();
  if (!s) return "";
  const lineCount = s.split(/\n/).filter((l) => l.trim()).length;
  const longestRun = Math.max(
    0,
    ...s.split(/\n/).map((l) => l.replace(/\s+/g, " ").trim().length)
  );
  if (lineCount >= 5 && longestRun < 140) return s;

  const sentences = s
    .split(/(?<=[.!?])\s+(?=[A-Z\d"“('])/u)
    .map((x) => x.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return s;
  return sentences.join("\n\n");
}

export function formatLinkedInPost(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const { body, tags } = splitHashtagFooter(trimmed);
  let main = normalizeNewlines(body);

  const parts = main.split(/\n\n/).map((p) => breakDenseParagraph(p));
  main = parts.filter(Boolean).join("\n\n");

  if (!tags) return main;
  return `${main}\n\n${tags.trim()}`;
}
