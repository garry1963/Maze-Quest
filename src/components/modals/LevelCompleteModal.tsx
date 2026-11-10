import React, { useEffect, useState } from 'react';
import { Star, Trophy, Clock, ArrowRight, RotateCcw, Compass, Sparkles, Calendar, PartyPopper, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PuzzleDefinition } from '../../types/game';
import { soundManager } from '../../services/sound';

interface LevelCompleteModalProps {
  puzzle: PuzzleDefinition;
  stars: number;
  points: number;
  timeTaken: number;
  movesTaken: number;
  isNewRecord: boolean;
  unlockedConstellation?: string;
  isChallenge?: boolean;
  onNext: () => void;
  onReplay: () => void;
  onReturnToMap: () => void;
  onViewLeaderboard?: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  puzzle,
  stars,
  points,
  timeTaken,
  movesTaken,
  isNewRecord,
  unlockedConstellation,
  isChallenge = false,
  onNext,
  onReplay,
  onReturnToMap,
  onViewLeaderboard,
}) => {
  // Staggered star reveal animation state
  const [visibleStars, setVisibleStars] = useState<number>(0);

  // Animated score counter numbers
  const [displayPoints, setDisplayPoints] = useState<number>(0);
  const [displayTime, setDisplayTime] = useState<number>(0);
  const [displayMoves, setDisplayMoves] = useState<number>(0);

  // Fire confetti cannon function
  const triggerCelebrationConfetti = () => {
    soundManager.playConfettiPop();

    // Side Cannon 1 (Left)
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { x: 0.15, y: 0.75 },
      colors: ['#f59e0b', '#38bdf8', '#a855f7', '#10b981', '#f43f5e'],
      disableForReducedMotion: true,
    });

    // Side Cannon 2 (Right)
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { x: 0.85, y: 0.75 },
      colors: ['#f59e0b', '#38bdf8', '#a855f7', '#10b981', '#f43f5e'],
      disableForReducedMotion: true,
    });

    // Center star burst if 3 stars earned
    if (stars === 3 || isNewRecord) {
      setTimeout(() => {
        confetti({
          particleCount: 90,
          spread: 100,
          startVelocity: 45,
          origin: { x: 0.5, y: 0.45 },
          colors: ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff'],
          shapes: ['star'],
          scalar: 1.2,
          disableForReducedMotion: true,
        });
      }, 350);
    }
  };

  useEffect(() => {
    // 1. Play victory fanfare
    soundManager.playVictoryFanfare(stars);

    // 2. Fire celebratory confetti fireworks
    triggerCelebrationConfetti();

    // 3. Sequential Staggered Star Pop Animations
    const starTimers: NodeJS.Timeout[] = [];
    for (let i = 1; i <= 3; i++) {
      const timer = setTimeout(() => {
        setVisibleStars(i);
        if (i <= stars) {
          soundManager.playStarPop(i);
        }
      }, i * 320);
      starTimers.push(timer);
    }

    // 4. Animated Score count-up over 800ms
    const duration = 800;
    const startTime = performance.now();

    const animateScores = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayPoints(Math.round(points * easeProgress));
      setDisplayTime(Number((timeTaken * easeProgress).toFixed(1)));
      setDisplayMoves(Math.round(movesTaken * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(animateScores);
      }
    };

    requestAnimationFrame(animateScores);

    return () => {
      starTimers.forEach(clearTimeout);
    };
  }, [stars, points, timeTaken, movesTaken, isNewRecord]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-hidden">
      {/* Rotating Cosmic Rays Celebration Backdrop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-25">
        <div className="w-[800px] h-[800px] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/30 via-sky-500/10 to-transparent animate-spin-rays" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/95 border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl shadow-amber-500/10 text-center flex flex-col items-center z-10 animate-cosmic-pulse">
        {/* Glow ambient circle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Constellation completion banner if triggered */}
        {unlockedConstellation && (
          <div className="mb-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold tracking-wide uppercase shadow-lg shadow-amber-500/10">
            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
            Constellation Solved!
          </div>
        )}

        {/* New Record Banner */}
        {isNewRecord && (
          <div className="mb-3 relative overflow-hidden inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>New Personal Record!</span>
            <div className="absolute inset-0 bg-white/20 animate-banner-shine" />
          </div>
        )}

        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-0.5">
          {stars === 3 ? 'Perfect Solved!' : 'Labyrinth Solved!'}
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mb-5 font-medium">{puzzle.name}</p>

        {/* 3 Stars Animated Reveal */}
        <div className="flex items-center justify-center gap-3.5 mb-6">
          {[1, 2, 3].map((s) => {
            const isEarned = s <= stars;
            const isVisible = s <= visibleStars;

            return (
              <div
                key={s}
                className={`relative p-3.5 rounded-2xl transition-all duration-300 ${
                  isVisible ? 'animate-star-pop' : 'opacity-0 scale-50'
                } ${
                  isEarned
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 scale-110 shadow-xl shadow-amber-500/30'
                    : 'bg-slate-800/40 text-slate-600 border border-slate-800'
                }`}
              >
                {/* Star background aura burst */}
                {isEarned && isVisible && (
                  <div className="absolute inset-0 rounded-2xl bg-amber-400/10 animate-ping" />
                )}
                <Star
                  className={`w-9 h-9 ${
                    isEarned
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                      : 'text-slate-700'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Dynamic Stats Grid with Animated Count-Up */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col items-center shadow-inner">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Time Taken
            </div>
            <span className="text-xl font-black text-white font-mono">
              {displayTime.toFixed(1)}s
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col items-center shadow-inner">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-semibold">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Moves Count
            </div>
            <span className="text-xl font-black text-white font-mono">{displayMoves}</span>
          </div>

          <div className="col-span-2 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-sky-500/15 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between px-5 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-slate-200 font-bold">
              <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
              Total Points Earned
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                +{displayPoints}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Confetti Re-trigger Button */}
        <button
          onClick={triggerCelebrationConfetti}
          className="mb-4 text-xs font-bold text-amber-400/90 hover:text-amber-300 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all active:scale-95"
          title="Fire Confetti Again"
        >
          <PartyPopper className="w-3.5 h-3.5" />
          <span>Celebrate Again 🎉</span>
        </button>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {isChallenge ? (
            <>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-1">
                Official Attempt Registered (1/1 Attempt Used)
              </div>
              <button
                onClick={onViewLeaderboard || onNext}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-sky-500 hover:from-amber-400 hover:to-sky-400 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98]"
              >
                <Trophy className="w-4 h-4 text-white" />
                <span>View Global Leaderboard</span>
              </button>
              <button
                onClick={onReturnToMap}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium flex items-center justify-center gap-2 border border-slate-700/60 transition-all active:scale-[0.98]"
              >
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Return to Challenges</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onNext}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all active:scale-[0.98]"
              >
                <span>Next Labyrinth</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex gap-2">
                <button
                  onClick={onReplay}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium flex items-center justify-center gap-2 border border-slate-700/60 transition-all active:scale-[0.98]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Replay</span>
                </button>

                <button
                  onClick={onReturnToMap}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium flex items-center justify-center gap-2 border border-slate-700/60 transition-all active:scale-[0.98]"
                >
                  <Compass className="w-4 h-4" />
                  <span>Constellations</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
