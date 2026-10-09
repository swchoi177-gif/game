export type JudgmentModeId = 'lenient' | 'normal' | 'strict' | 'extreme';

export interface JudgmentMode {
  id: JudgmentModeId;
  name: string;
  englishName: string;
  description: string;
  color: string;
  badgeClass: string;
  windows: {
    purePerfect: number; // in ms
    perfect: number;     // in ms
    good: number;        // in ms
    miss: number;        // anything beyond good is miss
  };
}

export type JudgmentType = 'pure' | 'perfect-early' | 'perfect-late' | 'early' | 'late' | 'miss';

export interface JudgmentResult {
  type: JudgmentType;
  label: string;
  color: string;
  offsetMs: number; // negative = early, positive = late
  scoreWeight: number; // 1.0, 0.75, 0.5, 0
}

export interface Tile {
  id: number;
  x: number;
  y: number;
  angleToNext: number; // direction in radians to next tile
  incomingAngle?: number;
  sweptAngle?: number;
  stepDuration?: number; // duration in seconds for rotating to this tile
  targetHitTime?: number; // precalculated AudioContext target hit time
  isTurn?: boolean;
  isCompleted?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export interface Stage {
  id: string;
  worldNumber: number;
  stageNumber?: string;
  title: string;
  subtitle: string;
  description: string;
  bpm: number;
  tileCount: number;
  difficulty: number; // 1-5
  unlocked: boolean;
  accentColor: string;
  isBoss?: boolean;
}

export interface WorldInfo {
  worldNumber: number;
  title: string;
  subtitle: string;
  description: string;
  unlocked: boolean;
  accentColor: string;
}

export interface GameScore {
  pureCount: number;
  perfectCount: number;
  earlyCount: number;
  lateCount: number;
  missCount: number;
  maxCombo: number;
  currentCombo: number;
  accuracy: number;
  totalHits: number;
  rank: 'S+' | 'S' | 'A' | 'B' | 'C' | 'F';
  isCleared: boolean;
}

export interface HitRecord {
  tileId: number;
  offsetMs: number;
  type: JudgmentType;
}

export type AppScreen = 'stage_select' | 'judgment_select' | 'playing' | 'results';
