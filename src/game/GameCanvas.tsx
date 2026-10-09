import React, { useEffect, useRef, useCallback } from 'react';
import { Stage, JudgmentMode, JudgmentResult, GameScore, HitRecord, Tile } from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { generateStageTiles, evaluateJudgment, calculateRank, TILE_SPACING } from '../utils/gameMath';

interface GameCanvasProps {
  stage: Stage;
  judgmentMode: JudgmentMode;
  onClear: (score: GameScore, hits: HitRecord[]) => void;
  onGameOver: (score: GameScore, hits: HitRecord[]) => void;
  onUpdateHUD: (data: {
    combo: number;
    accuracy: number;
    progress: number;
    lastJudgment: JudgmentResult | null;
    recentHitOffsets: number[];
    countdownText: string | null;
    health: number;
  }) => void;
  isPaused: boolean;
  onPauseToggle: () => void;
}

interface JudgmentTextPopup {
  id: number;
  text: string;
  subText: string;
  color: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  age: number;
}

interface XMark {
  id: number;
  x: number;
  y: number;
  opacity: number;
  age: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  stage,
  judgmentMode,
  onClear,
  onGameOver,
  onUpdateHUD,
  isPaused,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gameplay state refs (for 60fps loop access without stale closures)
  const stateRef = useRef({
    isRunning: true,
    isCleared: false,
    isFailed: false,
    tiles: [] as Tile[],
    beatDuration: 60 / stage.bpm,
    targetTileIndex: 1, // 0 is starting tile, first target hit is 1
    anchorOrb: 0 as 0 | 1, // 0 = Fire (Red), 1 = Ice (Blue)
    startTime: 0, // audio time of first step (tile 1)
    countdownStart: 0,
    countdownBeatsDone: 0,
    health: 100, // 0 to 100
    combo: 0,
    maxCombo: 0,
    pureCount: 0,
    perfectCount: 0,
    earlyCount: 0,
    lateCount: 0,
    missCount: 0,
    totalHits: 0,
    scorePoints: 0,
    recentHitOffsets: [] as number[],
    hitRecords: [] as HitRecord[],
    popups: [] as JudgmentTextPopup[],
    xMarks: [] as XMark[],
    cameraX: 0,
    cameraY: 0,
    shakeIntensity: 0,
  });

  const nextPopupId = useRef(0);
  const nextXMarkId = useRef(0);

  // Initialize stage
  const resetGame = useCallback(() => {
    soundEngine.init();

    const beatDuration = 60 / stage.bpm;
    const now = soundEngine.getCurrentTime();
    // 4 beats countdown before the first hit on Tile 1
    const countdownDuration = beatDuration * 4;
    const countdownStart = now + 0.15;
    const firstHitTime = countdownStart + countdownDuration;

    // Generate stage tiles with accurate turns, angles, and target times
    const tiles = generateStageTiles(stage.id, stage.bpm, firstHitTime);

    stateRef.current = {
      isRunning: true,
      isCleared: false,
      isFailed: false,
      tiles,
      beatDuration,
      targetTileIndex: 1,
      anchorOrb: 0, // Red starts anchored on Tile 0, Blue orbits towards Tile 1
      startTime: firstHitTime,
      countdownStart,
      countdownBeatsDone: 0,
      health: 100,
      combo: 0,
      maxCombo: 0,
      pureCount: 0,
      perfectCount: 0,
      earlyCount: 0,
      lateCount: 0,
      missCount: 0,
      totalHits: 0,
      scorePoints: 0,
      recentHitOffsets: [],
      hitRecords: [],
      popups: [],
      xMarks: [],
      cameraX: 0,
      cameraY: 0,
      shakeIntensity: 0,
    };

    // Schedule music to kick off at firstHitTime - 4 beats (accompanies count-in)
    soundEngine.startMusic(stage.bpm, firstHitTime, tiles.length, stage.id);
  }, [stage]);

  // Handle player tap / hit input
  const handlePlayerTap = useCallback(() => {
    const s = stateRef.current;
    if (!s.isRunning || s.isCleared || s.isFailed || isPaused) return;

    const audioNow = soundEngine.getCurrentTime();
    const effectiveNow = audioNow - soundEngine.audioOffsetMs / 1000;

    // If still in early countdown (before beat -1), ignore tap
    const earlyTolerance = s.beatDuration * 0.75;
    const k = s.targetTileIndex;
    if (k >= s.tiles.length) return;

    const anchorTileIndex = Math.max(0, k - 1);
    const anchorTile = s.tiles[anchorTileIndex] || s.tiles[0];
    const targetTile = s.tiles[k];

    const prevHitTime = anchorTile.targetHitTime ?? (s.startTime - s.beatDuration);
    const targetHitTime = targetTile.targetHitTime ?? (s.startTime + (k - 1) * s.beatDuration);

    // Check if tap is way before first hit
    if (effectiveNow < s.startTime - earlyTolerance) {
      return;
    }

    const offsetMs = (effectiveNow - targetHitTime) * 1000;

    // Calculate current moving orb position along orbit
    const stepDuration = Math.max(0.01, targetHitTime - prevHitTime);
    const progressInStep = Math.max(0, (effectiveNow - prevHitTime) / stepDuration);
    const thetaStart = ((anchorTile.incomingAngle ?? 0) + Math.PI) % (Math.PI * 2);
    const sweptAngle = targetTile.sweptAngle ?? Math.PI;
    const rotationAngle = thetaStart + Math.min(progressInStep, 1.25) * sweptAngle;

    const curOrbX = anchorTile.x + TILE_SPACING * Math.cos(rotationAngle);
    const curOrbY = anchorTile.y + TILE_SPACING * Math.sin(rotationAngle);

    // --- CASE 1: Pressed Too Early (너무 빨리 누름) -> X자 생성 및 과부하 체크 ---
    if (offsetMs < -judgmentMode.windows.good) {
      s.xMarks.push({
        id: nextXMarkId.current++,
        x: curOrbX,
        y: curOrbY,
        opacity: 1,
        age: 0,
      });

      soundEngine.playHitSound(false);

      // 과부하 (Overload) 체크: 한 번에 X자가 4개 이상 뜨면 즉시 사망
      if (s.xMarks.length >= 4) {
        s.missCount++;
        s.combo = 0;
        s.health = 0;
        s.shakeIntensity = 18;
        soundEngine.playMissSound();

        s.popups.push({
          id: nextPopupId.current++,
          text: '과부하! (Overload)',
          subText: '4개 이상 조기 입력',
          color: '#ef4444',
          x: anchorTile.x,
          y: anchorTile.y - 35,
          opacity: 1,
          scale: 1.3,
          age: 0,
        });

        triggerGameOver(s);
        return;
      }

      s.shakeIntensity = 5;
      return;
    }

    // --- CASE 2: Hit within or after window ---
    const judgment = evaluateJudgment(offsetMs, judgmentMode);
    s.recentHitOffsets.push(offsetMs);
    if (s.recentHitOffsets.length > 25) s.recentHitOffsets.shift();

    // Successful hit clears active X marks!
    if (judgment.type !== 'miss') {
      s.xMarks = [];
    }

    s.hitRecords.push({
      tileId: k,
      offsetMs,
      type: judgment.type,
    });

    targetTile.isCompleted = true;

    // Popup displayed near the tile
    s.popups.push({
      id: nextPopupId.current++,
      text: judgment.label,
      subText: `${offsetMs >= 0 ? '+' : ''}${Math.round(offsetMs)}ms`,
      color: judgment.color,
      x: targetTile.x,
      y: targetTile.y + 40,
      opacity: 1,
      scale: 1.1,
      age: 0,
    });

    if (judgment.type === 'pure') {
      s.pureCount++;
      s.combo++;
      s.scorePoints += 100;
      soundEngine.playHitSound(true);
    } else if (judgment.type === 'perfect-early' || judgment.type === 'perfect-late') {
      s.perfectCount++;
      s.combo++;
      s.scorePoints += 85;
      soundEngine.playHitSound(true);
    } else if (judgment.type === 'early' || judgment.type === 'late') {
      if (judgment.type === 'early') s.earlyCount++;
      else s.lateCount++;
      s.combo++;
      s.scorePoints += 60;
      soundEngine.playHitSound(false);
    } else {
      // Miss: Instant 1-hit Game Over (실패 시 한 번에 사망)
      s.missCount++;
      s.combo = 0;
      s.health = 0;
      s.shakeIntensity = 14;
      soundEngine.playMissSound();
      triggerGameOver(s);
      return;
    }

    s.totalHits++;
    if (s.combo > s.maxCombo) s.maxCombo = s.combo;

    // Switch anchor and advance target tile
    s.anchorOrb = s.anchorOrb === 0 ? 1 : 0;
    s.targetTileIndex++;

    // Check completion
    if (s.targetTileIndex >= s.tiles.length) {
      triggerStageClear(s);
    }
  }, [judgmentMode, isPaused]);

  const triggerStageClear = (s: typeof stateRef.current) => {
    s.isCleared = true;
    s.isRunning = false;
    soundEngine.playClearSound();

    const accuracy = s.totalHits > 0
      ? Math.max(0, Math.min(100, ((s.scorePoints) / (s.totalHits * 100)) * 100))
      : 100;

    const finalScore: GameScore = {
      pureCount: s.pureCount,
      perfectCount: s.perfectCount,
      earlyCount: s.earlyCount,
      lateCount: s.lateCount,
      missCount: s.missCount,
      maxCombo: s.maxCombo,
      currentCombo: s.combo,
      accuracy,
      totalHits: s.totalHits,
      rank: calculateRank(accuracy, s.missCount),
      isCleared: true,
    };

    setTimeout(() => {
      onClear(finalScore, s.hitRecords);
    }, 1200);
  };

  const triggerGameOver = (s: typeof stateRef.current) => {
    s.isFailed = true;
    s.isRunning = false;
    soundEngine.stopMusic();

    const accuracy = s.totalHits > 0
      ? Math.max(0, Math.min(100, ((s.scorePoints) / (s.totalHits * 100)) * 100))
      : 0;

    const finalScore: GameScore = {
      pureCount: s.pureCount,
      perfectCount: s.perfectCount,
      earlyCount: s.earlyCount,
      lateCount: s.lateCount,
      missCount: s.missCount,
      maxCombo: s.maxCombo,
      currentCombo: s.combo,
      accuracy,
      totalHits: s.totalHits,
      rank: 'F',
      isCleared: false,
    };

    onGameOver(finalScore, s.hitRecords);
  };

  // Keyboard and mouse event listeners
  useEffect(() => {
    resetGame();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        return;
      }
      if (e.code === 'KeyR') {
        resetGame();
        return;
      }
      handlePlayerTap();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      handlePlayerTap();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
      soundEngine.stopMusic();
    };
  }, [resetGame, handlePlayerTap]);

  // Main Render & Physics Animation Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.parentElement?.clientWidth || window.innerWidth;
      const height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      animId = requestAnimationFrame(render);
      const s = stateRef.current;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Clear Canvas with authentic dark backdrop
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#090712';
      ctx.fillRect(0, 0, width, height);

      const audioNow = soundEngine.getCurrentTime();
      const effectiveNow = audioNow - soundEngine.audioOffsetMs / 1000;

      // Handle Countdown beeps & UI text
      let countdownText: string | null = null;
      if (effectiveNow < s.startTime) {
        const timeToStart = s.startTime - effectiveNow;
        const beatsRemaining = timeToStart / s.beatDuration;
        const beatNum = Math.ceil(beatsRemaining);

        if (beatNum === 4) countdownText = '3';
        else if (beatNum === 3) countdownText = '2';
        else if (beatNum === 2) countdownText = '1';
        else if (beatNum <= 1) countdownText = 'START!';

        const currentBeatStep = 4 - beatNum;
        if (currentBeatStep >= 0 && currentBeatStep > s.countdownBeatsDone) {
          s.countdownBeatsDone = currentBeatStep;
          soundEngine.playCountdownBeep(beatNum === 1 ? 1320 : 880, beatNum === 1);
        }
      }

      // Check auto-miss for past-due tiles
      const k = s.targetTileIndex;
      if (s.isRunning && !s.isCleared && !s.isFailed && k < s.tiles.length) {
        const targetTile = s.tiles[k];
        const targetHitTime = targetTile.targetHitTime ?? (s.startTime + (k - 1) * s.beatDuration);
        const missThreshold = judgmentMode.windows.miss / 1000;

        if (effectiveNow > targetHitTime + missThreshold) {
          // Missed! Instant 1-hit Game Over (실패 시 한 번에 사망)
          s.missCount++;
          s.combo = 0;
          s.totalHits++;
          s.health = 0;
          s.shakeIntensity = 14;
          soundEngine.playMissSound();

          targetTile.isCompleted = true;

          s.popups.push({
            id: nextPopupId.current++,
            text: '놓침',
            subText: 'Late',
            color: '#ef4444',
            x: targetTile.x,
            y: targetTile.y + 40,
            opacity: 1,
            scale: 1.1,
            age: 0,
          });

          triggerGameOver(s);
          return;
        }
      }

      // Calculate Orb Positions
      const anchorTileIndex = Math.max(0, s.targetTileIndex - 1);
      const anchorTile = s.tiles[anchorTileIndex] || s.tiles[0];
      const targetTile = s.tiles[s.targetTileIndex] || anchorTile;

      const prevHitTime = anchorTile.targetHitTime ?? (s.startTime - s.beatDuration);
      const targetHitTime = targetTile.targetHitTime ?? (s.startTime + (s.targetTileIndex - 1) * s.beatDuration);
      const stepDuration = Math.max(0.01, targetHitTime - prevHitTime);

      const progressInStep = Math.max(0, (effectiveNow - prevHitTime) / stepDuration);

      const thetaStart = ((anchorTile.incomingAngle ?? 0) + Math.PI) % (Math.PI * 2);
      const sweptAngle = targetTile.sweptAngle ?? Math.PI;
      const rotationAngle = thetaStart + Math.min(progressInStep, 1.25) * sweptAngle;

      const movingOrbX = anchorTile.x + TILE_SPACING * Math.cos(rotationAngle);
      const movingOrbY = anchorTile.y + TILE_SPACING * Math.sin(rotationAngle);

      const fireOrbPos = s.anchorOrb === 0
        ? { x: anchorTile.x, y: anchorTile.y }
        : { x: movingOrbX, y: movingOrbY };

      const iceOrbPos = s.anchorOrb === 1
        ? { x: anchorTile.x, y: anchorTile.y }
        : { x: movingOrbX, y: movingOrbY };

      // Camera lerp: center smoothly around active tile
      const targetCamX = anchorTile.x + (targetTile.x - anchorTile.x) * 0.5;
      const targetCamY = anchorTile.y + (targetTile.y - anchorTile.y) * 0.5;
      s.cameraX += (targetCamX - s.cameraX) * 0.12;
      s.cameraY += (targetCamY - s.cameraY) * 0.12;

      // Screen Shake
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (s.shakeIntensity > 0) {
        shakeOffsetX = (Math.random() * 2 - 1) * s.shakeIntensity;
        shakeOffsetY = (Math.random() * 2 - 1) * s.shakeIntensity;
        s.shakeIntensity *= 0.88;
        if (s.shakeIntensity < 0.2) s.shakeIntensity = 0;
      }

      // World transform
      ctx.save();
      const viewCenterX = width * 0.45 + shakeOffsetX;
      const viewCenterY = height * 0.52 + shakeOffsetY;
      ctx.translate(viewCenterX - s.cameraX, viewCenterY - s.cameraY);

      // 1. Draw Authentic Diamond Grid Background (as in screenshot 1, 2, 4)
      drawDiamondBackground(ctx, s.cameraX, s.cameraY, width, height);

      // 2. Draw Soft Atmospheric Spotlight Glow on Active Tile (as in screenshot 5, 6)
      drawTileAtmosphereGlow(ctx, anchorTile.x, anchorTile.y, targetTile.x, targetTile.y);

      // 3. Draw Authentic Marble/Stone Tiles (supporting straight & turning paths)
      drawStoneTiles(ctx, s.tiles, s.targetTileIndex, effectiveNow, s.beatDuration);

      // 4. Draw Orbit Dashed Circle Guideline around the Pivot (as in screenshot 5, 6)
      if (s.isRunning && !s.isCleared) {
        const isFireMoving = s.anchorOrb === 1;
        drawOrbitCircleGuideline(ctx, anchorTile.x, anchorTile.y, isFireMoving);
      }

      // 5. Draw Smooth Curved Motion Ribbon Trail behind the Moving Orb (as in screenshot 5, 6)
      if (s.isRunning && !s.isCleared) {
        const isFireMoving = s.anchorOrb === 1;
        drawMovingOrbTrail(
          ctx,
          anchorTile.x,
          anchorTile.y,
          rotationAngle,
          isFireMoving ? '#eb3324' : '#2563eb'
        );
      }

      // 6. Draw Early Tap X-Marks on the orbit (as in screenshot 6)
      drawXMarks(ctx, s.xMarks);

      // 7. Draw Both Authentic Planets (enlarged radius=21)
      drawAuthenticPlanet(ctx, fireOrbPos.x, fireOrbPos.y, 'fire');
      drawAuthenticPlanet(ctx, iceOrbPos.x, iceOrbPos.y, 'ice');

      // 8. Draw Popups (as in screenshot 5, 6: "정확", "빠름", "느림")
      updateAndDrawPopups(ctx, s.popups);

      ctx.restore();

      // Update HUD state for overlay
      const accuracy = s.totalHits > 0
        ? Math.max(0, Math.min(100, ((s.scorePoints) / (s.totalHits * 100)) * 100))
        : 100;
      const progress = Math.min(100, Math.round((s.targetTileIndex / s.tiles.length) * 100));

      onUpdateHUD({
        combo: s.combo,
        accuracy,
        progress,
        lastJudgment: null,
        recentHitOffsets: [...s.recentHitOffsets],
        countdownText,
        health: s.health,
      });

      ctx.restore();
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [stage, judgmentMode, onUpdateHUD]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-pointer touch-none"
      />
    </div>
  );
};

// ==========================================
// Authentic ADOFAI Visual Drawing Functions
// ==========================================

function drawDiamondBackground(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  w: number,
  h: number
) {
  const diamondSpacing = 56;
  const diamondSize = 36;
  const halfDiamond = diamondSize / 2;

  const startX = Math.floor((camX - w) / diamondSpacing) * diamondSpacing;
  const endX = camX + w;
  const startY = Math.floor((camY - h) / diamondSpacing) * diamondSpacing;
  const endY = camY + h;

  ctx.save();
  ctx.fillStyle = 'rgba(38, 30, 62, 0.45)';

  for (let x = startX; x < endX; x += diamondSpacing) {
    for (let y = startY; y < endY; y += diamondSpacing) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-halfDiamond, -halfDiamond, diamondSize, diamondSize);
      ctx.restore();
    }
  }

  ctx.strokeStyle = 'rgba(48, 38, 70, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(camX - w, camY - 140);
  ctx.lineTo(camX + w, camY - 180);
  ctx.moveTo(camX - w, camY + 220);
  ctx.lineTo(camX + w, camY + 260);
  ctx.stroke();

  ctx.restore();
}

function drawTileAtmosphereGlow(
  ctx: CanvasRenderingContext2D,
  anchorX: number,
  anchorY: number,
  targetX: number,
  targetY: number
) {
  ctx.save();
  const midX = (anchorX + targetX) * 0.5;
  const midY = (anchorY + targetY) * 0.5;

  const glow = ctx.createRadialGradient(midX, midY, 15, midX, midY, 150);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = glow;
  ctx.fillRect(midX - 180, midY - 180, 360, 360);
  ctx.restore();
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Draw Stone Tiles (supporting multi-direction paths, corners, and straight stretches)
 */
function drawStoneTiles(
  ctx: CanvasRenderingContext2D,
  tiles: Tile[],
  targetIndex: number,
  time: number,
  beatDuration: number
) {
  const tileThickness = 64;
  const halfT = tileThickness / 2;

  // 1. Draw continuous stone corridor slabs between tiles
  for (let i = 0; i < tiles.length - 1; i++) {
    const t0 = tiles[i];
    const t1 = tiles[i + 1];

    ctx.save();
    const isPast = i < targetIndex;
    const baseColor = isPast ? '#d7c79c' : '#dfcfa5';

    ctx.fillStyle = baseColor;

    if (t0.y === t1.y) {
      // Horizontal slab
      const minX = Math.min(t0.x, t1.x) - halfT;
      const maxX = Math.max(t0.x, t1.x) + halfT;
      ctx.fillRect(minX, t0.y - halfT, maxX - minX, tileThickness);

      // Shading
      const grad = ctx.createLinearGradient(0, t0.y - halfT, 0, t0.y + halfT);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
      grad.addColorStop(1, 'rgba(120, 100, 60, 0.16)');
      ctx.fillStyle = grad;
      ctx.fillRect(minX, t0.y - halfT, maxX - minX, tileThickness);

      // Borders
      ctx.strokeStyle = 'rgba(250, 245, 230, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(minX, t0.y - halfT);
      ctx.lineTo(maxX, t0.y - halfT);
      ctx.stroke();

      ctx.strokeStyle = '#857245';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(minX, t0.y + halfT);
      ctx.lineTo(maxX, t0.y + halfT);
      ctx.stroke();
    } else {
      // Vertical slab
      const minY = Math.min(t0.y, t1.y) - halfT;
      const maxY = Math.max(t0.y, t1.y) + halfT;
      ctx.fillRect(t0.x - halfT, minY, tileThickness, maxY - minY);

      // Shading
      const grad = ctx.createLinearGradient(t0.x - halfT, 0, t0.x + halfT, 0);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
      grad.addColorStop(1, 'rgba(120, 100, 60, 0.16)');
      ctx.fillStyle = grad;
      ctx.fillRect(t0.x - halfT, minY, tileThickness, maxY - minY);

      // Borders
      ctx.strokeStyle = 'rgba(250, 245, 230, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(t0.x - halfT, minY);
      ctx.lineTo(t0.x - halfT, maxY);
      ctx.stroke();

      ctx.strokeStyle = '#857245';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t0.x + halfT, minY);
      ctx.lineTo(t0.x + halfT, maxY);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 2. Draw tile landing centers, cracks, corner swirl indicators, and pulse rings
  tiles.forEach((tile, index) => {
    const isTarget = index === targetIndex;
    const isLast = tile.isLast;
    const circleRadius = 15;

    ctx.save();
    ctx.translate(tile.x, tile.y);

    // Marble texture crack accents
    const seed = tile.id * 19 + 7;
    ctx.strokeStyle = 'rgba(120, 100, 65, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-18 + pseudoRandom(seed) * 8, -12 + pseudoRandom(seed + 1) * 6);
    ctx.lineTo(pseudoRandom(seed + 2) * 6, pseudoRandom(seed + 3) * 8);
    ctx.lineTo(16 - pseudoRandom(seed + 4) * 6, 12 - pseudoRandom(seed + 5) * 6);
    ctx.stroke();

    // Target pulse ring (soft guide on active target tile)
    if (isTarget && !isLast) {
      const pulse = 1 + Math.sin((time / beatDuration) * Math.PI * 2) * 0.15;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 18 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Only draw center landing spot and goal star on the LAST finish tile!
    if (isLast) {
      const circleRadius = 16;
      const spotGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, circleRadius);
      spotGrad.addColorStop(0, '#fbf8ef');
      spotGrad.addColorStop(0.7, '#ede3cb');
      spotGrad.addColorStop(1, '#dfd2b2');

      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(140, 120, 80, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 0);
    }

    ctx.restore();
  });
}

function drawOrbitCircleGuideline(
  ctx: CanvasRenderingContext2D,
  pivotX: number,
  pivotY: number,
  isFireMoving: boolean
) {
  ctx.save();
  ctx.strokeStyle = isFireMoving
    ? 'rgba(79, 70, 229, 0.65)'
    : 'rgba(59, 130, 246, 0.65)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  ctx.arc(pivotX, pivotY, TILE_SPACING, 0, Math.PI * 2, false);
  ctx.stroke();

  ctx.restore();
}

function drawMovingOrbTrail(
  ctx: CanvasRenderingContext2D,
  pivotX: number,
  pivotY: number,
  headAngle: number,
  colorHex: string
) {
  ctx.save();

  const trailArcLength = 0.42 * Math.PI;
  const numSteps = 24;

  for (let i = 0; i < numSteps; i++) {
    const t0 = i / numSteps;
    const t1 = (i + 1) / numSteps;

    const a0 = headAngle - trailArcLength * (1 - t0);
    const a1 = headAngle - trailArcLength * (1 - t1);

    const width = 2 + t1 * 22;
    const opacity = Math.pow(t1, 1.8) * 0.85;

    ctx.lineWidth = width;
    ctx.lineCap = 'round';

    if (colorHex === '#eb3324') {
      ctx.strokeStyle = `rgba(235, 51, 36, ${opacity})`;
    } else {
      ctx.strokeStyle = `rgba(37, 99, 235, ${opacity})`;
    }

    const p0x = pivotX + TILE_SPACING * Math.cos(a0);
    const p0y = pivotY + TILE_SPACING * Math.sin(a0);
    const p1x = pivotX + TILE_SPACING * Math.cos(a1);
    const p1y = pivotY + TILE_SPACING * Math.sin(a1);

    ctx.beginPath();
    ctx.moveTo(p0x, p0y);
    ctx.lineTo(p1x, p1y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawXMarks(ctx: CanvasRenderingContext2D, xMarks: XMark[]) {
  for (let i = xMarks.length - 1; i >= 0; i--) {
    const mark = xMarks[i];
    mark.age++;
    if (mark.age > 120) {
      mark.opacity = Math.max(0, 1 - (mark.age - 120) / 30);
    }
    if (mark.age > 150) {
      xMarks.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(mark.x, mark.y);
    ctx.globalAlpha = mark.opacity;

    // Small circular badge matching screenshot 6
    const radius = 9;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    const arm = 4.5;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-arm, -arm);
    ctx.lineTo(arm, arm);
    ctx.moveTo(arm, -arm);
    ctx.lineTo(-arm, arm);
    ctx.stroke();

    ctx.restore();
  }
}

function drawAuthenticPlanet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: 'fire' | 'ice'
) {
  const radius = 21;

  ctx.save();
  ctx.translate(x, y);

  if (type === 'fire') {
    // Red Planet (불 / Fire)
    const aura = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.5);
    aura.addColorStop(0, 'rgba(235, 51, 36, 0.35)');
    aura.addColorStop(1, 'rgba(235, 51, 36, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    const sphereGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, radius);
    sphereGrad.addColorStop(0, '#ff4a3b');
    sphereGrad.addColorStop(0.5, '#eb3324');
    sphereGrad.addColorStop(1, '#cb1e12');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Blue Planet (얼음 / Ice)
    const aura = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.5);
    aura.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
    aura.addColorStop(1, 'rgba(37, 99, 235, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    const sphereGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, radius);
    sphereGrad.addColorStop(0, '#3b82f6');
    sphereGrad.addColorStop(0.5, '#2563eb');
    sphereGrad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function updateAndDrawPopups(
  ctx: CanvasRenderingContext2D,
  popups: JudgmentTextPopup[]
) {
  for (let i = popups.length - 1; i >= 0; i--) {
    const popup = popups[i];
    popup.age++;
    popup.y += 0.4;
    popup.opacity = Math.max(0, 1 - popup.age / 35);

    if (popup.age >= 35) {
      popups.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(popup.x, popup.y);
    ctx.globalAlpha = popup.opacity;

    ctx.fillStyle = popup.color;
    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText(popup.text, 0, 0);

    ctx.restore();
  }
}
