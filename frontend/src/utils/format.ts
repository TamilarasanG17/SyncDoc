/** Curated accent palette for document icon chips — derived from the same
 * design tokens as the rest of the app (teal / violet / ochre / sage /
 * berry), never a full rainbow, so a grid of documents still reads as one
 * cohesive product. */
const DOC_ICON_PALETTE = ['#0E7C86', '#6E5ADB', '#C97A2E', '#3F7D4F', '#B23A6B'];

/** Deterministic color per string (document title), so the same document
 * always gets the same icon color across renders and sessions. */
export function colorForString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DOC_ICON_PALETTE[Math.abs(hash) % DOC_ICON_PALETTE.length];
}

/** Up to two initials from a document title, for its icon chip. */
export function initialsForTitle(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Human-friendly relative timestamp ("3m ago", "2d ago"), falling back
 * to a plain date once it's more than a week old. */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export const RECENT_WINDOW_MS = 3 * DAY;
