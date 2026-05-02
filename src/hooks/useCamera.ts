import { useEffect, useRef, useState } from 'react';

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  ready: boolean;
  error: string | null;
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let started = false;
    let stream: MediaStream | null = null;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled && !started) {
        setError('카메라 시작 시간 초과 (5초). 권한을 확인하고 다시 시도해 주세요.');
      }
    }, 5000);

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) resolve();
          else video.addEventListener('loadeddata', () => resolve(), { once: true });
        });
        await video.play().catch(() => {});
        if (!cancelled) {
          started = true;
          window.clearTimeout(timeoutId);
          setReady(true);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.name === 'NotAllowedError'
              ? '카메라 접근이 거부되었습니다. 브라우저 사이트 설정에서 권한을 허용해 주세요.'
              : err.message
            : '알 수 없는 카메라 오류';
        setError(message);
      }
    }

    start();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, ready, error };
}
