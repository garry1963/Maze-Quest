import React from 'react';
import { Star, Trophy, Clock, ArrowRight, RotateCcw, Compass, Sparkles } from 'lucide-react';
import { PuzzleDefinition } from '../../types/game';

interface LevelCompleteModalProps {
  puzzle: PuzzleDefinition;
  stars: number;
  points: number;
  timeTaken: number;
  movesTaken: number;
  isNewRecord: boolean;
  unlockedConstellation?: string;
  onNext: () => void;
  onReplay: () => void;
  onReturnToMap: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  puzzle,
  stars,
  points,
  timeTaken,
  movesTaken,
  isNewRecord,
  unlockedConstellation,
  onNext,
  onReplay,
  onReturnToMap,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center flex flex-col items-center">
        {/* Constellation completion banner if triggered */}
        {unlockedConstellation && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-4 h-4 animate-spin" />
            Constellation Completed!
          </div>
        )}

        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
          Labyrinth Solved!
        </h2>
        <p className="text-sm text-slate-400 mb-6">{puzzle.name}</p>

        {/* 3 Stars display */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2, 3].map((s) => {
            const isEarned = s <= stars;
            return (
              <div
                key={s}
                className={`relative p-3 rounded-2xl transition-all duration-500 ${
                  isEarned
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 scale-110 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800/50 text-slate-600 border border-slate-800'
                }`}
              >
                <Star
                  className={`w-8 h-8 ${isEarned ? 'fill-amber-400 text-amber-400' : ''}`}
                />
              </div>
            );
          })}
        </div>

        {/* Stats grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Time
            </div>
            <span className="text-lg font-bold text-white font-mono">
              {timeTaken.toFixed(1)}s
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Moves
            </div>
            <span className="text-lg font-bold text-white font-mono">{movesTaken}</span>
          </div>

          <div className="col-span-2 bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-pink-500/10 border border-sky-500/20 rounded-2xl p-3 flex items-center justify-between px-5">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Trophy className="w-4 h-4 text-amber-400" />
              Points Earned
            </div>
            <div className="flex items-center gap-2">
              {isNewRecord && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  New Best
                </span>
              )}
              <span className="text-xl font-extrabold text-sky-400">+{points}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onNext}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all active:scale-[0.98]"
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
        </div>
      </div>
    </div>
  );
};
