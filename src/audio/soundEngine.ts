/**
 * High-precision procedural Web Audio synthesizer for ADOFAI gameplay
 * Generates rhythmic music synchronized with audioContext.currentTime and crisp low-latency SFX
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;

  private scheduledSources: (AudioNode & { stop?: (when?: number) => void })[] = [];
  private isPlayingMusic = false;
  private musicStartTime = 0;
  private songBpm = 120;
  private scheduleTimer: number | null = null;

  public musicVolume = 0.8;
  public sfxVolume = 0.9;
  public masterVolume = 0.9;
  public audioOffsetMs = 0; // Calibration offset in milliseconds

  public init() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGainNode = this.ctx.createGain();
    this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    this.masterGainNode.connect(this.ctx.destination);

    this.musicGainNode = this.ctx.createGain();
    this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.musicGainNode.connect(this.masterGainNode);

    this.sfxGainNode = this.ctx.createGain();
    this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.sfxGainNode.connect(this.masterGainNode);

    this.isInitialized = true;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getCurrentTime(): number {
    if (!this.ctx) return performance.now() / 1000;
    return this.ctx.currentTime;
  }

  public setVolumes(master: number, music: number, sfx: number) {
    this.masterVolume = master;
    this.musicVolume = music;
    this.sfxVolume = sfx;

    if (this.ctx && this.masterGainNode && this.musicGainNode && this.sfxGainNode) {
      const t = this.ctx.currentTime;
      this.masterGainNode.gain.setTargetAtTime(master, t, 0.05);
      this.musicGainNode.gain.setTargetAtTime(music, t, 0.05);
      this.sfxGainNode.gain.setTargetAtTime(sfx, t, 0.05);
    }
  }

  /**
   * Schedule countdown beeps: beats -4, -3, -2, -1 before target start
   */
  public playCountdownBeep(frequency: number = 880, isHigh: boolean = false) {
    this.init();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isHigh ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(frequency, t);

    gain.gain.setValueAtTime(isHigh ? 0.35 : 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  /**
   * Crisp rhythmic hit feedback sound (woodblock / glass click / modern electronic snap)
   */
  public playHitSound(isPure: boolean = true) {
    this.init();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;

    // Layer 1: High transient "pop" (sine with fast drop)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = isPure ? 'sine' : 'triangle';
    const startFreq = isPure ? 960 : 720;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.045);

    oscGain.gain.setValueAtTime(isPure ? 0.4 : 0.25, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.05);

    // Layer 2: Metallic wood click (filtered tiny noise burst)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.03);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isPure ? 2400 : 1800, t);
    filter.Q.setValueAtTime(4.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGainNode);

    noise.start(t);
  }

  /**
   * Miss sound (subtle low thud)
   */
  public playMissSound() {
    this.init();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  /**
   * Clear Fanfare
   */
  public playClearSound() {
    this.init();
    if (!this.ctx || !this.sfxGainNode) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.65);
    });
  }

  /**
   * Start procedural rhythmic music aligned with game beats
   * @param bpm Beats per minute (e.g. 120)
   * @param startTime AudioContext time at which the first gameplay step (tile 1) occurs
   * @param totalBeats Total steps in the level
   */
  public startMusic(bpm: number, startTime: number, totalBeats: number, stageId: string = 'stage-1') {
    this.init();
    this.stopMusic();

    if (!this.ctx || !this.musicGainNode) return;

    this.songBpm = bpm;
    this.musicStartTime = startTime;
    this.isPlayingMusic = true;

    // Restore music gain on new playback
    const t = this.ctx.currentTime;
    this.musicGainNode.gain.cancelScheduledValues(t);
    this.musicGainNode.gain.setValueAtTime(this.musicVolume, t);

    const beatDuration = 60 / bpm;
    const barDuration = beatDuration * 4;
    const totalBars = Math.ceil((totalBeats + 6) / 4) + 3;

    // Schedule all bars using WebAudio precise timeline
    for (let bar = -1; bar < totalBars; bar++) {
      const barStartTime = startTime + bar * barDuration;
      this.scheduleBar(bar, barStartTime, beatDuration, bar < totalBars - 1, stageId);
    }
  }

  private scheduleBar(
    barIndex: number,
    barTime: number,
    beatDur: number,
    hasLead: boolean,
    stageId: string
  ) {
    if (!this.ctx || !this.musicGainNode) return;

    // Stage-specific progressions
    let chords = [
      { bass: 65.41, notes: [261.63, 329.63, 392.0] }, // C
      { bass: 49.00, notes: [246.94, 293.66, 392.0] }, // G
      { bass: 55.00, notes: [220.00, 261.63, 329.63] }, // Am
      { bass: 43.65, notes: [220.00, 261.63, 349.23] }, // F
    ];

    const isBoss = stageId === 'stage-1-boss' || stageId === 'stage-boss';

    if (isBoss) {
      // Epic Heroic Synthwave Boss Track: Em -> C -> G -> D
      chords = [
        { bass: 41.20, notes: [164.81, 196.00, 246.94, 329.63] }, // Em
        { bass: 65.41, notes: [261.63, 329.63, 392.00, 523.25] }, // C
        { bass: 49.00, notes: [196.00, 246.94, 293.66, 392.00] }, // G
        { bass: 73.42, notes: [293.66, 369.99, 440.00, 587.33] }, // D
      ];
    } else if (stageId === 'stage-1-2' || stageId === 'stage-2') {
      // D minor funky groove
      chords = [
        { bass: 73.42, notes: [293.66, 349.23, 440.0] }, // Dm
        { bass: 58.27, notes: [233.08, 293.66, 349.23] }, // Bb
        { bass: 49.00, notes: [246.94, 293.66, 392.0] }, // Gm
        { bass: 55.00, notes: [220.00, 277.18, 329.63] }, // A
      ];
    } else if (stageId === 'stage-1-3' || stageId === 'stage-3') {
      // Fast A minor tech synthwave
      chords = [
        { bass: 55.00, notes: [220.00, 261.63, 329.63] }, // Am
        { bass: 43.65, notes: [220.00, 261.63, 349.23] }, // F
        { bass: 65.41, notes: [261.63, 329.63, 392.0] }, // C
        { bass: 41.20, notes: [246.94, 329.63, 392.0] }, // Em
      ];
    }

    const chordIndex = Math.max(0, barIndex) % chords.length;
    const currentChord = chords[chordIndex];

    // 1. Kick on every beat (Four on the Floor for ADOFAI rhythm clarity)
    for (let b = 0; b < 4; b++) {
      const beatTime = barTime + b * beatDur;
      if (barIndex >= 0) {
        this.synthesizeKick(beatTime);
      }

      // 2. Snare / Clap on beats 1 and 3 (0-indexed: beat 1 and 3)
      if (barIndex >= 0 && (b === 1 || b === 3)) {
        this.synthesizeSnare(beatTime);
      }

      // 3. Hi-hats on 8th notes
      if (barIndex >= 0) {
        this.synthesizeHiHat(beatTime + beatDur * 0.5);
      }
    }

    // 4. Bassline: Pulsing 8th-note synth bass
    if (barIndex >= 0) {
      for (let step = 0; step < 8; step++) {
        const noteTime = barTime + step * (beatDur * 0.5);
        this.synthesizeBassNote(currentChord.bass, noteTime, beatDur * 0.4);
      }
    }

    // 5. Arpeggio / Synth Pad melody
    if (barIndex >= 0 && hasLead) {
      const arpNotes = [
        currentChord.notes[0] * 2,
        currentChord.notes[1] * 2,
        currentChord.notes[2] * 2,
        currentChord.notes[1] * 2,
      ];

      for (let s = 0; s < 4; s++) {
        const noteTime = barTime + s * beatDur;
        this.synthesizeLeadNote(arpNotes[s % arpNotes.length], noteTime, beatDur * 0.6);
      }
    }
  }

  private synthesizeKick(time: number) {
    if (!this.ctx || !this.musicGainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGainNode);

    osc.start(time);
    osc.stop(time + 0.2);
    this.scheduledSources.push(osc);
  }

  private synthesizeSnare(time: number) {
    if (!this.ctx || !this.musicGainNode) return;

    // White noise snap
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGainNode);

    noise.start(time);
    this.scheduledSources.push(noise);
  }

  private synthesizeHiHat(time: number) {
    if (!this.ctx || !this.musicGainNode) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGainNode);

    noise.start(time);
    this.scheduledSources.push(noise);
  }

  private synthesizeBassNote(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.musicGainNode) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGainNode);

    osc.start(time);
    osc.stop(time + duration + 0.02);
    this.scheduledSources.push(osc);
  }

  private synthesizeLeadNote(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.musicGainNode) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGainNode);

    osc.start(time);
    osc.stop(time + duration + 0.05);
    this.scheduledSources.push(osc);
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    if (this.scheduleTimer) {
      window.clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    // Hard stop volume immediately
    if (this.ctx && this.musicGainNode) {
      const t = this.ctx.currentTime;
      this.musicGainNode.gain.cancelScheduledValues(t);
      this.musicGainNode.gain.setValueAtTime(0, t);
    }
    // Immediately stop and disconnect all scheduled audio nodes
    for (const source of this.scheduledSources) {
      try {
        if ('stop' in source && typeof (source as any).stop === 'function') {
          (source as any).stop(0);
        }
        source.disconnect();
      } catch (_) {}
    }
    this.scheduledSources = [];
  }
}

export const soundEngine = new SoundEngine();
