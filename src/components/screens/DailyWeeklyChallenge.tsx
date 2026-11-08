import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Layers,
  Clock,
  Trophy,
  Play,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Flame,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getDailyChallenge, getWeeklyChallenge } from '../../services/puzzleData';

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

  const isDailyDone = !!userProgress[dailyPuzzle.id]?.completed;
  const isWeeklyDone = !!userProgress[weeklyPuzzle.id]?.completed;

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
  const isCompleted = tab === 'daily' ? isDailyDone : isWeeklyDone;

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
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Competitive Challenges
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Identical deterministic seeds worldwide with UTC standardized reset
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

            {isCompleted && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Completed
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              {activeChallenge.name}
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              {tab === 'daily'
                ? 'Solve today’s labyrinth to earn double leaderboard points and maintain your daily streak.'
                : 'An intricate silhouette labyrinth featuring interconnected teleportation gateways and higher difficulty.'}
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

          {/* Play Button */}
          <div className="pt-2">
            <button
              onClick={() => playPuzzle(activeChallenge)}
              className={`px-6 py-3.5 rounded-2xl text-white font-bold text-sm flex items-center gap-2 shadow-xl transition-all active:scale-[0.98] ${
                tab === 'daily'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sky-500/20'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-purple-500/20'
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isCompleted ? 'Replay Challenge' : 'Start Challenge Now'}</span>
            </button>
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
        </div>
      </div>
    </div>
  );
};
