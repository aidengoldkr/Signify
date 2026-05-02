import type { GestureSnapshot, HandFrame, MatchResult } from '@/types/gesture';
import { canonicalizeHands } from '@/lib/canonicalizeHands';
import { cosineSimilarity } from '@/lib/cosineSimilarity';

export interface PreparedSnapshot {
  label: string;
  vector: number[];
}

export function prepareLibrary(snapshots: GestureSnapshot[]): PreparedSnapshot[] {
  return snapshots.map((s) => ({
    label: s.label,
    vector: canonicalizeHands(s.hands),
  }));
}

export function matchGesture(
  current: HandFrame[],
  library: PreparedSnapshot[],
  threshold = 0.85,
): MatchResult {
  if (library.length === 0 || current.length === 0) return { kind: 'idle' };

  const cur = canonicalizeHands(current);
  let bestLabel = '';
  let bestScore = -Infinity;
  for (const snap of library) {
    const score = cosineSimilarity(cur, snap.vector);
    if (score > bestScore) {
      bestScore = score;
      bestLabel = snap.label;
    }
  }

  return bestScore >= threshold
    ? { kind: 'match', label: bestLabel, score: bestScore }
    : { kind: 'idle' };
}
