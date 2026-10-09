import React from 'react';
import { Stage, JudgmentMode, GameScore, HitRecord } from '../types/game';
import { RotateCcw, Home, Trophy, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ResultScreenProps {
  stage: Stage;
  judgmentMode: JudgmentMode;
  score: GameScore;
  hitRecords: HitRecord[];
  onRetry: () => void;
  onExit: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  stage,
  judgmentMode,
  score,
  hitRecords,
  onRetry,
  onExit,
}) => {
  const isCleared = score.isCleared;

  const getRankBadge = (rank: GameScore['rank']) => {
    switch (rank) {
      case 'S+':
        return {
          gradient: 'from-amber-300 via-yellow-400 to-amber-500',
          shadow: 'shadow-amber-500/40 ring-amber-400/50',
          label: 'PERFECT S+',
        };
      case 'S':
        return {
          gradient: 'from-cyan-300 via-blue-400 to-indigo-500',
          shadow: 'shadow-cyan-500/40 ring-cyan-400/50',
          label: 'EXCELLENT S',
        };
      case 'A':
        return {
          gradient: 'from-emerald-300 to-teal-500',
          shadow: 'shadow-emerald-500/40 ring-emerald-400/50',
          label: 'GREAT A',
        };
      case 'B':
        return {
          gradient: 'from-blue-400 to-slate-400',
          shadow: 'shadow-blue-500/30 ring-blue-400/40',
          label: 'GOOD B',
        };
      case 'C':
        return {
          gradient: 'from-slate-400 to-slate-600',
          shadow: 'shadow-slate-500/30 ring-slate-400/30',
          label: 'CLEAR C',
        };
      default:
        return {
          gradient: 'from-red-500 to-rose-700',
          shadow: 'shadow-red-500/40 ring-red-500/40',
          label: 'FAILED',
        };
    }
  };

  const rankStyle = getRankBadge(score.rank);

  // Calculate average timing error
  const totalOffset = hitRecords.reduce((sum, h) => sum + Math.abs(h.offsetMs), 0);
  const avgOffset = hitRecords.length > 0 ? (totalOffset / hitRecords.length).toFixed(1) : '0';

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-x-hidden p-4 sm:p-8">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative z-10 max-w-xl mx-auto w-full my-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Header Status */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 mb-2">
            {isCleared ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>스테이지 완주 성공!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span>게임 오버</span>
              </>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {stage.title}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {judgmentMode.name} 판정 (±{judgmentMode.windows.good}ms)
          </p>
        </div>

        {/* Big Rank Badge */}
        <div className="flex flex-col items-center justify-center my-6">
          <div
            className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${rankStyle.gradient} flex items-center justify-center shadow-2xl ring-4 ${rankStyle.shadow} transform hover:scale-105 transition duration-300`}
          >
            <span className="text-5xl font-black text-slate-950 tracking-tighter">
              {score.rank}
            </span>
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-slate-400 mt-2 uppercase">
            {rankStyle.label}
          </span>
        </div>

        {/* Primary Stats: Accuracy & Max Combo */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 mb-5">
          <div className="text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              최종 정확도
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
              {score.accuracy.toFixed(2)}%
            </span>
          </div>
          <div className="text-center border-l border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              최대 콤보
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
              {score.maxCombo}
            </span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/60 mb-6 space-y-2 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              완벽! (Pure Perfect)
            </span>
            <span className="font-mono text-white font-semibold">{score.pureCount}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              아주 좋음 (Perfect)
            </span>
            <span className="font-mono text-white font-semibold">{score.perfectCount}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-orange-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              조금 빠름/느림 (Early/Late)
            </span>
            <span className="font-mono text-white font-semibold">{score.earlyCount + score.lateCount}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-red-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              놓침 (Miss)
            </span>
            <span className="font-mono text-white font-semibold">{score.missCount}</span>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-mono">
            <span>평균 오차 (Avg Error)</span>
            <span>±{avgOffset}ms</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 transition cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시 도전 (Retry)</span>
          </button>

          <button
            onClick={onExit}
            className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
          >
            <Home className="w-4 h-4" />
            <span>스테이지 선택</span>
          </button>
        </div>
      </div>
    </div>
  );
};
