import React from 'react';
import {
  Trophy,
  Star,
  Compass,
  Zap,
  Target,
  Sparkles,
  Hexagon,
  Infinity as InfinityIcon,
  Gem,
  Calendar,
  EyeOff,
  CheckCircle2,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { INITIAL_ACHIEVEMENTS } from '../../services/puzzleData';

const ICONS: Record<string, React.ReactNode> = {
  Compass: <Compass className="w-5 h-5 text-sky-400" />,
  MapPin: <Compass className="w-5 h-5 text-emerald-400" />,
  Trophy: <Trophy className="w-5 h-5 text-amber-400" />,
  Zap: <Zap className="w-5 h-5 text-yellow-400" />,
  Target: <Target className="w-5 h-5 text-rose-400" />,
  Star: <Star className="w-5 h-5 text-amber-400" />,
  Hexagon: <Hexagon className="w-5 h-5 text-indigo-400" />,
  Infinity: <InfinityIcon className="w-5 h-5 text-purple-400" />,
  Gem: <Gem className="w-5 h-5 text-pink-400" />,
  Calendar: <Calendar className="w-5 h-5 text-blue-400" />,
  Sparkles: <Sparkles className="w-5 h-5 text-amber-300" />,
  EyeOff: <EyeOff className="w-5 h-5 text-teal-400" />,
};

export const AchievementsScreen: React.FC = () => {
  const { setCurrentScreen, completedCount, totalStars } = useGame();

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
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Achievements & Milestones
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Unlock badges and claim bonus points across progression, performance, and exploration
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INITIAL_ACHIEVEMENTS.map((ach) => {
          // Dynamic calculation of achievement progress
          let currentVal = 0;
          if (ach.id === 'first_steps') currentVal = completedCount;
          else if (ach.id === 'maze_explorer') currentVal = completedCount;
          else if (ach.id === 'labyrinth_expert') currentVal = completedCount;
          else if (ach.id === 'three_star_collector') currentVal = totalStars;
          else if (ach.id === 'constellation_master') currentVal = Math.min(20, completedCount);
          else currentVal = Math.min(ach.requirement, completedCount);

          const isUnlocked = currentVal >= ach.requirement;
          const pct = Math.min(100, Math.round((currentVal / ach.requirement) * 100));

          return (
            <div
              key={ach.id}
              className={`p-5 rounded-3xl border transition-all flex items-start gap-4 ${
                isUnlocked
                  ? 'bg-slate-900/90 border-slate-700/80 shadow-lg'
                  : 'bg-slate-950/60 border-slate-900 opacity-75'
              }`}
            >
              <div
                className={`p-3 rounded-2xl border flex items-center justify-center shrink-0 ${
                  isUnlocked
                    ? 'bg-slate-800 border-slate-700 shadow-md'
                    : 'bg-slate-900/50 border-slate-850 opacity-60'
                }`}
              >
                {ICONS[ach.icon] || <Sparkles className="w-5 h-5 text-sky-400" />}
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      {ach.category}
                    </span>
                    <h3 className="text-base font-bold text-white">{ach.title}</h3>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold shrink-0">
                    +{ach.pointsReward} pts
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{ach.description}</p>

                {/* Progress bar */}
                <div className="w-full flex flex-col gap-1 mt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {Math.min(currentVal, ach.requirement)} / {ach.requirement}
                    </span>
                    <span className="font-semibold">{isUnlocked ? 'Completed' : `${pct}%`}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-850 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : 'bg-gradient-to-r from-sky-400 to-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
