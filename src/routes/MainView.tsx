import { useEffect, useMemo, useRef, useState } from 'react';
import type { HandFrame } from '@/types/gesture';
import { SplitView } from '@/components/SplitView';
import { ViewportPane } from '@/components/ViewportPane';
import { OutputPane } from '@/components/OutputPane';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useCamera } from '@/hooks/useCamera';
import { useMediaPipe } from '@/hooks/useMediaPipe';
import { useGestureMatcher } from '@/hooks/useGestureMatcher';
import { useKeyboardOverride } from '@/hooks/useKeyboardOverride';
import { prepareLibrary } from '@/lib/matcher';
import { snapshots } from '@/data/snapshots';
import { overrides as defaultOverrides, type OverrideSequence } from '@/data/overrides';
import styles from './MainView.module.css';

const STORAGE_KEY = 'signify.overrides.v1';
const LAYOUT_KEY = 'signify.layout.v1';

function loadOverrides(): Record<string, OverrideSequence> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultOverrides;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, OverrideSequence>;
    }
  } catch { }
  return defaultOverrides;
}

function loadLeftRatio(): number {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const r = parsed?.leftRatio;
      if (typeof r === 'number' && r >= 0.2 && r <= 0.9) return r;
    }
  } catch { }
  return 0.6;
}

export function MainView() {
  const { videoRef, ready: cameraReady, error: cameraError } = useCamera();
  const [hands, setHands] = useState<HandFrame[]>([]);
  const latencyBufRef = useRef<number[]>([]);
  const [latencyP50, setLatencyP50] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [currentOverrides, setCurrentOverrides] = useState<Record<string, OverrideSequence>>(
    () => loadOverrides(),
  );
  const [leftRatio, setLeftRatio] = useState<number>(() => loadLeftRatio());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOverrides));
    } catch { }
  }, [currentOverrides]);

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify({ leftRatio }));
    } catch { }
  }, [leftRatio]);

  const library = useMemo(() => prepareLibrary(snapshots), []);
  const { result, pushHands } = useGestureMatcher({ library });
  const { override, stageIndex, totalStages, playKey, clear: clearOverride } = useKeyboardOverride({
    map: currentOverrides,
  });

  const { status: mpStatus, error: mpError } = useMediaPipe({
    videoRef,
    enabled: cameraReady,
    onHands: (frames) => {
      setHands(frames);
      pushHands(frames);
    },
    onLatencyMs: (ms) => {
      const buf = latencyBufRef.current;
      buf.push(ms);
      if (buf.length > 60) buf.shift();
      if (buf.length % 15 === 0) {
        const sorted = [...buf].sort((a, b) => a - b);
        const mid = sorted[Math.floor(sorted.length / 2)] ?? 0;
        setLatencyP50(mid);
      }
    },
  });

  const displayText =
    override ??
    (result.kind === 'match' ? result.label : '');

  const loadingLabel =
    !cameraReady && !cameraError
      ? '카메라 준비 중...'
      : cameraReady && mpStatus === 'loading'
        ? '핸드 트래커 로딩 중...'
        : null;

  const errorLabel = cameraError ?? mpError;

  const footer = (
    <div className={styles.footerRow}>
      <span>지연 p50: {latencyP50.toFixed(1)}ms</span>
    </div>
  );

  return (
    <SplitView
      leftRatio={leftRatio}
      onRatioChange={setLeftRatio}
      left={
        <ViewportPane
          videoRef={videoRef}
          hands={hands}
          loadingLabel={loadingLabel}
          errorLabel={errorLabel}
        />
      }
      right={
        showSettings ? (
          <SettingsPanel
            overrides={currentOverrides}
            onChange={setCurrentOverrides}
            onReset={() => setCurrentOverrides(defaultOverrides)}
            onClose={() => setShowSettings(false)}
            previewText={override}
            previewStageIndex={stageIndex}
            previewTotalStages={totalStages}
            onPlay={(key) => {
              playKey(key);
              setShowSettings(false);
            }}
            onClearOutput={() => {
              clearOverride();
              setShowSettings(false);
            }}
          />
        ) : (
          <OutputPane
            text={displayText}
            footer={footer}
            onOpenSettings={() => setShowSettings(true)}
          />
        )
      }
    />
  );
}
