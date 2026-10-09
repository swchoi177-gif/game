import React, { useState } from 'react';
import { Stage } from '../types/game';
import { STAGES, WORLDS } from '../data/stages';
import { Play, Settings, Flame, Snowflake, Music, Sparkles, ChevronRight, Lock, Crown, ShieldAlert, Compass } from 'lucide-react';

interface StageSelectProps {
  onSelectStage: (stage: Stage) => void;
  onOpenSettings: () => void;
}

export const StageSelect: React.FC<StageSelectProps> = ({
  onSelectStage,
  onOpenSettings,
}) => {
  const [selectedWorldNumber, setSelectedWorldNumber] = useState<number>(1);

  const currentWorld = WORLDS.find((w) => w.worldNumber === selectedWorldNumber) || WORLDS[0];
  const worldStages = STAGES.filter((stg) => stg.worldNumber === selectedWorldNumber);

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-x-hidden p-4 sm:p-8">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Snowflake className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-red-400 via-white to-cyan-400 bg-clip-text text-transparent">
              얼불춤 <span className="text-xs sm:text-sm font-normal text-slate-400 font-mono">A Dance of Fire and Ice</span>
            </h1>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition text-sm cursor-pointer shadow-sm"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">오디오 설정</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto w-full py-6 flex flex-col items-center">
        {/* World Tabs Navigation (1, 2, 3, 4 World Architecture) */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {WORLDS.map((world) => {
              const isSelected = world.worldNumber === selectedWorldNumber;
              return (
                <button
                  key={world.worldNumber}
                  onClick={() => setSelectedWorldNumber(world.worldNumber)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 border'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {world.unlocked ? (
                    <Compass className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>World {world.worldNumber}</span>
                  {!world.unlocked && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                      잠김
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* World Title & Intro Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-cyan-300">{currentWorld.title}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{currentWorld.subtitle}</span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
            {currentWorld.description}
          </p>
        </div>

        {/* World 1 Content: Stages 1-1, 1-2, 1-3, 1-Boss */}
        {selectedWorldNumber === 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
            {worldStages.map((stg) => {
              const isBoss = stg.isBoss;

              return (
                <div
                  key={stg.id}
                  className={`relative group rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden p-5 ${
                    isBoss
                      ? 'bg-gradient-to-b from-red-950/40 via-slate-900/90 to-slate-950 border-red-500/40 hover:border-red-400 shadow-xl shadow-red-950/20 hover:shadow-red-500/20'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-cyan-500/50 shadow-xl hover:shadow-cyan-500/10'
                  }`}
                >
                  {/* Top Accent bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                      isBoss ? 'bg-gradient-to-r from-red-500 via-amber-500 to-rose-500' : ''
                    }`}
                    style={!isBoss ? { backgroundColor: stg.accentColor } : {}}
                  />

                  <div>
                    {/* Header: Stage Number badge & Boss Tag */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-wider border ${
                          isBoss
                            ? 'bg-red-500/20 text-red-300 border-red-500/40 flex items-center gap-1'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isBoss && <Crown className="w-3 h-3 text-amber-400" />}
                        {stg.stageNumber || stg.title.split(':')[0]}
                      </span>

                      {isBoss ? (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          🔥 BOSS STAGE
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          플레이 가능
                        </span>
                      )}
                    </div>

                    {/* Stage Title */}
                    <h3
                      className={`text-lg font-bold mb-1 transition ${
                        isBoss
                          ? 'text-white group-hover:text-red-300'
                          : 'text-white group-hover:text-cyan-300'
                      }`}
                    >
                      {stg.title}
                    </h3>
                    <p className={`text-xs font-mono mb-2.5 ${isBoss ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {stg.subtitle}
                    </p>

                    <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                      {stg.description}
                    </p>
                  </div>

                  {/* Stage Meta & Enter button */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 py-2.5 border-t border-slate-800/80 mb-3.5">
                      <div className="flex items-center gap-1 font-mono">
                        <Music className="w-3.5 h-3.5 text-slate-500" />
                        <span>{stg.bpm} BPM</span>
                      </div>
                      <div className="font-mono text-slate-400">
                        <span>{stg.tileCount} 타일</span>
                      </div>
                      <div>
                        <span className="text-amber-400">
                          {'★'.repeat(stg.difficulty)}
                          <span className="text-slate-600">{'★'.repeat(3 - stg.difficulty)}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectStage(stg)}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all transform active:scale-98 cursor-pointer shadow-md ${
                        isBoss
                          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-950/40 group-hover:ring-2 group-hover:ring-red-400/50'
                          : 'bg-gradient-to-r from-red-600 via-amber-600 to-cyan-600 hover:from-red-500 hover:to-cyan-500 text-white shadow-cyan-950/40 group-hover:ring-2 group-hover:ring-cyan-400/50'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{isBoss ? '보스곡 도전' : '스테이지 입장'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Locked World Preview for World 2, 3, 4 */
          <div className="w-full max-w-xl mx-auto rounded-2xl bg-slate-900/60 border border-slate-800/80 p-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
              <Lock className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{currentWorld.title}</h3>
            <p className="text-xs font-mono text-cyan-400 mb-3">{currentWorld.subtitle}</p>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              {currentWorld.description}
            </p>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-amber-300 font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>현재는 세계 1(World 1)만 플레이 가능합니다.</span>
            </div>
            <button
              onClick={() => setSelectedWorldNumber(1)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-cyan-600 hover:from-red-500 hover:to-cyan-500 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/20"
            >
              <span>세계 1로 이동하기</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Game instructions footer note */}
        <div className="mt-8 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-center max-w-xl text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300 border border-slate-700">Space</span>
            <span>또는 아무 키 / 마우스 클릭으로 회전 박자에 맞춰 타일을 밟습니다.</span>
          </div>
          <span className="text-slate-500">180° = 1 박자</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-3 border-t border-slate-900 text-xs text-slate-500">
        얼불춤 웹 버전 • Web Audio 정밀 클럭 동기화 시스템
      </footer>
    </div>
  );
};
