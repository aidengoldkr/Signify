import { useEffect, useState } from 'react';
import type { HandFrame } from '@/types/gesture';
import { LandmarkOverlay } from '@/components/LandmarkOverlay';
import styles from './ViewportPane.module.css';

interface ViewportPaneProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hands: HandFrame[];
  loadingLabel?: string | null;
  errorLabel?: string | null;
}

export function ViewportPane({
  videoRef,
  hands,
  loadingLabel,
  errorLabel,
}: ViewportPaneProps) {
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 1280, h: 720 });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const update = () => {
      if (v.videoWidth && v.videoHeight) {
        setDims({ w: v.videoWidth, h: v.videoHeight });
      }
    };
    v.addEventListener('loadedmetadata', update);
    update();
    return () => v.removeEventListener('loadedmetadata', update);
  }, [videoRef]);

  return (
    <div className={styles.wrap}>
      <video
        ref={videoRef}
        className={styles.video}
        autoPlay
        muted
        playsInline
      />
      <LandmarkOverlay hands={hands} width={dims.w} height={dims.h} />
      {loadingLabel && <div className={styles.loading}>{loadingLabel}</div>}
      {errorLabel && <div className={styles.error}>{errorLabel}</div>}
    </div>
  );
}
