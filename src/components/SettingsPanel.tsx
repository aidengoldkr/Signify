import type { OverrideSequence } from '@/data/overrides';
import styles from './SettingsPanel.module.css';

interface Stage {
  delayMs: number;
  text: string;
}

interface SettingsPanelProps {
  overrides: Record<string, OverrideSequence>;
  onChange: (next: Record<string, OverrideSequence>) => void;
  onReset: () => void;
  onClose: () => void;
  previewText: string | null;
  previewStageIndex: number;
  previewTotalStages: number;
  onPlay: (key: string) => void;
  onClearOutput: () => void;
  currentMode: 'sign' | 'stt';
  onModeChange: (mode: 'sign' | 'stt') => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

function sequenceToStages(seq: OverrideSequence): Stage[] {
  const out: Stage[] = [];
  let pending = 0;
  for (const item of seq) {
    if (typeof item === 'number') {
      pending += item;
    } else if (typeof item === 'string') {
      out.push({ delayMs: pending, text: item });
      pending = 0;
    }
  }
  return out;
}

function stagesToSequence(stages: Stage[]): OverrideSequence {
  const out: OverrideSequence = [];
  for (const s of stages) {
    if (s.delayMs > 0) out.push(s.delayMs);
    out.push(s.text);
  }
  return out;
}

export function SettingsPanel({
  overrides,
  onChange,
  onReset,
  onClose,
  previewText,
  previewStageIndex,
  previewTotalStages,
  onPlay,
  onClearOutput,
  currentMode,
  onModeChange,
}: SettingsPanelProps) {
  function updateKey(key: string, stages: Stage[]) {
    onChange({ ...overrides, [key]: stagesToSequence(stages) });
  }

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>설정 — 대사</h2>
        <button className={styles.close} onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </header>

      <div className={styles.preview}>
        <span className={styles.previewLabel}>미리보기</span>
        <span className={styles.previewText}>
          {previewText && previewText.length > 0 ? previewText : '—'}
        </span>
        {previewTotalStages > 1 && (
          <span className={styles.previewStage}>
            {previewStageIndex + 1}/{previewTotalStages}
          </span>
        )}
      </div>

      <div className={styles.modeSection}>
        <span className={styles.sectionLabel}>INPUT MODE</span>
        <div className={styles.modeButtons}>
          <button
            className={`${styles.modeBtn} ${currentMode === 'sign' ? styles.active : ''}`}
            onClick={() => onModeChange('sign')}
          >
            수어 인식
          </button>
          <button
            className={`${styles.modeBtn} ${currentMode === 'stt' ? styles.active : ''}`}
            onClick={() => onModeChange('stt')}
          >
            음성 인식 (STT)
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {KEYS.map((k) => (
          <KeyEditor
            key={k}
            keyLabel={k}
            stages={sequenceToStages(overrides[k] ?? [])}
            onChange={(s) => updateKey(k, s)}
            onPlay={() => onPlay(k)}
          />
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.clearOutputBtn} onClick={onClearOutput}>
            출력 초기화
          </button>
          <button className={styles.reset} onClick={onReset}>
            기본값으로 초기화
          </button>
        </div>
      </footer>
    </div>
  );
}

interface KeyEditorProps {
  keyLabel: string;
  stages: Stage[];
  onChange: (stages: Stage[]) => void;
  onPlay: () => void;
}

function KeyEditor({ keyLabel, stages, onChange, onPlay }: KeyEditorProps) {
  function updateStage(idx: number, patch: Partial<Stage>) {
    onChange(stages.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function removeStage(idx: number) {
    onChange(stages.filter((_, i) => i !== idx));
  }
  function addStage() {
    const lastDelay = stages.length === 0 ? 0 : 1000;
    onChange([...stages, { delayMs: lastDelay, text: '' }]);
  }

  return (
    <section className={styles.keyBlock}>
      <header className={styles.keyHeader}>
        <div className={styles.keyHeaderLeft}>
          <span className={styles.keyBadge}>{keyLabel}</span>
          <button
            className={styles.playButton}
            onClick={onPlay}
            title="이 시퀀스 재생"
            aria-label="이 시퀀스 재생"
          >
            ▶ 플레이
          </button>
        </div>
        <span className={styles.keyMeta}>
          {stages.length === 0 ? '비어 있음' : `${stages.length}단계`}
        </span>
      </header>
      <ul className={styles.stages}>
        {stages.map((s, i) => (
          <li key={i} className={styles.stage}>
            <div className={styles.delayWrap}>
              <input
                className={styles.delay}
                type="number"
                min={0}
                step={0.1}
                value={s.delayMs / 1000}
                onChange={(e) =>
                  updateStage(i, {
                    delayMs: Math.max(
                      0,
                      Math.round((parseFloat(e.target.value) || 0) * 1000),
                    ),
                  })
                }
              />
              <span className={styles.unit}>초</span>
            </div>
            <input
              className={styles.text}
              type="text"
              value={s.text}
              onChange={(e) => updateStage(i, { text: e.target.value })}
              placeholder="(빈 텍스트 = placeholder)"
            />
            <button
              className={styles.remove}
              onClick={() => removeStage(i)}
              aria-label="단계 삭제"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button className={styles.addStage} onClick={addStage}>
        + 단계 추가
      </button>
    </section>
  );
}
