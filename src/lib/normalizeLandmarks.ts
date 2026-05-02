import type { Landmark } from '@/types/gesture';

const PALM_INDICES = [0, 5, 9, 13, 17] as const;

function distance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function normalizeLandmarks(lm: Landmark[]): Landmark[] {
  if (lm.length !== 21) return lm;

  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const i of PALM_INDICES) {
    const p = lm[i]!;
    cx += p.x;
    cy += p.y;
    cz += p.z;
  }
  cx /= PALM_INDICES.length;
  cy /= PALM_INDICES.length;
  cz /= PALM_INDICES.length;

  const wrist = lm[0]!;
  const middleMcp = lm[9]!;
  const scale = distance(wrist, middleMcp) || 1e-6;

  return lm.map((p) => ({
    x: (p.x - cx) / scale,
    y: (p.y - cy) / scale,
    z: (p.z - cz) / scale,
  }));
}
