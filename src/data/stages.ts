import { Stage, WorldInfo } from '../types/game';

export const WORLDS: WorldInfo[] = [
  {
    worldNumber: 1,
    title: '세계 1: 불과 얼음의 서곡',
    subtitle: 'World 1: Overture of Fire & Ice',
    description: '기초 직선 주행부터 90도 직각 코너, 사각형 루프 및 대망의 보스곡까지의 첫 번째 여정',
    unlocked: true,
    accentColor: '#38bdf8',
  },
  {
    worldNumber: 2,
    title: '세계 2: 미지의 궤도',
    subtitle: 'World 2: Unknown Orbit',
    description: '180도 회전 방향 전환과 반원형 특수 궤도 (차후 업데이트 예정)',
    unlocked: false,
    accentColor: '#a855f7',
  },
  {
    worldNumber: 3,
    title: '세계 3: 차원 도약',
    subtitle: 'World 3: Dimensional Shift',
    description: '다각도 변칙 타일과 신비로운 폴리리듬 (차후 업데이트 예정)',
    unlocked: false,
    accentColor: '#f59e0b',
  },
  {
    worldNumber: 4,
    title: '세계 4: 성운의 심연',
    subtitle: 'World 4: Nebula Core',
    description: '빛의 속도를 넘나드는 극한의 하이퍼 스피드런 (차후 업데이트 예정)',
    unlocked: false,
    accentColor: '#ef4444',
  },
];

export const STAGES: Stage[] = [
  {
    id: 'stage-1-1',
    worldNumber: 1,
    stageNumber: '1-1',
    title: '1-1: 첫 번째 발걸음',
    subtitle: 'First Step (직선 코스)',
    description: '불과 얼음의 두 행성이 180도 회전하며 일직선으로 나아갑니다. 4/4 박자의 기본 리듬을 익혀보세요.',
    bpm: 100,
    tileCount: 36,
    difficulty: 1,
    unlocked: true,
    accentColor: '#38bdf8', // Sky/ice
  },
  {
    id: 'stage-1-2',
    worldNumber: 1,
    stageNumber: '1-2',
    title: '1-2: 회전의 시작',
    subtitle: 'Cornering (90도 직각 코너)',
    description: '직각으로 꺾이는 코너 타일이 등장하여 90도 회전의 변주와 궤도 감각을 체득합니다.',
    bpm: 105,
    tileCount: 42,
    difficulty: 1,
    unlocked: true,
    accentColor: '#f59e0b', // Amber/orange
  },
  {
    id: 'stage-1-3',
    worldNumber: 1,
    stageNumber: '1-3',
    title: '1-3: 사각형 루프',
    subtitle: 'Square Loop (사각형 안쪽 회전)',
    description: '사각형의 안쪽을 따라 4연속 90도 회전하며 빠른 반 박자(0.5 Beat) 리듬을 정복하는 코스입니다.',
    bpm: 100,
    tileCount: 42,
    difficulty: 2,
    unlocked: true,
    accentColor: '#ec4899', // Pink/crimson
  },
  {
    id: 'stage-1-boss',
    worldNumber: 1,
    stageNumber: '1-Boss',
    title: '1-Boss: 신세계의 서곡 (보스곡)',
    subtitle: 'World 1 Boss (직선 · 코너 · 사각형 종합)',
    description: '1번째 세계의 모든 요소(직선 주행, 90도 코너링, 사각형 안쪽 루프)를 집대성한 최종 보스곡! 난이도는 쉬우며 경쾌하고 웅장한 비트를 즐길 수 있습니다.',
    bpm: 98,
    tileCount: 60,
    difficulty: 2,
    unlocked: true,
    accentColor: '#ef4444', // Red/crimson
    isBoss: true,
  },
];
