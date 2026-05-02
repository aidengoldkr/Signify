import type { ReactNode } from 'react';
import styles from './OutputPane.module.css';

interface OutputPaneProps {
  text: string;
  status: ReactNode;
  footer?: ReactNode;
  onOpenSettings?: () => void;
}

export function OutputPane({ text, status, footer, onOpenSettings }: OutputPaneProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.statusRow}>
        {onOpenSettings && (
          <button
            className={styles.gear}
            onClick={onOpenSettings}
            aria-label="설정"
            title="설정"
          >
            ⚙
          </button>
        )}
        <div className={styles.spacer} />
        {status}
      </div>
      <div className={styles.textWrap}>
        {text ? (
          <p key={text} className={styles.text}>{text}</p>
        ) : (
          <p className={styles.placeholder}>…</p>
        )}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
