import { useRef, type ReactNode } from 'react';
import styles from './SplitView.module.css';

interface SplitViewProps {
  left: ReactNode;
  right: ReactNode;
  leftRatio?: number;
  onRatioChange?: (ratio: number) => void;
}

const MIN_RATIO = 0.25;
const MAX_RATIO = 0.85;

export function SplitView({
  left,
  right,
  leftRatio = 0.6,
  onRatioChange,
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onRatioChange) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !onRatioChange) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    
    let raw = 0;
    if (isMobile) {
      if (rect.height <= 0) return;
      raw = (e.clientY - rect.top) / rect.height;
    } else {
      if (rect.width <= 0) return;
      raw = (e.clientX - rect.left) / rect.width;
    }
    
    const clamped = Math.max(MIN_RATIO, Math.min(MAX_RATIO, raw));
    onRatioChange(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const cssVars = {
    '--left-fr': `${leftRatio}fr`,
    '--right-fr': `${1 - leftRatio}fr`,
    '--top-fr': `${leftRatio}fr`,
    '--bottom-fr': `${1 - leftRatio}fr`,
  } as React.CSSProperties;

  return (
    <div ref={containerRef} className={styles.shell} style={cssVars}>
      <div className={styles.leftPane}>{left}</div>
      <div
        className={styles.divider}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="separator"
        aria-orientation="vertical"
      >
        <div className={styles.dividerHandle} />
      </div>
      <div className={styles.rightPane}>{right}</div>
    </div>
  );
}
