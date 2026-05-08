import styles from './STTPane.module.css';

interface STTPaneProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  statusLabel?: string | null;
}

export function STTPane({
  isRecording,
  onToggleRecording,
  statusLabel,
}: STTPaneProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.background}>
        <div className={styles.grid} />
      </div>

      <div className={styles.header}>
        <div className={styles.indicatorWrap}>
          <div className={`${styles.dot} ${isRecording ? styles.active : ''}`} />
          <span className={styles.statusText}>
            {isRecording ? 'RECORDING' : 'IDLE'}
          </span>
        </div>
        <div className={styles.metadata}>
          <span>AI_MODEL_V2.4</span>
          <span>SAMPLING_44.1KHZ</span>
        </div>
      </div>

      <div className={styles.center}>
        <button
          className={`${styles.micButton} ${isRecording ? styles.recording : ''}`}
          onClick={onToggleRecording}
          aria-label={isRecording ? '중지' : '시작'}
        >
          <div className={styles.pulse} />
          <div className={styles.inner}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </div>
        </button>
        
        <div className={styles.waveform}>
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className={styles.bar} 
              style={{ 
                height: isRecording ? `${Math.random() * 100}%` : '4px',
                transitionDelay: `${i * 0.02}s`
              }} 
            />
          ))}
        </div>
      </div>

      {statusLabel && (
        <div className={styles.statusBadge}>
          {statusLabel}
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.footerLine} />
        <div className={styles.systemCode}>0x7F4E92A_STT</div>
      </div>
    </div>
  );
}
