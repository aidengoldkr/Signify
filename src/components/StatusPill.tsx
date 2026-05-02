import styles from './StatusPill.module.css';

export type StatusKind = 'manual' | 'ai' | 'idle';

interface StatusPillProps {
  kind: StatusKind;
  label: string;
}

export function StatusPill({ kind, label }: StatusPillProps) {
  return <span className={`${styles.pill} ${styles[kind]}`}>{label}</span>;
}
