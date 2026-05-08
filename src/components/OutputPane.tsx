import { useEffect, useRef, type ReactNode } from 'react';
import styles from './OutputPane.module.css';

interface OutputPaneProps {
  text: string;
  footer?: ReactNode;
  onOpenSettings?: () => void;
}

export function OutputPane({ text, footer, onOpenSettings }: OutputPaneProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className={styles.wrap}>
      <div className={styles.statusRow}>
        <div className={styles.spacer} />
      </div>
      <div className={styles.textWrap} ref={scrollRef}>
        {text ? (
          <p className={styles.text}>{text}</p>
        ) : (
          <p className={styles.placeholder}>…</p>
        )}
      </div>
      <div className={styles.footerWrap}>
        {footer && <div className={styles.footer}>{footer}</div>}
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
      </div>
    </div>
  );
}
