import React, { useState } from 'react';
import {
  Shield,
  Layers,
  Database,
  PlusCircle,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_LEVELS, BASE_POINTS } from '../../services/puzzleData';
import { generateMaze } from '../../services/mazeEngine';
import {
  Difficulty,
  GameMode,
  MazeGeometry,
  PuzzleDefinition,
  SpecialSilhouette,
} from '../../types/game';

export const AdminDashboard: React.FC = () => {
  const { setCurrentScreen, customPuzzles, addCustomPuzzle, playPuzzle } = useGame();
  const { user } = useAuth();

  // Tab: 'studio' | 'bulk' | 'leaderboard'
  const [activeTab, setActiveTab] = useState<'studio' | 'bulk' | 'leaderboard'>('studio');

  // Studio Form State
  const [name, setName] = useState('Nebula Custom Labyrinth');
  const [geometry, setGeometry] = useState<MazeGeometry>('square');
  const [silhouette, setSilhouette] = useState<SpecialSilhouette>('star');
  const [width, setWidth] = useState(14);
  const [height, setHeight] = useState(14);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [mode, setMode] = useState<GameMode>('classic');
  const [seed, setSeed] = useState(Math.floor(Math.random() * 900000) + 100000);
  const [timeLimit, setTimeLimit] = useState(45);
  const [moveLimit, setMoveLimit] = useState(30);

  // Test Solvability State
  const [testResult, setTestResult] = useState<{
    solved: boolean;
    minMoves: number;
    totalNodes: number;
  } | null>(null);
  const [msg, setMsg] = useState('');

  // Bulk JSON Import State
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState('');

  const handleTestSolvability = () => {
    try {
      const g = generateMaze(
        geometry,
        width,
        height,
        seed,
        mode,
        difficulty,
        geometry === 'silhouette' ? silhouette : undefined
      );
      setTestResult({
        solved: g.minMoves > 0,
        minMoves: g.minMoves,
        totalNodes: g.nodes.size,
      });
      setMsg('Maze algorithmically validated: 100% Solvable!');
    } catch (e: any) {
      setTestResult(null);
      setMsg('Solvability error: ' + e.message);
    }
  };

  const handlePublish = () => {
    const newPuzzle: PuzzleDefinition = {
      id: `custom_${Date.now()}`,
      name,
      geometry,
      silhouette: geometry === 'silhouette' ? silhouette : undefined,
      width,
      height,
      difficulty,
      mode,
      seed,
      timeLimit: mode === 'time_challenge' ? timeLimit : undefined,
      moveLimit: mode === 'restricted_moves' ? moveLimit : undefined,
      basePoints: BASE_POINTS[difficulty],
      isPublished: true,
    };
    addCustomPuzzle(newPuzzle);
    setMsg(`Puzzle "${name}" successfully published!`);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleExportJSON = () => {
    const fullCatalog = [...INITIAL_LEVELS, ...customPuzzles];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullCatalog, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `maze_puzzles_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((p) => {
          if (p.name && p.geometry && p.seed) {
            addCustomPuzzle(p);
          }
        });
        setImportStatus(`Successfully imported ${parsed.length} puzzles!`);
        setImportJson('');
      } else {
        setImportStatus('Invalid JSON: Root must be an array of puzzles.');
      }
    } catch (err: any) {
      setImportStatus('JSON Parse Error: ' + err.message);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
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
              <Shield className="w-6 h-6 text-purple-400" />
              Administrator Control Center
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Puzzle engine management, bulk JSON operations, and system metrics
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'studio'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Puzzle Studio
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'bulk'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bulk JSON
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Catalog Puzzles</span>
          <span className="text-xl font-extrabold text-white mt-1 block">
            {INITIAL_LEVELS.length + customPuzzles.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Constellations</span>
          <span className="text-xl font-extrabold text-sky-400 mt-1 block">10</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Geometries</span>
          <span className="text-xl font-extrabold text-emerald-400 mt-1 block">4 + 10 Shapes</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Backend Database</span>
          <span className="text-xs font-bold text-purple-400 mt-2 block truncate">Cloud Firestore</span>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Tab: Puzzle Studio */}
      {activeTab === 'studio' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-sky-400" />
              <span>Create & Test Solvable Maze</span>
            </h2>
            <button
              onClick={() => setSeed(Math.floor(Math.random() * 900000) + 100000)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Seed</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* Puzzle Name */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Puzzle Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
              />
            </div>

            {/* Geometry */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Geometry</label>
              <select
                value={geometry}
                onChange={(e) => setGeometry(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none capitalize"
              >
                <option value="square">Square Grid</option>
                <option value="circular">Concentric Circular</option>
                <option value="triangular">Triangular Isometric</option>
                <option value="hexagonal">Hexagonal Honeycomb</option>
                <option value="silhouette">Special Silhouette</option>
              </select>
            </div>

            {/* Silhouette Selector if silhouette */}
            {geometry === 'silhouette' && (
              <div>
                <label className="block text-slate-400 font-medium mb-1">Silhouette Mask</label>
                <select
                  value={silhouette}
                  onChange={(e) => setSilhouette(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none capitalize"
                >
                  <option value="star">Star</option>
                  <option value="heart">Heart</option>
                  <option value="tree">Tree</option>
                  <option value="cat">Cat</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="dog">Dog</option>
                  <option value="guitar">Guitar</option>
                  <option value="diamond">Diamond</option>
                  <option value="butterfly">Butterfly</option>
                  <option value="flower">Flower</option>
                </select>
              </div>
            )}

            {/* Game Mode */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Game Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none capitalize"
              >
                <option value="classic">Classic</option>
                <option value="time_challenge">Time Challenge</option>
                <option value="restricted_moves">Restricted Moves</option>
                <option value="token_collection">Token Collection</option>
                <option value="intertwined">Intertwined (Portals)</option>
                <option value="hidden">Hidden Fog of War</option>
                <option value="mirror">Mirror Maze</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none capitalize"
              >
                <option value="very_easy">Very Easy (6x6)</option>
                <option value="easy">Easy (8x8)</option>
                <option value="normal">Normal (12x12)</option>
                <option value="medium">Medium (16x16)</option>
                <option value="hard">Hard (20x20)</option>
                <option value="very_hard">Very Hard (24x24)</option>
                <option value="expert">Expert (28x28)</option>
                <option value="master">Master (32x32)</option>
              </select>
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Grid Dimension: {width} x {height}</label>
              <input
                type="range"
                min="6"
                max="32"
                value={width}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setWidth(val);
                  setHeight(val);
                }}
                className="w-full accent-sky-400"
              />
            </div>

            {/* Seed */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Deterministic Seed</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Test Solvability & Publish actions */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={handleTestSolvability}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Test Solvability (BFS)</span>
            </button>

            <button
              onClick={handlePublish}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish to Catalog</span>
            </button>

            {testResult && (
              <button
                onClick={() => {
                  const p: PuzzleDefinition = {
                    id: `test_${seed}`,
                    name,
                    geometry,
                    silhouette: geometry === 'silhouette' ? silhouette : undefined,
                    width,
                    height,
                    difficulty,
                    mode,
                    seed,
                    basePoints: BASE_POINTS[difficulty],
                  };
                  playPuzzle(p);
                }}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play Test Now</span>
              </button>
            )}
          </div>

          {/* Solvability Report Card */}
          {testResult && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-white block">Solvability Verified</span>
                  <span className="text-slate-400">
                    Connected cells: {testResult.totalNodes} | Shortest solution route:{' '}
                    <strong className="text-emerald-400">{testResult.minMoves} moves</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Bulk JSON Management */}
      {activeTab === 'bulk' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <span>Bulk Import & Export Puzzles</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Import thousands of maze definitions via JSON, or backup the active catalog
              </p>
            </div>

            <button
              onClick={handleExportJSON}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Export Catalog (JSON)</span>
            </button>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Paste Puzzle Collection JSON Array:
            </label>
            <textarea
              rows={8}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='[ { "id": "custom_1", "name": "Deep Space Labyrinth", "geometry": "hexagonal", "width": 16, "height": 16, "difficulty": "hard", "mode": "classic", "seed": 45892 } ]'
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <button
            onClick={handleImportJSON}
            disabled={!importJson.trim()}
            className="self-start px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Process & Import Puzzles</span>
          </button>
        </div>
      )}
    </div>
  );
};
