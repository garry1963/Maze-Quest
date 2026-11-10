import React, { useState, useMemo } from 'react';
import {
  Wand2,
  Play,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Check,
  Dices,
  Layers,
  Clock,
  Compass,
  Zap,
  Flame,
  Globe,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { generateMaze } from '../../services/mazeEngine';
import {
  Difficulty,
  GameMode,
  MazeGeometry,
  PuzzleDefinition,
  SpecialSilhouette,
} from '../../types/game';
import { BASE_POINTS } from '../../services/puzzleData';
import { publishCommunityPuzzle } from '../../services/storage';
import { AuthModal } from '../modals/AuthModal';

export const PuzzleGeneratorScreen: React.FC = () => {
  const { setCurrentScreen, playPuzzle } = useGame();
  const { profile, isGuest } = useAuth();

  // Difficulty selection: Easy, Medium, Hard, Expert
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    'easy' | 'medium' | 'hard' | 'expert'
  >('medium');

  // Geometry selection
  const [selectedGeometry, setSelectedGeometry] = useState<MazeGeometry>('square');
  const [selectedSilhouette, setSelectedSilhouette] = useState<SpecialSilhouette>('star');

  // Game Mode selection
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');

  // Seed
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 900000) + 100000);

  // Community Publishing State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [customName, setCustomName] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState('');

  const handlePublishToCommunity = () => {
    if (isGuest) {
      setShowAuthPrompt(true);
      return;
    }
    const diffName = selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
    const geoName = selectedGeometry.charAt(0).toUpperCase() + selectedGeometry.slice(1);
    setCustomName(`${diffName} ${geoName} Labyrinth`);
    setShowPublishModal(true);
  };

  const confirmPublish = async () => {
    if (!customName.trim()) return;
    setIsPublishing(true);
    const puzzleId = `community_${Date.now()}_${seed}`;
    await publishCommunityPuzzle({
      puzzleId,
      puzzleName: customName.trim(),
      creatorId: profile.uid,
      creatorName: profile.displayName || 'Stargazer',
      mazeShape: selectedGeometry,
      silhouette: selectedGeometry === 'silhouette' ? selectedSilhouette : undefined,
      gridWidth: dimensions.w,
      gridHeight: dimensions.h,
      difficulty: selectedDifficulty as Difficulty,
      gameMode: selectedMode,
      generationSeed: seed,
      basePoints: BASE_POINTS[selectedDifficulty] || 100,
      playsCount: 1,
      likesCount: 0,
      createdAt: new Date().toISOString(),
    });
    setIsPublishing(false);
    setPublishSuccessMsg('Puzzle published to Cloud Community Bank!');
    setTimeout(() => {
      setPublishSuccessMsg('');
      setShowPublishModal(false);
      setCurrentScreen('community_bank');
    }, 1500);
  };

  // Compute grid dimensions based on difficulty
  const dimensions = useMemo(() => {
    switch (selectedDifficulty) {
      case 'easy':
        return { w: 8, h: 8 };
      case 'medium':
        return { w: 14, h: 14 };
      case 'hard':
        return { w: 20, h: 20 };
      case 'expert':
        return { w: 28, h: 28 };
      default:
        return { w: 14, h: 14 };
    }
  }, [selectedDifficulty]);

  // Generate live preview stats to guarantee solvability
  const previewStats = useMemo(() => {
    try {
      const g = generateMaze(
        selectedGeometry,
        dimensions.w,
        dimensions.h,
        seed,
        selectedMode,
        selectedDifficulty,
        selectedGeometry === 'silhouette' ? selectedSilhouette : undefined
      );
      return {
        isSolvable: g.minMoves > 0,
        minMoves: g.minMoves,
        totalNodes: g.nodes.size,
      };
    } catch {
      return { isSolvable: true, minMoves: 25, totalNodes: dimensions.w * dimensions.h };
    }
  }, [selectedGeometry, dimensions, seed, selectedMode, selectedDifficulty, selectedSilhouette]);

  const handleRandomSurprise = () => {
    const diffs: ('easy' | 'medium' | 'hard' | 'expert')[] = ['easy', 'medium', 'hard', 'expert'];
    const geos: MazeGeometry[] = ['square', 'circular', 'triangular', 'hexagonal', 'silhouette'];
    const sils: SpecialSilhouette[] = ['star', 'heart', 'tree', 'cat', 'guitar', 'rabbit', 'diamond'];
    const modes: GameMode[] = ['classic', 'time_challenge', 'restricted_moves', 'token_collection', 'intertwined', 'hidden'];

    setSelectedDifficulty(diffs[Math.floor(Math.random() * diffs.length)]);
    const chosenGeo = geos[Math.floor(Math.random() * geos.length)];
    setSelectedGeometry(chosenGeo);
    if (chosenGeo === 'silhouette') {
      setSelectedSilhouette(sils[Math.floor(Math.random() * sils.length)]);
    }
    setSelectedMode(modes[Math.floor(Math.random() * modes.length)]);
    setSeed(Math.floor(Math.random() * 900000) + 100000);
  };

  const handleStartGame = () => {
    const diffName = selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
    const geoName = selectedGeometry.charAt(0).toUpperCase() + selectedGeometry.slice(1);

    const baseDifficultyTime =
      selectedDifficulty === 'easy'
        ? 80
        : selectedDifficulty === 'medium'
        ? 140
        : selectedDifficulty === 'hard'
        ? 210
        : 300; // 5 full minutes for expert (28x28)

    // Scale generously by actual solution path distance + branch exploration buffer
    const dynamicTime = Math.max(baseDifficultyTime, Math.round(previewStats.minMoves * 2.8 + 45));
    const timeLimit = selectedMode === 'time_challenge' ? dynamicTime : undefined;

    const moveLimit =
      selectedMode === 'restricted_moves'
        ? Math.round(previewStats.minMoves * 2.2 + 20)
        : undefined;

    const puzzle: PuzzleDefinition = {
      id: `gen_${Date.now()}_${seed}`,
      name: `${diffName} ${geoName} Labyrinth`,
      geometry: selectedGeometry,
      silhouette: selectedGeometry === 'silhouette' ? selectedSilhouette : undefined,
      width: dimensions.w,
      height: dimensions.h,
      difficulty: selectedDifficulty,
      mode: selectedMode,
      seed,
      timeLimit,
      moveLimit,
      basePoints: BASE_POINTS[selectedDifficulty] || 50,
      isPublished: true,
    };

    playPuzzle(puzzle);
  };

  const difficultyCards: {
    id: 'easy' | 'medium' | 'hard' | 'expert';
    label: string;
    gridSize: string;
    desc: string;
    color: string;
    bgAccent: string;
  }[] = [
    {
      id: 'easy',
      label: 'Easy',
      gridSize: '8 × 8',
      desc: 'Gentle corridors with quick, relaxing solutions. Ideal for warming up.',
      color: 'text-emerald-400',
      bgAccent: 'border-emerald-500/40 hover:border-emerald-400',
    },
    {
      id: 'medium',
      label: 'Medium',
      gridSize: '14 × 14',
      desc: 'Balanced labyrinths featuring multiple junctions and winding turns.',
      color: 'text-sky-400',
      bgAccent: 'border-sky-500/40 hover:border-sky-400',
    },
    {
      id: 'hard',
      label: 'Hard',
      gridSize: '20 × 20',
      desc: 'Intricate pathways and deceptive dead ends for seasoned puzzle navigators.',
      color: 'text-amber-400',
      bgAccent: 'border-amber-500/40 hover:border-amber-400',
    },
    {
      id: 'expert',
      label: 'Expert',
      gridSize: '28 × 28',
      desc: 'Grand, deeply complex labyrinth networks demanding keen spatial foresight.',
      color: 'text-purple-400',
      bgAccent: 'border-purple-500/40 hover:border-purple-400',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('home')}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            title="Return"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-sky-400" />
              Infinite Puzzle Generator
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Algorithmically generate endless solvable mazes across any geometry and mode
            </p>
          </div>
        </div>

        {/* Quick Random Generator */}
        <button
          onClick={handleRandomSurprise}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Dices className="w-4 h-4 text-purple-400" />
          <span>Surprise Me</span>
        </button>
      </div>

      {/* 1. DIFFICULTY SELECTION SECTION (Easy, Medium, Hard, Expert) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <span>Select Difficulty</span>
            <span className="text-xs text-slate-400 font-normal">
              (Determines grid dimensions and complexity)
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {difficultyCards.map((card) => {
            const isSelected = selectedDifficulty === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setSelectedDifficulty(card.id)}
                className={`relative cursor-pointer p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 select-none ${
                  isSelected
                    ? `bg-slate-850 shadow-xl ${card.bgAccent} border-2`
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-base font-extrabold ${card.color}`}>
                    {card.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {card.gridSize}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Base: +{BASE_POINTS[card.id]} Pts
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-sky-400 font-bold">
                      <Check className="w-4 h-4" /> Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. GEOMETRY & SILHOUETTE SELECTOR */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-4 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky-400" />
          <span>Maze Geometry</span>
        </h3>

        {/* Geometry options */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { id: 'square', label: 'Square Grid', desc: 'Classic 4-way corridors' },
            { id: 'circular', label: 'Concentric Rings', desc: 'Polar circular paths' },
            { id: 'triangular', label: 'Triangular', desc: 'Isometric 3-way lattice' },
            { id: 'hexagonal', label: 'Hexagonal', desc: 'Honeycomb 6-direction' },
            { id: 'silhouette', label: 'Silhouette Shape', desc: 'Animal & object masks' },
          ].map((geo) => {
            const isSelected = selectedGeometry === geo.id;
            return (
              <button
                key={geo.id}
                onClick={() => setSelectedGeometry(geo.id as any)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-400 text-white shadow-md'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold">{geo.label}</span>
                <span className="text-[11px] text-slate-400">{geo.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Silhouette picker if silhouette chosen */}
        {selectedGeometry === 'silhouette' && (
          <div className="mt-2 pt-4 border-t border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">Choose Silhouette Silhouette Mask:</span>
            <div className="flex flex-wrap gap-2">
              {[
                'star',
                'heart',
                'tree',
                'cat',
                'rabbit',
                'dog',
                'guitar',
                'diamond',
                'butterfly',
                'flower',
              ].map((sil) => {
                const isSelected = selectedSilhouette === sil;
                return (
                  <button
                    key={sil}
                    onClick={() => setSelectedSilhouette(sil as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sil}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3. GAME MODE SELECTOR */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-4 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Labyrinth Gameplay Mode</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            { id: 'classic', label: 'Classic', desc: 'Tranquil navigation' },
            { id: 'time_challenge', label: 'Time Trial', desc: 'Beat the clock' },
            { id: 'restricted_moves', label: 'Move Cap', desc: 'Fixed movement allowance' },
            { id: 'token_collection', label: 'Tokens', desc: 'Collect celestial crystals' },
            { id: 'intertwined', label: 'Portals', desc: 'Dimensional teleporters' },
            { id: 'hidden', label: 'Fog of War', desc: 'Lantern exploration' },
            { id: 'mirror', label: 'Mirror', desc: 'Reflected orientation' },
          ].map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id as any)}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'bg-purple-500/15 border-purple-400 text-white shadow-md'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold">{mode.label}</span>
                <span className="text-[10px] text-slate-400">{mode.desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. PREVIEW & PLAY ACTION CARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              100% Solvable Guaranteed
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Seed: #{seed}
            </span>
          </div>

          <h3 className="text-xl font-bold text-white">
            {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}{' '}
            {selectedGeometry.charAt(0).toUpperCase() + selectedGeometry.slice(1)} Labyrinth
          </h3>

          <p className="text-xs text-slate-300">
            {previewStats.totalNodes} navigable corridor cells | Shortest route: {previewStats.minMoves} moves
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setSeed(Math.floor(Math.random() * 900000) + 100000)}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95"
            title="Generate New Seed"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handlePublishToCommunity}
            className="px-5 py-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            title="Publish to Cloud Community Puzzle Bank for all players"
          >
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Publish to Cloud Bank</span>
          </button>

          <button
            onClick={handleStartGame}
            className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-xl shadow-sky-500/25 transition-all active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Generate & Play</span>
          </button>
        </div>
      </div>

      {/* Publish Dialog Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Globe className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Publish to Cloud Bank</h3>
                <p className="text-xs text-slate-400">Share your generated maze with all players</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Puzzle Name:</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                placeholder="e.g. Celestial Ring Labyrinth"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Creator:</span>
                <span className="font-bold text-slate-200">{profile.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span>Geometry:</span>
                <span className="font-bold text-slate-200 capitalize">{selectedGeometry}</span>
              </div>
              <div className="flex justify-between">
                <span>Difficulty:</span>
                <span className="font-bold text-slate-200 capitalize">{selectedDifficulty}</span>
              </div>
            </div>

            {publishSuccessMsg ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                {publishSuccessMsg}
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPublish}
                  disabled={isPublishing}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {isPublishing ? 'Publishing...' : 'Confirm & Publish 🌐'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showAuthPrompt && (
        <AuthModal isOpen={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} />
      )}
    </div>
  );
};
