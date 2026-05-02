import { useEffect, useRef, useState } from 'react';
import type { OverrideSequence } from '@/data/overrides';

interface UseKeyboardOverrideOptions {
  map: Record<string, OverrideSequence>;
}

interface UseKeyboardOverrideResult {
  override: string | null;
  stageIndex: number;
  totalStages: number;
  clear: () => void;
}

interface ParsedStage {
  text: string;
  cumulativeDelayMs: number;
}

function parseSequence(seq: OverrideSequence): ParsedStage[] {
  const stages: ParsedStage[] = [];
  let delaySoFar = 0;
  let pendingDelay = 0;
  for (const item of seq) {
    if (typeof item === 'number') {
      pendingDelay += item;
    } else if (typeof item === 'string') {
      delaySoFar += pendingDelay;
      pendingDelay = 0;
      stages.push({ text: item, cumulativeDelayMs: delaySoFar });
    }
  }
  return stages;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function useKeyboardOverride({
  map,
}: UseKeyboardOverrideOptions): UseKeyboardOverrideResult {
  const [override, setOverride] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [totalStages, setTotalStages] = useState(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    function cancelTimers() {
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
    }

    function clearAll() {
      cancelTimers();
      setOverride(null);
      setStageIndex(0);
      setTotalStages(0);
    }

    function play(seq: OverrideSequence) {
      cancelTimers();
      const stages = parseSequence(seq);
      if (stages.length === 0) {
        clearAll();
        return;
      }
      setTotalStages(stages.length);
      stages.forEach((stage, i) => {
        if (stage.cumulativeDelayMs <= 0) {
          setOverride(stage.text);
          setStageIndex(i);
          return;
        }
        const id = window.setTimeout(() => {
          setOverride(stage.text);
          setStageIndex(i);
        }, stage.cumulativeDelayMs);
        timersRef.current.push(id);
      });
    }

    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;
      if (isEditableTarget(e.target)) return;
      if (e.key === 'Escape') {
        clearAll();
        return;
      }
      const seq = map[e.key];
      if (seq && seq.length > 0) {
        e.preventDefault();
        play(seq);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      cancelTimers();
    };
  }, [map]);

  return {
    override,
    stageIndex,
    totalStages,
    clear: () => {
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
      setOverride(null);
      setStageIndex(0);
      setTotalStages(0);
    },
  };
}
