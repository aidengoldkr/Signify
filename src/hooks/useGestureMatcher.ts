import { useEffect, useRef, useState } from 'react';
import type { HandFrame, MatchResult } from '@/types/gesture';
import { matchGesture, type PreparedSnapshot } from '@/lib/matcher';

interface UseGestureMatcherOptions {
  library: PreparedSnapshot[];
  threshold?: number;
  intervalFrames?: number;
}

interface UseGestureMatcherResult {
  result: MatchResult;
  pushHands: (frames: HandFrame[]) => void;
}

export function useGestureMatcher({
  library,
  threshold = 0.85,
  intervalFrames = 3,
}: UseGestureMatcherOptions): UseGestureMatcherResult {
  const [result, setResult] = useState<MatchResult>({ kind: 'idle' });
  const handsRef = useRef<HandFrame[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;

    function tick() {
      if (cancelled) return;
      counterRef.current = (counterRef.current + 1) % intervalFrames;
      if (counterRef.current === 0) {
        const next = matchGesture(handsRef.current, library, threshold);
        setResult((prev) => {
          if (prev.kind === next.kind) {
            if (prev.kind === 'idle') return prev;
            if (
              prev.kind === 'match' &&
              next.kind === 'match' &&
              prev.label === next.label &&
              Math.abs(prev.score - next.score) < 0.005
            ) {
              return prev;
            }
          }
          return next;
        });
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [library, threshold, intervalFrames]);

  const pushHands = (frames: HandFrame[]) => {
    handsRef.current = frames;
  };

  return { result, pushHands };
}
