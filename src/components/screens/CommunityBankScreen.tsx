import React, { useEffect, useState } from 'react';
import {
  Globe,
  Search,
  Filter,
  Play,
  User,
  Clock,
  Compass,
  Sparkles,
  Wand2,
  Calendar,
  Layers,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { CommunityPuzzleData, deleteCommunityPuzzle, fetchCommunityPuzzles } from '../../services/storage';
import { Difficulty, GameMode, MazeGeometry, PuzzleDefinition } from '../../types/game';

export const CommunityBankScreen: React.FC = () => {
  const { setCurrentScreen, playPuzzle } = useGame();
  const { user, profile, isAdmin, isGuest } = useAuth();

  const [puzzles, setPuzzles] = useState<CommunityPuzzleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeo, setSelectedGeo] = useState<string>('all');
  const [selectedDiff, setSelectedDiff] = useState<string>('all');
  const [myPuzzlesOnly, setMyPuzzlesOnly] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const loadPuzzles = async () => {
    setLoading(true);
    const data = await fetchCommunityPuzzles();
    setPuzzles(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPuzzles();
  }, []);

  const handleDelete = async (puzzleId: string) => {
    if (window.confirm('Are you sure you want to remove this puzzle from the community bank?')) {
      await deleteCommunityPuzzle(puzzleId);
      setPuzzles((prev) => prev.filter((p) => p.puzzleId !== puzzleId));
      setStatusMsg('Puzzle removed from community bank.');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handlePlayCommunityPuzzle = (cp: CommunityPuzzleData) => {
    const puzzleDef: PuzzleDefinition = {
      id: cp.puzzleId,
      name: cp.puzzleName,
      geometry: cp.mazeShape as MazeGeometry,
      silhouette: cp.silhouette as any,
      width: cp.gridWidth,
      height: cp.gridHeight,
      difficulty: cp.difficulty as Difficulty,
      mode: cp.gameMode as GameMode,
      seed: cp.generationSeed,
      timeLimit: cp.timeLimit,
      moveLimit: cp.moveLimit,
      basePoints: cp.basePoints || 250,
      isPublished: true,
    };
    playPuzzle(puzzleDef);
  };

  // Filtering
  const filteredPuzzles = puzzles.filter((p) => {
    if (myPuzzlesOnly && p.creatorId !== profile.uid) return false;
    if (selectedGeo !== 'all' && p.mazeShape !== selectedGeo) return false;
    if (selectedDiff !== 'all' && p.difficulty !== selectedDiff) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.puzzleName.toLowerCase().includes(q);
      const matchCreator = p.creatorName.toLowerCase().includes(q);
      if (!matchName && !matchCreator) return false;
    }
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('home')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            title="Return Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Globe className="w-7 h-7 text-sky-400 animate-pulse" />
              <span>Cloud Community Puzzle Bank</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Browse, play, and share procedurally generated maze labyrinths with players worldwide
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPuzzles}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-sky-400 transition-all active:scale-95"
            title="Refresh Community Bank"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setCurrentScreen('generator')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-95"
          >
            <Wand2 className="w-4 h-4" />
            <span>Create & Publish Puzzle</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by puzzle name or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-sky-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedGeo}
            onChange={(e) => setSelectedGeo(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 outline-none"
          >
            <option value="all">All Geometries</option>
            <option value="square">Square Grid</option>
            <option value="circular">Circular Rings</option>
            <option value="triangular">Triangular</option>
            <option value="hexagonal">Hexagonal</option>
            <option value="silhouette">Silhouettes</option>
          </select>

          <select
            value={selectedDiff}
            onChange={(e) => setSelectedDiff(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>

          {!isGuest && (
            <button
              onClick={() => setMyPuzzlesOnly(!myPuzzlesOnly)}
              className={`px-3 py-2 rounded-xl font-semibold border transition-all ${
                myPuzzlesOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              My Published ({puzzles.filter((p) => p.creatorId === profile.uid).length})
            </button>
          )}
        </div>
      </div>

      {/* Grid of Community Puzzles */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-sm font-medium">Fetching cloud community puzzles...</p>
        </div>
      ) : filteredPuzzles.length === 0 ? (
        <div className="py-16 p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-center flex flex-col items-center justify-center gap-3">
          <Globe className="w-12 h-12 text-slate-600" />
          <h3 className="text-lg font-bold text-white">No Community Puzzles Found</h3>
          <p className="text-xs text-slate-400 max-w-md">
            {myPuzzlesOnly
              ? "You haven't published any custom puzzles yet. Generate a maze and click 'Publish to Community Bank'!"
              : 'Be the first to publish a custom maze puzzle to the Cloud Community Bank!'}
          </p>
          <button
            onClick={() => setCurrentScreen('generator')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs transition-all shadow-md active:scale-95"
          >
            Go to Puzzle Generator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPuzzles.map((cp) => {
            const isOwner = cp.creatorId === profile.uid;
            return (
              <div
                key={cp.puzzleId}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col justify-between gap-4 shadow-xl hover:shadow-sky-500/5 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[10px] font-extrabold uppercase tracking-wider">
                      {cp.mazeShape}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold capitalize">
                      {cp.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                    {cp.puzzleName}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>By <strong className="text-slate-300">{cp.creatorName || 'Stargazer'}</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span>{cp.gridWidth}×{cp.gridHeight}</span>
                    <span>•</span>
                    <span className="capitalize">{cp.gameMode.replace('_', ' ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={() => handleDelete(cp.puzzleId)}
                        className="p-2 rounded-xl bg-slate-950 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Delete Puzzle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handlePlayCommunityPuzzle(cp)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
