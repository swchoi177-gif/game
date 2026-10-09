import { JudgmentMode, JudgmentResult, Tile } from '../types/game';

export const TILE_SPACING = 85; // pixels between tile centers (slightly shortened tile width)

type StepDir = 'R' | 'U' | 'D' | 'L';

const DIR_INFO: Record<StepDir, { angle: number; dx: number; dy: number }> = {
  R: { angle: 0, dx: TILE_SPACING, dy: 0 },
  D: { angle: Math.PI * 0.5, dx: 0, dy: TILE_SPACING },
  L: { angle: Math.PI, dx: -TILE_SPACING, dy: 0 },
  U: { angle: Math.PI * 1.5, dx: 0, dy: -TILE_SPACING },
};

/**
 * Generate tiles for Stage 1, Stage 2, or Stage 3
 */
export function generateStageTiles(
  stageId: string,
  bpm: number = 100,
  startTime: number = 0
): Tile[] {
  const beatDuration = 60 / bpm;
  let directions: StepDir[] = [];

  if (stageId === 'stage-1-boss' || stageId === 'stage-boss') {
    // 1-Boss: World 1 Boss Stage (직선 + 90도 직각 코너 + 사각형 안쪽 루프 종합) - Easy & Fun!
    // 1번째 세계의 모든 기믹을 조화롭게 결합한 보스곡 (쉬운 난이도)
    directions = [
      // 1. 오프닝 직선 주행 (8스텝) - 1-1 기믹: 박자 적응 및 워밍업
      'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R',

      // 2. 90도 직각 코너링 구간 (1-2 기믹: 위로 꺾인 후 다시 내려와 수평 복귀)
      'U', 'U', 'U',                          // 3 Up
      'R', 'R', 'R', 'R', 'R',                // 5 Right (직선 호흡)
      'D', 'D', 'D',                          // 3 Down
      'R', 'R', 'R', 'R', 'R', 'R',           // 6 Right (직선 안정 구간)

      // 3. 사각형 안쪽 회전 루프 1차 (1-3 기믹: 4연속 90도 안쪽 회전)
      'U', 'L', 'D', 'R',

      // 4. 중간 연결 직선 구간 (사각형 간격 확보 및 충분한 호흡)
      'R', 'R', 'R', 'R', 'R', 'R', 'R',      // 7 Right

      // 5. 직각 코너 + 사각형 클라이맥스 콤보 (종합)
      'U', 'U',                               // 2 Up
      'R', 'R', 'R', 'R',                     // 4 Right
      'U', 'L', 'D', 'R',                     // 사각형 안쪽 회전 루프 2차
      'R', 'R',                               // 2 Right
      'D', 'D',                               // 2 Down (원래 기준선 복귀)

      // 6. 보스 격파 피날레 직선 질주 (1-1 기믹)
      'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', // 9 Right to Goal!
    ];
  } else if (stageId === 'stage-1-3' || stageId === 'stage-3') {
    // 1-3: 사각형 루프 (Square inside loops)
    directions = [
      'R', 'R', 'R', 'R', 'R', 'R', // 6 Right (진입)
      // 사각형 1 (4연속 90도 안쪽 회전: Up -> Left -> Down -> Right)
      'U', 'L', 'D', 'R',
      // 연결 직선 구간 (사각형 간격 띄움)
      'R', 'R', 'R', 'R', 'R', 'R', 'R', // 7 Right
      // 사각형 2 (4연속 90도 안쪽 회전)
      'U', 'L', 'D', 'R',
      // 연결 직선 구간 (사각형 간격 띄움)
      'R', 'R', 'R', 'R', 'R', 'R', 'R', // 7 Right
      // 사각형 3 (4연속 90도 안쪽 회전)
      'U', 'L', 'D', 'R',
      // 골인 직선 구간
      'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', // 9 Right to finish
    ];
  } else if (stageId === 'stage-1-2' || stageId === 'stage-2') {
    // 1-2: 90도 직각 코너 (41 steps -> 42 tiles)
    directions = [
      'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', // 8 Right
      'U', 'U', 'U', 'U',                     // 4 Up
      'R', 'R', 'R', 'R', 'R', 'R',           // 6 Right
      'D', 'D', 'D', 'D',                     // 4 Down
      'R', 'R', 'R', 'R', 'R', 'R',           // 6 Right
      'U', 'U', 'U', 'U',                     // 4 Up
      'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', // 9 Right to goal
    ];
  } else {
    // 1-1: 직선 코스 (35 steps -> 36 tiles)
    directions = Array(35).fill('R');
  }

  const tiles: Tile[] = [];

  // Start Tile (Index 0)
  tiles.push({
    id: 0,
    x: 0,
    y: 0,
    angleToNext: DIR_INFO[directions[0]].angle,
    incomingAngle: 0,
    sweptAngle: Math.PI,
    stepDuration: beatDuration,
    targetHitTime: startTime - beatDuration,
    isFirst: true,
    isLast: false,
    isCompleted: false,
  });

  let curX = 0;
  let curY = 0;
  let prevDirAngle = 0;
  let currentTargetTime = startTime;

  for (let i = 0; i < directions.length; i++) {
    const dir = directions[i];
    const info = DIR_INFO[dir];
    curX += info.dx;
    curY += info.dy;

    const nextDir = directions[i + 1] ? DIR_INFO[directions[i + 1]].angle : info.angle;

    // Angle swept around pivot tile (i) to reach tile (i+1)
    const thetaStart = (prevDirAngle + Math.PI) % (Math.PI * 2);
    const thetaTarget = info.angle % (Math.PI * 2);

    let diff = (thetaTarget - thetaStart) % (Math.PI * 2);
    if (diff <= 0.0001) diff += Math.PI * 2;

    const stepDuration = (diff / Math.PI) * beatDuration;

    if (i === 0) {
      currentTargetTime = startTime;
    } else {
      currentTargetTime += stepDuration;
    }

    const isTurn = Math.abs(diff - Math.PI) > 0.05;

    tiles.push({
      id: i + 1,
      x: curX,
      y: curY,
      angleToNext: nextDir,
      incomingAngle: info.angle,
      sweptAngle: diff,
      stepDuration,
      targetHitTime: currentTargetTime,
      isTurn,
      isFirst: false,
      isLast: i === directions.length - 1,
      isCompleted: false,
    });

    prevDirAngle = info.angle;
  }

  return tiles;
}

/**
 * Evaluate hit judgment based on millisecond offset and selected judgment mode
 */
export function evaluateJudgment(offsetMs: number, mode: JudgmentMode): JudgmentResult {
  const absOffset = Math.abs(offsetMs);
  const { windows } = mode;

  if (absOffset <= windows.purePerfect) {
    return {
      type: 'pure',
      label: '정확',
      color: '#4ade80',
      offsetMs,
      scoreWeight: 1.0,
    };
  }

  if (absOffset <= windows.perfect) {
    const isEarly = offsetMs < 0;
    return {
      type: isEarly ? 'perfect-early' : 'perfect-late',
      label: isEarly ? '빠름' : '느림',
      color: isEarly ? '#facc15' : '#fb923c',
      offsetMs,
      scoreWeight: 0.85,
    };
  }

  if (absOffset <= windows.good) {
    const isEarly = offsetMs < 0;
    return {
      type: isEarly ? 'early' : 'late',
      label: isEarly ? '너무 빠름' : '너무 느림',
      color: '#ef4444',
      offsetMs,
      scoreWeight: 0.6,
    };
  }

  return {
    type: 'miss',
    label: '놓침',
    color: '#ef4444',
    offsetMs,
    scoreWeight: 0,
  };
}

/**
 * Calculate Grade / Rank from accuracy percentage
 */
export function calculateRank(accuracy: number, missCount: number): 'S+' | 'S' | 'A' | 'B' | 'C' | 'F' {
  if (missCount === 0 && accuracy >= 99.5) return 'S+';
  if (missCount === 0 && accuracy >= 95.0) return 'S';
  if (accuracy >= 90.0) return 'A';
  if (accuracy >= 80.0) return 'B';
  if (accuracy >= 70.0) return 'C';
  return 'F';
}
