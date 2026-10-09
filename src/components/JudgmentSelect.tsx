import React, { useState } from 'react';
import { Stage, JudgmentMode, JudgmentModeId } from '../types/game';
import { JUDGMENT_LIST, JUDGMENT_MODES } from '../data/judgmentModes';
import { Play, ArrowLeft, CheckCircle2, ShieldCheck, Flame, Zap, Target } from 'lucide-react';

interface JudgmentSelectProps {
  stage: Stage;
  onConfirm: (mode: JudgmentMode) => void;
  onBack: () => void;
}

export const JudgmentSelect: React.FC<JudgmentSelectProps> = ({
  stage,
  onConfirm,
  onBack,
}) => {
  const [selectedId, setSelectedId] = useState<JudgmentModeId>('normal');

  const selectedMode = JUDGMENT_MODES[selectedId];

  const getModeIcon = (id: JudgmentModeId) => {
    switch (id) {
      case 'lenient':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'normal':
        return <Target className="w-5 h-5 text-blue-400" />;
      case 'strict':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'extreme':
        return <Flame className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-x-hidden p-4 sm:p-8">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4 max-w-4xl mx-auto w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>스테이지 선택으로 돌아가기</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{stage.title}</span>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 max-w-4xl mx-auto w-full py-8 flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-semibold mb-2">
            STEP 2 • 판정 난이도 선택
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            판정 기준을 선택하세요
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-lg mx-auto">
            원하는 타이밍 판정 난이도를 선택하세요. 원작 얼불춤 플레이어는 <strong className="text-blue-300 font-semibold">보통 (Normal)</strong>을 권장합니다.
          </p>
        </div>

        {/* Judgment Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
          {JUDGMENT_LIST.map((mode) => {
            const isSelected = mode.id === selectedId;

            return (
              <div
                key={mode.id}
                onClick={() => setSelectedId(mode.id)}
                className={`relative rounded-2xl border p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-2 ring-cyan-400/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        {getModeIcon(mode.id)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {mode.name}
                          <span className="text-xs font-mono text-slate-400">
                            ({mode.englishName})
                          </span>
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 fill-cyan-400 text-slate-950" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-700" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    {mode.description}
                  </p>
                </div>

                {/* Timing Window Indicators */}
                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span>완벽 (Pure Perfect)</span>
                    <span className="font-mono text-amber-400 font-semibold">±{mode.windows.purePerfect}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span>아주 좋음 (Perfect)</span>
                    <span className="font-mono text-cyan-400">±{mode.windows.perfect}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>허용 범위 (Good)</span>
                    <span className="font-mono text-slate-300">±{mode.windows.good}ms</span>
                  </div>

                  {/* Visual tolerance bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden flex">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (mode.windows.good / 260) * 100)}%`,
                        backgroundColor: mode.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Summary & Start Action */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                선택된 판정
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${selectedMode.badgeClass}`}>
                {selectedMode.name} (±{selectedMode.windows.good}ms)
              </span>
            </div>
            <p className="text-sm text-slate-300">
              {stage.title} • {stage.bpm} BPM • {stage.tileCount}개 타일 코스
            </p>
          </div>

          <button
            onClick={() => onConfirm(selectedMode)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-cyan-500 hover:from-red-500 hover:to-cyan-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all transform active:scale-98 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>게임 시작</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 border-t border-slate-900 text-xs text-slate-500">
        준비가 완료되면 시작을 눌러 타일을 밟으세요!
      </footer>
    </div>
  );
};
