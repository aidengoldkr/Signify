export type Handedness = 'Left' | 'Right';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandFrame {
  handedness: Handedness;
  landmarks: Landmark[];
}

export interface GestureSnapshot {
  label: string;
  hands: HandFrame[];
}

export type MatchResult =
  | { kind: 'match'; label: string; score: number }
  | { kind: 'idle' };
