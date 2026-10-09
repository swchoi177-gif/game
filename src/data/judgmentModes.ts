import { JudgmentMode, JudgmentModeId } from '../types/game';

export const JUDGMENT_MODES: Record<JudgmentModeId, JudgmentMode> = {
  lenient: {
    id: 'lenient',
    name: '관대함',
    englishName: 'Lenient',
    description: '박자 감각을 편안하게 즐길 수 있는 가장 넉넉하고 너그러운 판정입니다.',
    color: '#34d399',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    windows: {
      purePerfect: 115,
      perfect: 210,
      good: 310,
      miss: 370,
    },
  },
  normal: {
    id: 'normal',
    name: '보통',
    englishName: 'Normal',
    description: '손맛과 여유를 모두 챙긴 널널하고 쾌적한 표준 판정입니다. (추천)',
    color: '#60a5fa',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    windows: {
      purePerfect: 85,
      perfect: 165,
      good: 240,
      miss: 290,
    },
  },
  strict: {
    id: 'strict',
    name: '엄격함',
    englishName: 'Strict',
    description: '정밀하고 흔들림 없는 정확성을 요구하는 숙련자용 판정입니다.',
    color: '#f59e0b',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    windows: {
      purePerfect: 50,
      perfect: 100,
      good: 160,
      miss: 200,
    },
  },
  extreme: {
    id: 'extreme',
    name: '극한',
    englishName: 'Extreme',
    description: '한계에 도전하는 고난도 마스터 판정입니다.',
    color: '#ef4444',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
    windows: {
      purePerfect: 32,
      perfect: 65,
      good: 110,
      miss: 140,
    },
  },
};

export const JUDGMENT_LIST: JudgmentMode[] = [
  JUDGMENT_MODES.lenient,
  JUDGMENT_MODES.normal,
  JUDGMENT_MODES.strict,
  JUDGMENT_MODES.extreme,
];
