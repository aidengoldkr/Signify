import { useEffect, useRef } from 'react';
import { DrawingUtils, HandLandmarker } from '@mediapipe/tasks-vision';
import type { HandFrame } from '@/types/gesture';
import styles from './LandmarkOverlay.module.css';

interface LandmarkOverlayProps {
  hands: HandFrame[];
  width: number;
  height: number;
}

export function LandmarkOverlay({ hands, width, height }: LandmarkOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (hands.length === 0) return;

    const drawing = new DrawingUtils(ctx);
    for (const hand of hands) {
      const lm = hand.landmarks.map((p) => ({ ...p, visibility: 1 }));
      drawing.drawConnectors(lm, HandLandmarker.HAND_CONNECTIONS, {
        color: 'rgba(255, 255, 255, 0.55)',
        lineWidth: 4,
      });
      drawing.drawLandmarks(lm, {
        color: hand.handedness === 'Left' ? '#6ec1e4' : '#d4a017',
        fillColor: hand.handedness === 'Left' ? '#6ec1e4' : '#d4a017',
        radius: 5,
        lineWidth: 1,
      });
    }
  }, [hands, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={styles.overlay}
    />
  );
}
