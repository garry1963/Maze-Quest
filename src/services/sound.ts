// Web Audio API Sound Synthesizer for Victory Celebrations and Interactivity

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  // Play Star Pop Chime (higher pitch for 1st, 2nd, 3rd star)
  public playStarPop(starIndex: number) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Frequencies for C5, E5, G5, C6 (sparkling major chord notes)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      const freq = freqs[Math.min(starIndex - 1, freqs.length - 1)] || 523.25;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio fallback
    }
  }

  // Play Victory Fanfare Chord Sequence
  public playVictoryFanfare(stars: number) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Base chord notes (Major Triad / Arpeggio)
      const notes = [
        { freq: 440.0, delay: 0.0, dur: 0.4 },  // A4
        { freq: 554.37, delay: 0.12, dur: 0.4 }, // C#5
        { freq: 659.25, delay: 0.24, dur: 0.5 }, // E5
        { freq: 880.0, delay: 0.38, dur: 0.8 },  // A5
      ];

      if (stars === 3) {
        notes.push({ freq: 1108.73, delay: 0.52, dur: 1.0 }); // C#6 extra sparkle for 3 stars
      }

      notes.forEach(({ freq, delay, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.25, now + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + dur);
      });
    } catch {
      // Audio fallback
    }
  }

  // Play Confetti Pop
  public playConfettiPop() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio fallback
    }
  }
}

export const soundManager = new SoundManager();
