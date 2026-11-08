import React from 'react';
import {
  Sparkles,
  Lock,
  Star,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Trophy,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { CONSTELLATIONS, INITIAL_LEVELS } from '../../services/puzzleData';
import { ConstellationInfo } from '../../types/game';

export const ConstellationMap: React.FC = () => {
  const {
    setCurrentScreen,
    setSelectedConstellation,
    isConstellationUnlocked,
    totalStars,
    userProgress,
  } = useGame();

  const handleSelect = (constellation: ConstellationInfo) => {
    if (isConstellationUnlocked(constellation)) {
      setSelectedConstellation(constellation);
      setCurrentScreen('level_select');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('home')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              Celestial Constellations
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1 pl-10">
            Journey through 10 star formations. Earn stars to illuminate cosmic paths and unlock advanced realms.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-bold text-white">{totalStars} Total Stars</span>
        </div>
      </div>

      {/* 10 Constellation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CONSTELLATIONS.map((constellation) => {
          const unlocked = isConstellationUnlocked(constellation);
          
          // Calculate completed levels for this constellation
          const constellationLevels = INITIAL_LEVELS.filter(
            (l) => l.constellationId === constellation.id
          );
          const completedLevels = constellationLevels.filter(
            (l) => userProgress[l.id]?.completed
          ).length;
          const starsEarned = constellationLevels.reduce(
            (sum, l) => sum + (userProgress[l.id]?.stars || 0),
            0
          );
          const isFinished = completedLevels === constellation.totalLevels;
          const pct = Math.round((completedLevels / constellation.totalLevels) * 100);

          return (
            <div
              key={constellation.id}
              onClick={() => handleSelect(constellation)}
              className={`relative group rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                unlocked
                  ? 'cursor-pointer bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-sky-500/50 shadow-lg hover:shadow-sky-500/10'
                  : 'bg-slate-950/60 border-slate-900 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Starry Mini Sky Canvas (SVG) */}
              <div className="relative w-full h-44 bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-850">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full p-4 pointer-events-none"
                >
                  {/* Constellation Connection Lines */}
                  {constellation.connections.map(([a, b], idx) => {
                    const ptA = constellation.starsCoordinates[a];
                    const ptB = constellation.starsCoordinates[b];
                    if (!ptA || !ptB) return null;
                    return (
                      <line
                        key={idx}
                        x1={ptA.x}
                        y1={ptA.y}
                        x2={ptB.x}
                        y2={ptB.y}
                        stroke={unlocked ? (isFinished ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)') : 'rgba(100, 116, 139, 0.2)'}
                        strokeWidth="1.2"
                        strokeDasharray={isFinished ? 'none' : '2,2'}
                      />
                    );
                  })}

                  {/* Stars in Constellation */}
                  {constellation.starsCoordinates.map((coord, sIdx) => {
                    const lvlId = `lvl_${constellation.order}_${sIdx + 1}`;
                    const isStarDone = userProgress[lvlId]?.completed;
                    return (
                      <g key={sIdx}>
                        {/* Glow halo */}
                        {isStarDone && (
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r="3"
                            fill="rgba(56, 189, 248, 0.5)"
                          />
                        )}
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r={isStarDone ? 1.8 : 1.2}
                          fill={
                            isStarDone
                              ? '#facc15'
                              : unlocked
                              ? '#94a3b8'
                              : '#475569'
                          }
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Lock Overlay if locked */}
                {!unlocked && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Lock className="w-6 h-6 text-slate-500" />
                    <span className="text-xs font-semibold tracking-wider">
                      Requires {constellation.requiredStars} Stars
                    </span>
                  </div>
                )}

                {/* Completed Badge */}
                {isFinished && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-amber-400" />
                    <span>Completed</span>
                  </div>
                )}
              </div>

              {/* Card Footer Details */}
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">
                      Realm {constellation.order}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                      {constellation.name}
                    </h3>
                    <p className="text-xs text-slate-400 italic">
                      {constellation.latinName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{starsEarned}/60</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {constellation.mythology}
                </p>

                {/* Progress bar */}
                <div className="w-full flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {completedLevels} of {constellation.totalLevels} levels solved
                    </span>
                    <span className="font-semibold text-slate-200">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-850 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-500"
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
