import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ArrowLeft,
  Clock,
  Compass,
  Eye,
  EyeOff,
  Flame,
  HelpCircle,
  Lightbulb,
  Moon,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Gamepad2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MazeCanvas } from './MazeCanvas';
import { generateMaze } from '../../services/mazeEngine';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../services/audio';
import { LevelCompleteModal } from '../modals/LevelCompleteModal';
import { PuzzleDefinition } from '../../types/game';

interface GameScreenProps {
  puzzle: PuzzleDefinition;
  onBack: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ puzzle, onBack }) => {
  const {
    activeTheme,
    handleLevelComplete,
    getNextLevel,
    playPuzzle,
    setCurrentScreen,
  } = useGame();
  const { profile, updateMovementMode } = useAuth();

  // Timer & Moves state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [collectedTokens, setCollectedTokens] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.sfxEnabled);
  const [isFailed, setIsFailed] = useState(false);
  const [showDPad, setShowDPad] = useState(() => {
    if (typeof window !== 'undefined') {
      return 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    }
    return false;
  });
  const controllerRef = useRef<((dir: 'up' | 'down' | 'left' | 'right') => void) | null>(null);

  // Victory modal state
  const [completedStats, setCompletedStats] = useState<{
    stars: number;
    points: number;
    isNewRecord: boolean;
    unlockedConstellation?: string;
  } | null>(null);

  // Build the deterministic solvable maze graph
  const graph = useMemo(() => {
    return generateMaze(
      puzzle.geometry,
      puzzle.width,
      puzzle.height,
      puzzle.seed,
      puzzle.mode,
      puzzle.difficulty,
      puzzle.silhouette
    );
  }, [puzzle]);

  const totalTokens = graph.collectibles?.length || 0;

  // Reset level state on puzzle change
  useEffect(() => {
    setElapsedSeconds(0);
    setMovesCount(0);
    setCollectedTokens(0);
    setShowHint(false);
    setIsPaused(false);
    setIsFailed(false);
    setCompletedStats(null);
  }, [puzzle.id]);

  // Timer loop
  useEffect(() => {
    if (completedStats || isPaused || isFailed) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Check Time Challenge failure
        if (puzzle.mode === 'time_challenge' && puzzle.timeLimit) {
          if (next >= puzzle.timeLimit) {
            setIsFailed(true);
            soundManager.playBump();
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [completedStats, isPaused, isFailed, puzzle]);

  // Handle Move
  const handleMove = (newMoves: number) => {
    setMovesCount(newMoves);
    // Check Restricted Moves mode failure
    if (puzzle.mode === 'restricted_moves' && puzzle.moveLimit) {
      if (newMoves > puzzle.moveLimit) {
        setIsFailed(true);
        soundManager.playBump();
      }
    }
  };

  // Exit reached
  const handleExitReached = () => {
    if (completedStats || isFailed) return;
    const res = handleLevelComplete(
      puzzle,
      elapsedSeconds,
      movesCount,
      collectedTokens,
      totalTokens
    );
    setCompletedStats({
      stars: res.starsAwarded,
      points: res.pointsEarned,
      isNewRecord: res.isNewRecord,
      unlockedConstellation: res.unlockedConstellation,
    });
  };

  const handleRestart = () => {
    setElapsedSeconds(0);
    setMovesCount(0);
    setCollectedTokens(0);
    setShowHint(false);
    setIsFailed(false);
    setCompletedStats(null);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSfxEnabled(next);
    soundManager.setMusicEnabled(next);
  };

  const nextPuzzle = getNextLevel(puzzle);

  return (
    <div
      className="relative w-full min-h-screen flex flex-col items-center justify-between p-3 md:p-6 transition-colors duration-500"
      style={{ backgroundColor: activeTheme.bgDark }}
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all active:scale-95"
            title="Return"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white tracking-wide">
              {puzzle.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 capitalize">
              <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50">
                {puzzle.geometry}
                {puzzle.silhouette ? ` (${puzzle.silhouette})` : ''}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50">
                {puzzle.mode.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Time Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs md:text-sm font-mono text-slate-200">
            <Clock className="w-4 h-4 text-sky-400" />
            {puzzle.mode === 'time_challenge' && puzzle.timeLimit ? (
              <span
                className={
                  puzzle.timeLimit - elapsedSeconds <= 10
                    ? 'text-rose-400 font-bold animate-pulse'
                    : ''
                }
              >
                {Math.max(0, puzzle.timeLimit - elapsedSeconds)}s
              </span>
            ) : (
              <span>{elapsedSeconds}s</span>
            )}
          </div>

          {/* Moves Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs md:text-sm font-mono text-slate-200">
            <Compass className="w-4 h-4 text-emerald-400" />
            {puzzle.mode === 'restricted_moves' && puzzle.moveLimit ? (
              <span
                className={
                  puzzle.moveLimit - movesCount <= 5
                    ? 'text-rose-400 font-bold animate-pulse'
                    : ''
                }
              >
                {Math.max(0, puzzle.moveLimit - movesCount)} left
              </span>
            ) : (
              <span>{movesCount}</span>
            )}
          </div>

          {/* Collectibles count (if Token Collection mode) */}
          {puzzle.mode === 'token_collection' && totalTokens > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs md:text-sm font-mono text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                {collectedTokens}/{totalTokens}
              </span>
            </div>
          )}

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-sky-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </header>

      {/* Center Maze Arena */}
      <main className="relative flex-1 w-full max-w-4xl flex flex-col items-center justify-center p-2 md:p-4">
        {/* Failure alert banner */}
        {isFailed && (
          <div className="absolute top-4 z-40 px-5 py-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm font-semibold flex items-center gap-3 backdrop-blur-md shadow-xl animate-bounce">
            <Flame className="w-5 h-5 text-rose-400" />
            <span>Target exceeded! Tap restart to try again.</span>
            <button
              onClick={handleRestart}
              className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
            >
              Restart
            </button>
          </div>
        )}

        <MazeCanvas
          graph={graph}
          mode={puzzle.mode}
          theme={activeTheme}
          movementMode={profile.movementMode}
          showHint={showHint}
          controllerRef={controllerRef}
          onMove={handleMove}
          onExitReached={handleExitReached}
          onTokenCollected={(collected) => {
            setCollectedTokens(collected);
          }}
        />

        {/* Tablet / Touchscreen Virtual Thumb D-Pad */}
        {showDPad && (
          <div className="mt-3 flex flex-col items-center gap-1.5 select-none touch-manipulation">
            <button
              onClick={() => controllerRef.current?.('up')}
              className="w-16 h-12 md:w-20 md:h-14 rounded-2xl bg-slate-800/90 active:bg-sky-500/20 active:border-sky-400 active:scale-90 border border-slate-700/80 flex items-center justify-center text-white shadow-xl shadow-black/50 transition-all touch-manipulation group"
              title="Move Up"
            >
              <ChevronUp className="w-7 h-7 text-sky-400 group-active:text-sky-200" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => controllerRef.current?.('left')}
                className="w-16 h-12 md:w-20 md:h-14 rounded-2xl bg-slate-800/90 active:bg-sky-500/20 active:border-sky-400 active:scale-90 border border-slate-700/80 flex items-center justify-center text-white shadow-xl shadow-black/50 transition-all touch-manipulation group"
                title="Move Left"
              >
                <ChevronLeft className="w-7 h-7 text-sky-400 group-active:text-sky-200" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-500 text-[11px] font-bold tracking-wider">
                PAD
              </div>
              <button
                onClick={() => controllerRef.current?.('right')}
                className="w-16 h-12 md:w-20 md:h-14 rounded-2xl bg-slate-800/90 active:bg-sky-500/20 active:border-sky-400 active:scale-90 border border-slate-700/80 flex items-center justify-center text-white shadow-xl shadow-black/50 transition-all touch-manipulation group"
                title="Move Right"
              >
                <ChevronRight className="w-7 h-7 text-sky-400 group-active:text-sky-200" />
              </button>
            </div>
            <button
              onClick={() => controllerRef.current?.('down')}
              className="w-16 h-12 md:w-20 md:h-14 rounded-2xl bg-slate-800/90 active:bg-sky-500/20 active:border-sky-400 active:scale-90 border border-slate-700/80 flex items-center justify-center text-white shadow-xl shadow-black/50 transition-all touch-manipulation group"
              title="Move Down"
            >
              <ChevronDown className="w-7 h-7 text-sky-400 group-active:text-sky-200" />
            </button>
          </div>
        )}
      </main>

      {/* Bottom Controls Bar */}
      <footer className="w-full max-w-4xl flex items-center justify-between py-3 border-t border-slate-800/80 mt-2">
        {/* Mode selector & D-pad switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              updateMovementMode(
                profile.movementMode === 'continuous' ? 'step' : 'continuous'
              )
            }
            className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-all"
            title="Toggle between gliding continuously or stepping one cell per input"
          >
            <span className="text-slate-400">Controls:</span>
            <span className="text-sky-400 font-semibold capitalize">
              {profile.movementMode}
            </span>
          </button>

          <button
            onClick={() => setShowDPad(!showDPad)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
              showDPad
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle On-Screen Touch D-Pad for Tablet Display"
          >
            <Gamepad2 className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">D-Pad</span>
          </button>
        </div>

        {/* Center Instructions */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span>Swipe, Tap, or use Keys to move</span>
        </div>

        {/* Action Buttons: Hint & Restart */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHint(!showHint)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showHint
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
            title="Toggle solution hint"
          >
            <Lightbulb className={`w-4 h-4 ${showHint ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span>Hint</span>
          </button>

          <button
            onClick={handleRestart}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            title="Restart level"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>
        </div>
      </footer>

      {/* Completion Victory Modal */}
      {completedStats && (
        <LevelCompleteModal
          puzzle={puzzle}
          stars={completedStats.stars}
          points={completedStats.points}
          timeTaken={elapsedSeconds}
          movesTaken={movesCount}
          isNewRecord={completedStats.isNewRecord}
          unlockedConstellation={completedStats.unlockedConstellation}
          onNext={() => {
            if (nextPuzzle) {
              setCompletedStats(null);
              setElapsedSeconds(0);
              setMovesCount(0);
              setShowHint(false);
              playPuzzle(nextPuzzle);
            } else {
              setCurrentScreen('constellations');
            }
          }}
          onReplay={() => {
            handleRestart();
          }}
          onReturnToMap={() => {
            setCurrentScreen('constellations');
          }}
        />
      )}
    </div>
  );
};
