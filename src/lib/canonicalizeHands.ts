import type { HandFrame } from '@/types/gesture';
import { normalizeLandmarks } from '@/lib/normalizeLandmarks';

const HAND_VECTOR_LENGTH = 63;
const FULL_VECTOR_LENGTH = HAND_VECTOR_LENGTH * 2;

function flattenHand(hand: HandFrame | undefined): number[] {
  if (!hand) return new Array<number>(HAND_VECTOR_LENGTH).fill(0);
  const norm = normalizeLandmarks(hand.landmarks);
  const out = new Array<number>(HAND_VECTOR_LENGTH);
  for (let i = 0; i < 21; i++) {
    const p = norm[i];
    if (!p) {
      out[i * 3] = 0;
      out[i * 3 + 1] = 0;
      out[i * 3 + 2] = 0;
      continue;
    }
    out[i * 3] = p.x;
    out[i * 3 + 1] = p.y;
    out[i * 3 + 2] = p.z;
  }
  return out;
}

export function canonicalizeHands(hands: HandFrame[]): number[] {
  const left = hands.find((h) => h.handedness === 'Left');
  const right = hands.find((h) => h.handedness === 'Right');
  const leftVec = flattenHand(left);
  const rightVec = flattenHand(right);
  const out = new Array<number>(FULL_VECTOR_LENGTH);
  for (let i = 0; i < HAND_VECTOR_LENGTH; i++) out[i] = leftVec[i]!;
  for (let i = 0; i < HAND_VECTOR_LENGTH; i++) out[HAND_VECTOR_LENGTH + i] = rightVec[i]!;
  return out;
}
