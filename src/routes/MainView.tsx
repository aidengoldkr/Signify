import { useEffect, useMemo, useRef, useState } from 'react';
import type { HandFrame } from '@/types/gesture';
import { SplitView } from '@/components/SplitView';
import { ViewportPane } from '@/components/ViewportPane';
import { STTPane } from '@/components/STTPane';
import { OutputPane } from '@/components/OutputPane';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useCamera } from '@/hooks/useCamera';
import { useMediaPipe } from '@/hooks/useMediaPipe';
import { useGestureMatcher } from '@/hooks/useGestureMatcher';
import { useKeyboardOverride } from '@/hooks/useKeyboardOverride';
import { useSTT } from '@/hooks/useSTT';
import { prepareLibrary } from '@/lib/matcher';
import { snapshots } from '@/data/snapshots';
import { overrides as defaultOverrides, type OverrideSequence } from '@/data/overrides';
import styles from './MainView.module.css';

const STORAGE_KEY = 'signify.overrides.v1';
const LAYOUT_KEY = 'signify.layout.v1';
const MODE_KEY = 'signify.mode.v1';

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

function loadMode(): 'sign' | 'stt' {
  const raw = localStorage.getItem(MODE_KEY);
  return raw === 'stt' ? 'stt' : 'sign';
}

export function MainView() {
  const [appMode, setAppMode] = useState<'sign' | 'stt'>(() => loadMode());
  const { videoRef, ready: cameraReady, error: cameraError, toggleCamera } = useCamera();
  const { isRecording, transcript, status: sttStatus, toggleRecording, setTranscript } = useSTT();
  
  const [hands, setHands] = useState<HandFrame[]>([]);
  const latencyBufRef = useRef<number[]>([]);
  const [latencyP50, setLatencyP50] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [currentOverrides, setCurrentOverrides] = useState<Record<string, OverrideSequence>>(
    () => loadOverrides(),
  );
  const [leftRatio, setLeftRatio] = useState<number>(() => loadLeftRatio());

  useEffect(() => {
    localStorage.setItem(MODE_KEY, appMode);
  }, [appMode]);

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
    enabled: cameraReady && appMode === 'sign',
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

  const displayText = appMode === 'stt' 
    ? transcript 
    : (override ?? (result.kind === 'match' ? result.label : ''));

  const loadingLabel = appMode === 'sign' 
    ? (!cameraReady && !cameraError
      ? '카메라 준비 중...'
      : cameraReady && mpStatus === 'loading'
        ? '핸드 트래커 로딩 중...'
        : null)
    : null;

  const errorLabel = appMode === 'sign' ? (cameraError ?? mpError) : null;

  const footer = (
    <div className={styles.footerRow}>
      <span>MODE: {appMode === 'sign' ? 'SIGN_LANGUAGE' : 'STT_VOICE'}</span>
      {appMode === 'sign' && <span>지연 p50: {latencyP50.toFixed(1)}ms</span>}
    </div>
  );

  return (
    <SplitView
      leftRatio={leftRatio}
      onRatioChange={setLeftRatio}
      left={
        appMode === 'sign' ? (
          <ViewportPane
            videoRef={videoRef}
            hands={hands}
            loadingLabel={loadingLabel}
            errorLabel={errorLabel}
            onToggleCamera={toggleCamera}
            facingMode={facingMode}
          />
        ) : (
          <STTPane
            isRecording={isRecording}
            onToggleRecording={toggleRecording}
            statusLabel={sttStatus}
          />
        )
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
            currentMode={appMode}
            onModeChange={(m) => {
              setAppMode(m);
              if (m === 'stt') setTranscript('');
            }}
            onPlay={(key) => {
              playKey(key);
              setShowSettings(false);
            }}
            onClearOutput={() => {
              if (appMode === 'stt') setTranscript('');
              else clearOverride();
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
