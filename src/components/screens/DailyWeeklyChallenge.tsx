import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Layers,
  Clock,
  Trophy,
  Play,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Star,
  Award,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getDailyChallenge, getWeeklyChallenge } from '../../services/puzzleData';
import { getChallengeAttempt, hasAttemptedChallenge } from '../../services/storage';

export const DailyWeeklyChallenge: React.FC<{ initialTab?: 'daily' | 'weekly' }> = ({
  initialTab = 'daily',
}) => {
  const { setCurrentScreen, playPuzzle, userProgress } = useGame();
  const [tab, setTab] = useState<'daily' | 'weekly'>(initialTab);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const dailyPuzzle = getDailyChallenge();
  const weeklyPuzzle = getWeeklyChallenge();

  const isDailyDone = hasAttemptedChallenge(dailyPuzzle.id) || !!userProgress[dailyPuzzle.id]?.completed;
  const isWeeklyDone = hasAttemptedChallenge(weeklyPuzzle.id) || !!userProgress[weeklyPuzzle.id]?.completed;

  // Live countdown to midnight UTC (for daily) or Sunday midnight UTC (for weekly)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      let target: Date;

      if (tab === 'daily') {
        target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      } else {
        const dayOfWeek = now.getUTCDay(); // 0 is Sunday
        const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
        target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday, 0, 0, 0));
      }

      const diff = Math.max(0, target.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [tab]);

  const activeChallenge = tab === 'daily' ? dailyPuzzle : weeklyPuzzle;
  const isAttemptUsed = tab === 'daily' ? isDailyDone : isWeeklyDone;
  const attemptRecord = getChallengeAttempt(activeChallenge.id);
  const progressRecord = userProgress[activeChallenge.id];

  const bestPoints = attemptRecord?.points ?? progressRecord?.points ?? 0;
  const bestStars = attemptRecord?.stars ?? progressRecord?.stars ?? 0;
  const bestTime = attemptRecord?.completionTime ?? progressRecord?.bestTime;
  const bestMoves = attemptRecord?.moveCount ?? progressRecord?.bestMoves;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('home')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            title="Return"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Official Competitive Challenges
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Strict 1-attempt limit per cycle • Standardized deterministic seed worldwide
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tab === 'daily'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Maze</span>
          </button>

          <button
            onClick={() => setTab('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              tab === 'weekly'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Weekly Master</span>
          </button>
        </div>
      </div>

      {/* Main Challenge Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                tab === 'daily'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
              }`}
            >
              {tab === 'daily' ? 'Daily Challenge' : 'Weekly Masterpiece'}
            </span>

            {isAttemptUsed ? (
              <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-extrabold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                1/1 Attempt Used
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                1 Attempt Available
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              {activeChallenge.name}
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              {tab === 'daily'
                ? 'Navigate today’s labyrinth to earn bonus leaderboard points. Remember: only 1 attempt is allowed per day!'
                : 'An intricate weekly masterpiece with high difficulty and bonus leaderboard rewards. Only 1 attempt is allowed per week.'}
            </p>
          </div>

          {/* Details Pill grid */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 capitalize">
              Mode: {activeChallenge.mode.replace('_', ' ')}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 capitalize">
              Difficulty: {activeChallenge.difficulty}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
              Reward: +{activeChallenge.basePoints} Pts
            </span>
          </div>

          {/* If attempt has already been used, show score summary card */}
          {isAttemptUsed && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Your Official Attempt Result
                </span>
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Recorded
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Points</span>
                  <span className="text-sm font-extrabold text-amber-400">{bestPoints}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Stars</span>
                  <span className="text-sm font-extrabold text-amber-300 flex items-center justify-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {bestStars}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Time</span>
                  <span className="text-sm font-mono font-bold text-slate-200">
                    {bestTime ? `${bestTime.toFixed(1)}s` : '—'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Moves</span>
                  <span className="text-sm font-mono font-bold text-slate-200">{bestMoves || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Play / Status Button */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {isAttemptUsed ? (
              <div className="flex items-center gap-3">
                <button
                  disabled
                  className="px-6 py-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/60 text-slate-500 font-bold text-sm flex items-center gap-2 cursor-not-allowed opacity-90"
                >
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Attempt Used (1/1)</span>
                </button>
                <button
                  onClick={() => setCurrentScreen('leaderboards')}
                  className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sky-400 hover:text-sky-300 font-bold text-sm flex items-center gap-2 transition-all active:scale-95"
                >
                  <Trophy className="w-4 h-4" />
                  <span>View Leaderboard</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => playPuzzle(activeChallenge)}
                className={`px-6 py-3.5 rounded-2xl text-white font-bold text-sm flex items-center gap-2 shadow-xl transition-all active:scale-[0.98] ${
                  tab === 'daily'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sky-500/20'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-purple-500/20'
                }`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Challenge Now (1 Attempt Only)</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Reset Timer Box */}
        <div className="w-full md:w-64 p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
          <Clock className="w-8 h-8 text-sky-400 mb-2" />
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Resets In
          </span>
          <div className="font-mono text-2xl md:text-3xl font-extrabold text-white my-1">
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <span className="text-[11px] text-slate-500">UTC Synchronized</span>
          {isAttemptUsed && (
            <span className="mt-3 text-[11px] text-amber-400/90 font-medium bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              Next attempt available after reset
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
