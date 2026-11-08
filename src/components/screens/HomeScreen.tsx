import React, { useState } from 'react';
import {
  Play,
  Sparkles,
  Compass,
  Calendar,
  Layers,
  Trophy,
  Star,
  ChevronRight,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Dices,
  Wand2,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import {
  CONSTELLATIONS,
  INITIAL_LEVELS,
  BASE_POINTS,
  getDailyChallenge,
  getWeeklyChallenge,
} from '../../services/puzzleData';
import { GameMode, MazeGeometry, PuzzleDefinition } from '../../types/game';
import { AuthModal } from '../modals/AuthModal';

export const HomeScreen: React.FC = () => {
  const {
    setCurrentScreen,
    setSelectedConstellation,
    playPuzzle,
    userProgress,
    totalStars,
    totalPoints,
    completedCount,
  } = useGame();
  const { isGuest, profile } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // Find next unfinished puzzle in user's current constellation
  const findContinuePuzzle = () => {
    for (const lvl of INITIAL_LEVELS) {
      if (!userProgress[lvl.id]?.completed) {
        return lvl;
      }
    }
    return INITIAL_LEVELS[0];
  };

  const continuePuzzle = findContinuePuzzle();

  // Find current constellation info
  const currentConstellation =
    CONSTELLATIONS.find((c) => c.id === continuePuzzle.constellationId) || CONSTELLATIONS[0];

  const handleRandomQuickPlay = () => {
    const randomLevel = INITIAL_LEVELS[Math.floor(Math.random() * INITIAL_LEVELS.length)];
    playPuzzle(randomLevel);
  };

  const handleQuickGenerate = (diff: 'easy' | 'medium' | 'hard' | 'expert') => {
    const seed = Math.floor(Math.random() * 900000) + 100000;
    const dims = {
      easy: { w: 8, h: 8 },
      medium: { w: 14, h: 14 },
      hard: { w: 20, h: 20 },
      expert: { w: 28, h: 28 },
    }[diff];

    const diffLabel = diff.charAt(0).toUpperCase() + diff.slice(1);
    const puzzle: PuzzleDefinition = {
      id: `gen_${Date.now()}_${seed}`,
      name: `${diffLabel} Labyrinth`,
      geometry: 'square',
      width: dims.w,
      height: dims.h,
      difficulty: diff,
      mode: 'classic',
      seed,
      basePoints: BASE_POINTS[diff] || 50,
      isPublished: true,
    };

    playPuzzle(puzzle);
  };

  const modesList: { mode: GameMode; title: string; desc: string; icon: string }[] = [
    { mode: 'classic', title: 'Classic Maze', desc: 'No time limits, tranquil exploration', icon: 'Compass' },
    { mode: 'time_challenge', title: 'Time Challenge', desc: 'Beat the clock for extra stars', icon: 'Clock' },
    { mode: 'restricted_moves', title: 'Restricted Moves', desc: 'Plan your route with precision', icon: 'Zap' },
    { mode: 'token_collection', title: 'Token Collection', desc: 'Gather all celestial orbs to unlock exit', icon: 'Sparkles' },
    { mode: 'intertwined', title: 'Intertwined Mazes', desc: 'Teleportation portals connecting zones', icon: 'Layers' },
    { mode: 'hidden', title: 'Hidden Fog Maze', desc: 'Illuminate the labyrinth as you explore', icon: 'EyeOff' },
    { mode: 'mirror', title: 'Mirror Maze', desc: 'Inverted coordinates challenge your spatial mind', icon: 'Repeat' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-10 flex flex-col gap-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl flex flex-col items-start gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Relaxing Celestial Labyrinths</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
            Journey Through the <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">Constellations</span>
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Glide your glowing light through intricate mazes across 10 celestial realms.
            Experience circular, triangular, hexagonal and silhouette labyrinths with soothing ambient harmonies.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => playPuzzle(continuePuzzle)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm md:text-base flex items-center gap-2.5 shadow-xl shadow-sky-500/25 transition-all active:scale-[0.98]"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Continue Level {continuePuzzle.levelNumber}</span>
            </button>

            <button
              onClick={() => setCurrentScreen('generator')}
              className="px-5 py-3.5 rounded-2xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-purple-900/20"
            >
              <Wand2 className="w-4 h-4 text-purple-400" />
              <span>Puzzle Generator</span>
            </button>

            <button
              onClick={() => setCurrentScreen('constellations')}
              className="px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Constellation Map</span>
            </button>

            <button
              onClick={handleRandomQuickPlay}
              className="px-4 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-sm flex items-center gap-2 transition-all"
              title="Quick Random Labyrinth"
            >
              <Dices className="w-4 h-4" />
              <span className="hidden sm:inline">Random</span>
            </button>
          </div>
        </div>
      </section>

      {/* Guest Mode Notice Banner */}
      {isGuest && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs md:text-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Playing in Guest Mode</p>
              <p className="text-slate-400">Sign in to save your celestial stars to the cloud and compete on global leaderboards.</p>
            </div>
          </div>
          <button
            onClick={() => setAuthOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all shrink-0 ml-3"
          >
            Create Account
          </button>
        </div>
      )}

      {/* Overview Stats & Daily/Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Constellation Progress Card */}
        <div
          onClick={() => {
            setSelectedConstellation(currentConstellation);
            setCurrentScreen('level_select');
          }}
          className="group cursor-pointer rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Current Star Realm</span>
              <span className="text-xs font-mono text-slate-400">
                Level {continuePuzzle.levelNumber}/20
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
              {currentConstellation.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {currentConstellation.mythology}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{totalStars} Stars Collected</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Daily Maze Challenge Card */}
        <div
          onClick={() => setCurrentScreen('daily_challenge')}
          className="group cursor-pointer rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950/30 to-slate-900 border border-sky-900/40 hover:border-sky-500/40 p-5 flex flex-col justify-between transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                Daily Labyrinth
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                2X Points
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
              Today's Challenge
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Synchronized global maze puzzle refreshed every day at 00:00 UTC.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>Play Daily Challenge</span>
            <ChevronRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Weekly Master Maze Challenge Card */}
        <div
          onClick={() => setCurrentScreen('weekly_challenge')}
          className="group cursor-pointer rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border border-purple-900/40 hover:border-purple-500/40 p-5 flex flex-col justify-between transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                Weekly Master
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                300 Pts
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
              Silhouette Star Maze
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Special geometry with dimensional teleportation portals.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-300 font-medium">
            <span>Enter Weekly Labyrinth</span>
            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Infinite Puzzle Generator Section with Easy, Medium, Hard, Expert options */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/30 border border-slate-800 p-6 md:p-8 flex flex-col gap-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Procedural Labyrinths</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Infinite Puzzle Generator
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
              Endless procedurally generated mazes with guaranteed solvable pathways. Select a difficulty below to start instantly.
            </p>
          </div>

          <button
            onClick={() => setCurrentScreen('generator')}
            className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto shrink-0"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Advanced Customizer</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* 4 Difficulty Options: Easy, Medium, Hard, Expert */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* EASY */}
          <div className="rounded-2xl bg-slate-950/70 border border-emerald-500/30 hover:border-emerald-500/60 p-5 flex flex-col justify-between gap-4 transition-all group">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-emerald-400">Easy</span>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  8 × 8
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gentle corridors and fast, tranquil solutions. Ideal for relaxing sessions.
              </p>
            </div>

            <button
              onClick={() => handleQuickGenerate('easy')}
              className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-400" />
              <span>Play Easy (8×8)</span>
            </button>
          </div>

          {/* MEDIUM */}
          <div className="rounded-2xl bg-slate-950/70 border border-sky-500/30 hover:border-sky-500/60 p-5 flex flex-col justify-between gap-4 transition-all group">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-sky-400">Medium</span>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  14 × 14
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Balanced labyrinths featuring multiple junctions and rewarding winding turns.
              </p>
            </div>

            <button
              onClick={() => handleQuickGenerate('medium')}
              className="w-full py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-sky-400" />
              <span>Play Medium (14×14)</span>
            </button>
          </div>

          {/* HARD */}
          <div className="rounded-2xl bg-slate-950/70 border border-amber-500/30 hover:border-amber-500/60 p-5 flex flex-col justify-between gap-4 transition-all group">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-amber-400">Hard</span>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  20 × 20
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Intricate pathways and deceptive dead ends designed for seasoned navigators.
              </p>
            </div>

            <button
              onClick={() => handleQuickGenerate('hard')}
              className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-amber-400" />
              <span>Play Hard (20×20)</span>
            </button>
          </div>

          {/* EXPERT */}
          <div className="rounded-2xl bg-slate-950/70 border border-purple-500/30 hover:border-purple-500/60 p-5 flex flex-col justify-between gap-4 transition-all group">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-purple-400">Expert</span>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  28 × 28
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Expansive labyrinth networks with deep complexity demanding spatial foresight.
              </p>
            </div>

            <button
              onClick={() => handleQuickGenerate('expert')}
              className="w-full py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-purple-400" />
              <span>Play Expert (28×28)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7 Game Modes Carousel / Grid */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Explore 7 Game Modes</h2>
            <p className="text-xs text-slate-400">Varied labyrinth mechanics designed for relaxation and intellectual intrigue</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {modesList.map((m) => {
            // Find a level matching this mode
            const sampleLevel = INITIAL_LEVELS.find((l) => l.mode === m.mode) || INITIAL_LEVELS[0];
            return (
              <div
                key={m.mode}
                onClick={() => playPuzzle(sampleLevel)}
                className="group cursor-pointer p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors flex items-center justify-between">
                    <span>{m.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">{m.desc}</p>
                </div>
                <div className="mt-3 pt-2 text-[11px] font-medium text-sky-400 flex items-center gap-1">
                  <span>Try Mode</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Geometries & Special Silhouettes Showcase */}
      <section className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Multiple Geometries</span>
          <h3 className="text-xl font-bold text-white mt-1">From Classic Grids to Animals & Stars</h3>
          <p className="text-xs md:text-sm text-slate-400 mt-2">
            Experience square, concentric circular rings, triangular isometric paths, hexagonal honeycombs, and 10 iconic silhouettes: Rabbit, Cat, Dog, Tree, Guitar, Heart, Star, Butterfly, Flower, and Diamond.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {['Square', 'Circular', 'Triangular', 'Hexagonal', 'Heart', 'Star', 'Tree', 'Cat', 'Guitar'].map((shape) => (
            <span
              key={shape}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-200"
            >
              {shape}
            </span>
          ))}
        </div>
      </section>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};
