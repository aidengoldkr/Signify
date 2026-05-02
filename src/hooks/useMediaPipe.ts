import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { HandFrame, Handedness } from '@/types/gesture';

export type MediaPipeStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseMediaPipeOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  onHands: (frames: HandFrame[]) => void;
  onLatencyMs?: (ms: number) => void;
}

interface UseMediaPipeResult {
  status: MediaPipeStatus;
  error: string | null;
}

const WASM_BASE = '/mediapipe-wasm';

const MODEL_PATH = '/models/hand_landmarker.task';

export function useMediaPipe({
  videoRef,
  enabled,
  onHands,
  onLatencyMs,
}: UseMediaPipeOptions): UseMediaPipeResult {
  const [status, setStatus] = useState<MediaPipeStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const onHandsRef = useRef(onHands);
  const onLatencyRef = useRef(onLatencyMs);
  onHandsRef.current = onHands;
  onLatencyRef.current = onLatencyMs;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let landmarker: HandLandmarker | null = null;
    let rafId = 0;
    let lastVideoTime = -1;

    async function init() {
      setStatus('loading');
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
        if (cancelled) return;
        try {
          landmarker = await HandLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: MODEL_PATH,
              delegate: 'GPU',
            },
            numHands: 2,
            runningMode: 'VIDEO',
          });
        } catch (gpuErr) {
          console.warn('[Signify] GPU delegate failed, falling back to CPU:', gpuErr);
          landmarker = await HandLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: MODEL_PATH,
              delegate: 'CPU',
            },
            numHands: 2,
            runningMode: 'VIDEO',
          });
        }
        if (cancelled) {
          landmarker.close();
          return;
        }
        console.info('[Signify] HandLandmarker ready');
        setStatus('ready');
        loop();
      } catch (err) {
        console.error('[Signify] HandLandmarker init failed:', err);
        if (cancelled) return;
        const message = err instanceof Error ? err.message : '핸드 트래커 초기화 실패';
        setError(message);
        setStatus('error');
      }
    }

    function loop() {
      if (cancelled) return;
      const video = videoRef.current;
      if (video && landmarker && video.readyState >= 2 && !video.paused) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const t0 = performance.now();
          const result = landmarker.detectForVideo(video, t0);
          const t1 = performance.now();
          onLatencyRef.current?.(t1 - t0);

          const frames: HandFrame[] = [];
          const handedness = result.handednesses ?? [];
          const lmList = result.landmarks ?? [];
          for (let i = 0; i < lmList.length; i++) {
            const lm = lmList[i];
            const handLabel = handedness[i]?.[0]?.categoryName as Handedness | undefined;
            if (!lm || !handLabel) continue;
            frames.push({
              handedness: handLabel,
              landmarks: lm.map((p) => ({ x: p.x, y: p.y, z: p.z })),
            });
          }
          onHandsRef.current(frames);
        }
      }
      rafId = requestAnimationFrame(loop);
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (landmarker) landmarker.close();
    };
  }, [enabled, videoRef]);

  return { status, error };
}
