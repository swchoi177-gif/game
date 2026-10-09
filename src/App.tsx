import React, { useState, useCallback } from 'react';
import { AppScreen, Stage, JudgmentMode, GameScore, HitRecord, JudgmentResult } from './types/game';
import { STAGES } from './data/stages';
import { JUDGMENT_MODES } from './data/judgmentModes';
import { StageSelect } from './components/StageSelect';
import { JudgmentSelect } from './components/JudgmentSelect';
import { GameCanvas } from './game/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { ResultScreen } from './components/ResultScreen';
import { SettingsModal } from './components/SettingsModal';
import { soundEngine } from './audio/soundEngine';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('stage_select');
  const [selectedStage, setSelectedStage] = useState<Stage>(STAGES[0]);
  const [selectedJudgmentMode, setSelectedJudgmentMode] = useState<JudgmentMode>(JUDGMENT_MODES.normal);
  const [lastScore, setLastScore] = useState<GameScore | null>(null);
  const [lastHits, setLastHits] = useState<HitRecord[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameKey, setGameKey] = useState(0); // For forcing canvas remount on restart

  // Real-time HUD stats updated from GameCanvas
  const [hudState, setHudState] = useState<{
    combo: number;
    accuracy: number;
    progress: number;
    health: number;
    recentHitOffsets: number[];
    countdownText: string | null;
  }>({
    combo: 0,
    accuracy: 100,
    progress: 0,
    health: 100,
    recentHitOffsets: [],
    countdownText: null,
  });

  // Step 1: User chooses stage -> Transition to Judgment Select
  const handleSelectStage = (stage: Stage) => {
    setSelectedStage(stage);
    setScreen('judgment_select');
  };

  // Step 2: User chooses judgment -> Transition to Gameplay
  const handleConfirmJudgment = (mode: JudgmentMode) => {
    setSelectedJudgmentMode(mode);
    setIsPaused(false);
    setGameKey((prev) => prev + 1);
    setScreen('playing');
  };

  // Gameplay Events
  const handleGameClear = useCallback((score: GameScore, hits: HitRecord[]) => {
    setLastScore(score);
    setLastHits(hits);
    setScreen('results');
  }, []);

  const handleGameOver = useCallback((score: GameScore, hits: HitRecord[]) => {
    setLastScore(score);
    setLastHits(hits);
    setScreen('results');
  }, []);

  const handleRestartGame = () => {
    setIsPaused(false);
    setGameKey((prev) => prev + 1);
    setScreen('playing');
  };

  const handleReturnToStageSelect = () => {
    soundEngine.stopMusic();
    setIsPaused(false);
    setScreen('stage_select');
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Stage Selection Screen */}
      {screen === 'stage_select' && (
        <StageSelect
          onSelectStage={handleSelectStage}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* 2. Judgment Selection Screen */}
      {screen === 'judgment_select' && (
        <JudgmentSelect
          stage={selectedStage}
          onConfirm={handleConfirmJudgment}
          onBack={() => setScreen('stage_select')}
        />
      )}

      {/* 3. Playing Screen */}
      {screen === 'playing' && (
        <div className="relative w-full h-full">
          <GameCanvas
            key={gameKey}
            stage={selectedStage}
            judgmentMode={selectedJudgmentMode}
            onClear={handleGameClear}
            onGameOver={handleGameOver}
            onUpdateHUD={setHudState}
            isPaused={isPaused}
            onPauseToggle={handleTogglePause}
          />

          <GameHUD
            stage={selectedStage}
            judgmentMode={selectedJudgmentMode}
            combo={hudState.combo}
            accuracy={hudState.accuracy}
            progress={hudState.progress}
            health={hudState.health}
            recentHitOffsets={hudState.recentHitOffsets}
            countdownText={hudState.countdownText}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
            onRestart={handleRestartGame}
            onExit={handleReturnToStageSelect}
          />
        </div>
      )}

      {/* 4. Results Screen */}
      {screen === 'results' && lastScore && (
        <ResultScreen
          stage={selectedStage}
          judgmentMode={selectedJudgmentMode}
          score={lastScore}
          hitRecords={lastHits}
          onRetry={handleRestartGame}
          onExit={handleReturnToStageSelect}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
