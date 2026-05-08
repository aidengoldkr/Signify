import { useEffect, useState } from 'react';
import type { HandFrame } from '@/types/gesture';
import { LandmarkOverlay } from '@/components/LandmarkOverlay';
import styles from './ViewportPane.module.css';

interface ViewportPaneProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hands: HandFrame[];
  loadingLabel?: string | null;
  errorLabel?: string | null;
  onToggleCamera?: () => void;
  facingMode?: 'user' | 'environment';
}

export function ViewportPane({
  videoRef,
  hands,
  loadingLabel,
  errorLabel,
  onToggleCamera,
  facingMode = 'user',
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
        className={`${styles.video} ${facingMode === 'user' ? styles.mirrored : ''}`}
        autoPlay
        muted
        playsInline
      />
      <LandmarkOverlay hands={hands} width={dims.w} height={dims.h} />
      
      {onToggleCamera && (
        <button 
          className={styles.cameraToggle} 
          onClick={onToggleCamera}
          title="카메라 전환"
          aria-label="카메라 전환"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      )}

      {loadingLabel && <div className={styles.loading}>{loadingLabel}</div>}
      {errorLabel && <div className={styles.error}>{errorLabel}</div>}
    </div>
  );
}
