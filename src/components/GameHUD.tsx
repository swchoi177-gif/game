import React from 'react';
import { Stage, JudgmentMode } from '../types/game';
import { RotateCcw, Pause, Play, Home, Volume2 } from 'lucide-react';

interface GameHUDProps {
  stage: Stage;
  judgmentMode: JudgmentMode;
  combo: number;
  accuracy: number;
  progress: number;
  health: number;
  recentHitOffsets: number[];
  countdownText: string | null;
  isPaused: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stage,
  judgmentMode,
  combo,
  accuracy,
  progress,
  health,
  recentHitOffsets,
  countdownText,
  isPaused,
  onTogglePause,
  onRestart,
  onExit,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 z-20">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Stage info & judgment badge */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900/90 text-cyan-300 border border-slate-700 backdrop-blur">
            {stage.title}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border backdrop-blur ${judgmentMode.badgeClass}`}>
            {judgmentMode.name}
          </span>
        </div>

        {/* Center: Progress & Accuracy */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-900/80 backdrop-blur px-4 py-2 rounded-2xl border border-slate-800 text-center shadow-lg">
            <div className="text-xs text-slate-400 font-mono tracking-wider uppercase mb-1">
              정확도 (Accuracy)
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {accuracy.toFixed(1)}%
            </div>

            {/* Progress bar */}
            <div className="w-32 sm:w-44 bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-amber-400 h-full rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              진행도 {progress}%
            </div>
          </div>
        </div>

        {/* Right: Controls buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onRestart}
            title="다시 시작 (R 키)"
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white backdrop-blur transition cursor-pointer shadow-md active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePause}
            title="일시 정지"
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white backdrop-blur transition cursor-pointer shadow-md active:scale-95"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Screen: Countdown Display */}
      {countdownText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-bounce">
            <div className="text-7xl sm:text-9xl font-black italic tracking-tighter bg-gradient-to-b from-white via-cyan-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(56,189,248,0.5)]">
              {countdownText}
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-300 mt-2 tracking-wide uppercase">
              음악의 박자에 맞춰 타일을 밟으세요!
            </p>
          </div>
        </div>
      )}

      {/* Center Screen: Combo Counter */}
      {combo >= 2 && !countdownText && (
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-transform duration-75">
          <span className="text-3xl sm:text-5xl font-black italic font-mono text-cyan-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]">
            {combo}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            COMBO
          </span>
        </div>
      )}

      {/* Bottom Area: Hit Timing Error Line & Hint */}
      <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
        {/* Hit error distribution bar */}
        <div className="w-full bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-2.5 shadow-lg">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5">
            <span className="text-cyan-400">빠름 (Early)</span>
            <span className="text-amber-400 font-bold">PERFECT (0ms)</span>
            <span className="text-orange-400">느림 (Late)</span>
          </div>

          {/* Bar track */}
          <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Center target tick */}
            <div className="absolute w-0.5 h-full bg-amber-400 z-10" />

            {/* Pure Perfect Zone */}
            <div
              className="absolute h-full bg-amber-400/20 border-x border-amber-400/30"
              style={{
                width: `${Math.min(100, (judgmentMode.windows.purePerfect / 200) * 100)}%`,
              }}
            />

            {/* Recent hit indicators */}
            {recentHitOffsets.slice(-15).map((offset, idx) => {
              // Map offset (-200ms to +200ms) to 0% to 100%
              const clamped = Math.max(-200, Math.min(200, offset));
              const percent = 50 + (clamped / 200) * 50;
              const abs = Math.abs(offset);

              let dotColor = '#fbbf24'; // pure
              if (abs > judgmentMode.windows.purePerfect) dotColor = '#38bdf8';
              if (abs > judgmentMode.windows.perfect) dotColor = '#f97316';
              if (abs > judgmentMode.windows.good) dotColor = '#ef4444';

              return (
                <div
                  key={idx}
                  className="absolute w-1.5 h-2.5 rounded-full transform -translate-x-1/2 transition-opacity duration-300"
                  style={{
                    left: `${percent}%`,
                    backgroundColor: dotColor,
                    opacity: 0.3 + (idx / 15) * 0.7,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Input prompt hint */}
        <div className="bg-slate-900/70 backdrop-blur px-4 py-1.5 rounded-full border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2 shadow">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-cyan-300 text-[10px] border border-slate-700">Space</span>
          <span>또는 아무 키나 마우스 클릭으로 회전 박자를 밟으세요!</span>
        </div>
      </div>

      {/* Pause Menu Modal Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center pointer-events-auto z-30">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-2">일시 정지</h3>
            <p className="text-xs text-slate-400 mb-6 font-mono">
              {stage.title} • {judgmentMode.name} 판정
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onTogglePause}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>계속하기 (Resume)</span>
              </button>

              <button
                onClick={onRestart}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>처음부터 다시하기 (Restart)</span>
              </button>

              <button
                onClick={onExit}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition border border-slate-800"
              >
                <Home className="w-4 h-4" />
                <span>스테이지 선택으로 나가기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
