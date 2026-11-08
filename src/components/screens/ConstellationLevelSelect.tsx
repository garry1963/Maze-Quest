import React from 'react';
import {
  ArrowLeft,
  Lock,
  Star,
  Sparkles,
  Play,
  Trophy,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { INITIAL_LEVELS } from '../../services/puzzleData';
import { ConstellationInfo, PuzzleDefinition } from '../../types/game';

interface ConstellationLevelSelectProps {
  constellation: ConstellationInfo;
  onBack: () => void;
}

export const ConstellationLevelSelect: React.FC<ConstellationLevelSelectProps> = ({
  constellation,
  onBack,
}) => {
  const { playPuzzle, userProgress, isLevelUnlocked } = useGame();

  const levels = INITIAL_LEVELS.filter(
    (l) => l.constellationId === constellation.id
  );

  const completedCount = levels.filter((l) => userProgress[l.id]?.completed).length;
  const starsEarned = levels.reduce(
    (sum, l) => sum + (userProgress[l.id]?.stars || 0),
    0
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            title="Return to constellations map"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Constellation {constellation.order}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 italic">
                {constellation.latinName}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {constellation.name}
            </h1>
          </div>
        </div>

        {/* Progress summary */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            <span>{completedCount} / 20 Solved</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{starsEarned} / 60 Stars</span>
          </div>
        </div>
      </div>

      {/* Mythology Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
        <p className="italic">{constellation.mythology}</p>
      </div>

      {/* 20 Levels Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {levels.map((puzzle) => {
          const unlocked = isLevelUnlocked(puzzle);
          const progress = userProgress[puzzle.id];
          const isDone = !!progress?.completed;
          const stars = progress?.stars || 0;

          return (
            <div
              key={puzzle.id}
              onClick={() => {
                if (unlocked) playPuzzle(puzzle);
              }}
              className={`relative rounded-2xl p-4 border flex flex-col justify-between transition-all duration-200 select-none ${
                unlocked
                  ? 'cursor-pointer bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-sky-500/60 shadow-md hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Card Top: Level Number & Star rating */}
              <div className="flex items-start justify-between">
                <span className="font-mono text-base font-bold text-white">
                  #{puzzle.levelNumber}
                </span>

                {unlocked ? (
                  isDone ? (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= stars
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  )
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>

              {/* Card Center: Badges */}
              <div className="my-3 flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-300 capitalize truncate">
                  {puzzle.geometry}
                  {puzzle.silhouette ? ` (${puzzle.silhouette})` : ''}
                </span>
                <span className="text-[10px] text-sky-400 capitalize truncate">
                  {puzzle.mode.replace('_', ' ')}
                </span>
              </div>

              {/* Card Bottom: Difficulty & Action indicator */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400 capitalize">
                  {puzzle.difficulty.replace('_', ' ')}
                </span>
                {unlocked && (
                  <span className="text-[10px] font-bold text-sky-400 flex items-center gap-0.5">
                    Play <Play className="w-2.5 h-2.5 fill-sky-400" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
