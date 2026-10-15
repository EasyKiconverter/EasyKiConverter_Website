export type NarrativeTrack = "past" | "present" | "future";

const TEMPORAL_GHOST_DEPTH = 0.022;

export const temporalGhostDepth = (track: NarrativeTrack): number => {
  if (track === "past") return -TEMPORAL_GHOST_DEPTH;
  if (track === "future") return TEMPORAL_GHOST_DEPTH;
  return 0;
};
