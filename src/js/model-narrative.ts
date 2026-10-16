export type NarrativeTrack = "past" | "present" | "future";

const TEMPORAL_GHOST_DEPTH = 0.022;
const TEMPORAL_GHOST_OPACITY: Record<NarrativeTrack, number> = {
  past: 0.06,
  present: 0.012,
  future: 0.07,
};

export const temporalGhostDepth = (track: NarrativeTrack): number => {
  if (track === "past") return -TEMPORAL_GHOST_DEPTH;
  if (track === "future") return TEMPORAL_GHOST_DEPTH;
  return 0;
};

export const temporalGhostOpacity = (track: NarrativeTrack, progress: number): number => {
  const position = Math.max(0, Math.min(1, progress));
  const presence = track === "past"
    ? Math.max(0, 1 - position / 0.38)
    : track === "future"
      ? Math.max(0, (position - 0.52) / 0.48)
      : Math.max(0, 1 - Math.abs(position - 0.5) / 0.28);
  return TEMPORAL_GHOST_OPACITY[track] * presence;
};
