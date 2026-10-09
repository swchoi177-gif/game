import React, { useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { X, Volume2, Music, Sparkles, Sliders, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [offset, setOffset] = useState(soundEngine.audioOffsetMs);
  const [masterVol, setMasterVol] = useState(Math.round(soundEngine.masterVolume * 100));
  const [musicVol, setMusicVol] = useState(Math.round(soundEngine.musicVolume * 100));
  const [sfxVol, setSfxVol] = useState(Math.round(soundEngine.sfxVolume * 100));
  const [lastTapFeedback, setLastTapFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOffsetChange = (newVal: number) => {
    setOffset(newVal);
    soundEngine.audioOffsetMs = newVal;
  };

  const handleVolumeUpdate = (
    master: number = masterVol,
    music: number = musicVol,
    sfx: number = sfxVol
  ) => {
    soundEngine.setVolumes(master / 100, music / 100, sfx / 100);
  };

  const handleTestTap = () => {
    soundEngine.init();
    soundEngine.playHitSound(true);
    setLastTapFeedback('타격음 재생!');
    setTimeout(() => setLastTapFeedback(null), 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-cyan-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">오디오 및 조작 설정</h3>
            <p className="text-xs text-slate-400">타이밍 오프셋 및 볼륨 조정</p>
          </div>
        </div>

        {/* Audio Calibration Offset */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              오디오 판정 오프셋 (Offset)
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {offset >= 0 ? `+${offset}` : offset} ms
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            블루투스 이어폰이나 디스플레이 지연이 있을 경우 조절하세요.
            (음수가 빠름, 양수가 느림)
          </p>

          <input
            type="range"
            min="-100"
            max="100"
            step="5"
            value={offset}
            onChange={(e) => handleOffsetChange(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>-100ms</span>
            <button
              onClick={() => handleOffsetChange(0)}
              className="hover:text-cyan-400 underline cursor-pointer"
            >
              기본값 (0ms)
            </button>
            <span>+100ms</span>
          </div>

          {/* Test Tap Button */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">타격음 테스트</span>
            <button
              onClick={handleTestTap}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition cursor-pointer active:scale-95"
            >
              {lastTapFeedback || '타격음 듣기'}
            </button>
          </div>
        </div>

        {/* Volume Sliders */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-slate-400" />
                마스터 볼륨
              </span>
              <span className="font-mono text-slate-400">{masterVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVol}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setMasterVol(val);
                handleVolumeUpdate(val, musicVol, sfxVol);
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-slate-400" />
                음악 볼륨
              </span>
              <span className="font-mono text-slate-400">{musicVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVol}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setMusicVol(val);
                handleVolumeUpdate(masterVol, val, sfxVol);
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-slate-400" />
                효과음 볼륨
              </span>
              <span className="font-mono text-slate-400">{sfxVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVol}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setSfxVol(val);
                handleVolumeUpdate(masterVol, musicVol, val);
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Controls Guide */}
        <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 mb-6">
          <div className="font-semibold text-slate-300 mb-1">단축키 안내</div>
          <div className="grid grid-cols-2 gap-1.5">
            <div><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200">Space / 아무 키</kbd> : 타일 밟기</div>
            <div><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200">마우스 클릭</kbd> : 터치 밟기</div>
            <div><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200">R</kbd> : 즉시 재시작</div>
            <div><kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200">ESC</kbd> : 일시 정지</div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-500/20"
        >
          <Check className="w-4 h-4" />
          <span>설정 완료</span>
        </button>
      </div>
    </div>
  );
};
