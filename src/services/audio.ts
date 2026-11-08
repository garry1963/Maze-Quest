// Synthesized Web Audio API sound generator for peaceful, relaxing ambient music and tactile sound effects

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientTimer: number | null = null;
  private isMusicPlaying = false;
  
  public musicEnabled = true;
  public sfxEnabled = true;
  public musicVolume = 0.4;
  public sfxVolume = 0.5;

  constructor() {
    // Load persisted settings
    try {
      const savedMusic = localStorage.getItem('maze_music_enabled');
      if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';
      const savedSfx = localStorage.getItem('maze_sfx_enabled');
      if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';
      const savedMusicVol = localStorage.getItem('maze_music_vol');
      if (savedMusicVol !== null) this.musicVolume = parseFloat(savedMusicVol);
      const savedSfxVol = localStorage.getItem('maze_sfx_vol');
      if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);
    } catch {
      // Ignore storage errors
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? this.musicVolume : 0, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    localStorage.setItem('maze_music_enabled', String(enabled));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(enabled ? this.musicVolume : 0, this.ctx.currentTime, 0.1);
    }
    if (enabled && !this.isMusicPlaying) {
      this.startAmbientMusic();
    } else if (!enabled && this.isMusicPlaying) {
      this.stopAmbientMusic();
    }
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    localStorage.setItem('maze_sfx_enabled', String(enabled));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(enabled ? this.sfxVolume : 0, this.ctx.currentTime, 0.05);
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = vol;
    localStorage.setItem('maze_music_vol', String(vol));
    if (this.musicGain && this.ctx && this.musicEnabled) {
      this.musicGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = vol;
    localStorage.setItem('maze_sfx_vol', String(vol));
    if (this.sfxGain && this.ctx && this.sfxEnabled) {
      this.sfxGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  // Generative relaxing ambient music using celestial pentatonic notes
  public startAmbientMusic() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.initCtx();
    if (!this.ctx || !this.musicGain) return;
    this.isMusicPlaying = true;

    // Pentatonic scale (C4, D4, E4, G4, A4, C5, D5, E5, G5)
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];

    // Background continuous warm drone
    const droneOsc = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3
    droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    droneOsc.connect(droneGain);
    droneGain.connect(this.musicGain);
    droneOsc.start();
    this.ambientOscillators.push(droneOsc);

    // Warm fifth
    const fifthOsc = this.ctx.createOscillator();
    const fifthGain = this.ctx.createGain();
    fifthOsc.type = 'triangle';
    fifthOsc.frequency.setValueAtTime(196.00, this.ctx.currentTime); // G3
    fifthGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    fifthOsc.connect(fifthGain);
    fifthGain.connect(this.musicGain);
    fifthOsc.start();
    this.ambientOscillators.push(fifthOsc);

    // Gentle chiming sequencer
    const playNote = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
      const freq = scale[Math.floor(Math.random() * scale.length)];
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      const now = this.ctx.currentTime;
      const duration = 2.5 + Math.random() * 2.0;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + duration + 0.1);

      // Random delay to next ethereal note
      const delay = 1800 + Math.random() * 2500;
      this.ambientTimer = window.setTimeout(playNote, delay);
    };

    playNote();
  }

  public stopAmbientMusic() {
    this.isMusicPlaying = false;
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
    this.ambientOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore
      }
    });
    this.ambientOscillators = [];
  }

  // Tactile sound effect: movement glide
  public playMove() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    
    // Soft subtle glissando
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Tactile sound effect: wall bump
  public playBump() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Token collection: bright celestial chime
  public playToken() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const freqs = [659.25, 880.00, 1174.66]; // E5, A5, D6
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

      const now = this.ctx.currentTime + idx * 0.05;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  // Teleport portal whoosh
  public playPortal() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Level Complete fanfare
  public playWin() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    // Harmonic chord progression
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    chord.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);

      const now = this.ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.9);
    });
  }

  // Constellation unlock major celebration
  public playConstellationUnlock() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51]; // A major arpeggio
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.09);

      const now = this.ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  }
}

export const soundManager = new SoundSynthesizer();
