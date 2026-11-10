import React, { createContext, useContext, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Achievement,
  ColorTheme,
  ConstellationInfo,
  PuzzleDefinition,
  UserProgressData,
} from '../types/game';
import { CONSTELLATIONS, INITIAL_ACHIEVEMENTS, INITIAL_LEVELS, getDailyChallenge, getWeeklyChallenge } from '../services/puzzleData';
import { COLOR_THEMES } from '../services/colorThemes';
import { soundManager } from '../services/audio';
import { getLocalProgress, loadUserAllProgress, recordChallengeAttempt, saveLocalProgress, submitLeaderboardScore, syncUserProgress, syncUserProfile } from '../services/storage';
import { useAuth } from './AuthContext';

export type ScreenType =
  | 'home'
  | 'generator'
  | 'constellations'
  | 'level_select'
  | 'game'
  | 'daily_challenge'
  | 'weekly_challenge'
  | 'leaderboards'
  | 'profile'
  | 'achievements'
  | 'settings'
  | 'admin';

interface GameContextType {
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
  selectedConstellation: ConstellationInfo | null;
  setSelectedConstellation: (c: ConstellationInfo | null) => void;
  activePuzzle: PuzzleDefinition | null;
  setActivePuzzle: (p: PuzzleDefinition | null) => void;
  userProgress: Record<string, UserProgressData>;
  activeTheme: ColorTheme;
  customPuzzles: PuzzleDefinition[];
  addCustomPuzzle: (p: PuzzleDefinition) => void;
  achievements: Achievement[];
  totalStars: number;
  totalPoints: number;
  completedCount: number;
  playPuzzle: (puzzle: PuzzleDefinition) => void;
  handleLevelComplete: (
    puzzle: PuzzleDefinition,
    timeTaken: number,
    movesTaken: number,
    tokensCollected?: number,
    totalTokens?: number
  ) => { starsAwarded: number; pointsEarned: number; isNewRecord: boolean; unlockedConstellation?: string };
  getNextLevel: (currentPuzzle: PuzzleDefinition) => PuzzleDefinition | null;
  isLevelUnlocked: (puzzle: PuzzleDefinition) => boolean;
  isConstellationUnlocked: (constellation: ConstellationInfo) => boolean;
  getConstellationStars: (constellationId: string) => number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user, isGuest } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedConstellation, setSelectedConstellation] = useState<ConstellationInfo | null>(CONSTELLATIONS[0]);
  const [activePuzzle, setActivePuzzle] = useState<PuzzleDefinition | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgressData>>(getLocalProgress());
  const [customPuzzles, setCustomPuzzles] = useState<PuzzleDefinition[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  const activeTheme = COLOR_THEMES[profile.selectedTheme] || COLOR_THEMES.midnight_blue;

  // Load user progress when auth changes
  useEffect(() => {
    async function loadProgress() {
      if (user) {
        const remote = await loadUserAllProgress(user.uid);
        setUserProgress(remote);
      } else {
        setUserProgress(getLocalProgress());
      }
    }
    loadProgress();
  }, [user]);

  // Calculate totals
  const progressList = Object.values(userProgress);
  const totalStars = progressList.reduce((sum, p) => sum + (p.stars || 0), 0);
  const totalPoints = progressList.reduce((sum, p) => sum + (p.points || 0), 0);
  const completedCount = progressList.filter((p) => p.completed).length;

  const playPuzzle = (puzzle: PuzzleDefinition) => {
    setActivePuzzle(puzzle);
    setCurrentScreen('game');
  };

  const getConstellationStars = (constellationId: string): number => {
    return Object.entries(userProgress)
      .filter(([id, prog]) => id.startsWith(`lvl_${constellationId.split('_')[0].replace('c', '')}_`))
      .reduce((sum, [, p]) => sum + (p.stars || 0), 0);
  };

  const isConstellationUnlocked = (constellation: ConstellationInfo): boolean => {
    if (constellation.order === 1) return true;
    return totalStars >= constellation.requiredStars;
  };

  const isLevelUnlocked = (puzzle: PuzzleDefinition): boolean => {
    if (!puzzle.constellationId) return true; // Daily/Weekly/Custom always unlocked
    if (puzzle.levelNumber === 1) return true;

    // Previous level must be completed
    const prevLevelId = `lvl_${puzzle.constellationId.split('_')[0].replace('c', '')}_${puzzle.levelNumber! - 1}`;
    return !!userProgress[prevLevelId]?.completed;
  };

  const getNextLevel = (currentPuzzle: PuzzleDefinition): PuzzleDefinition | null => {
    if (!currentPuzzle.constellationId || !currentPuzzle.levelNumber) return null;
    const nextLvlNum = currentPuzzle.levelNumber + 1;
    if (nextLvlNum <= 20) {
      const nextId = `lvl_${currentPuzzle.constellationId.split('_')[0].replace('c', '')}_${nextLvlNum}`;
      return INITIAL_LEVELS.find((l) => l.id === nextId) || null;
    }
    // Check next constellation
    const currentConstIndex = CONSTELLATIONS.findIndex((c) => c.id === currentPuzzle.constellationId);
    if (currentConstIndex >= 0 && currentConstIndex < CONSTELLATIONS.length - 1) {
      const nextConst = CONSTELLATIONS[currentConstIndex + 1];
      if (isConstellationUnlocked(nextConst)) {
        return INITIAL_LEVELS.find((l) => l.constellationId === nextConst.id && l.levelNumber === 1) || null;
      }
    }
    return null;
  };

  const handleLevelComplete = (
    puzzle: PuzzleDefinition,
    timeTaken: number,
    movesTaken: number,
    tokensCollected = 0,
    totalTokens = 0
  ) => {
    // Star Rating Calculation:
    // 1 Star: Just complete the maze
    // 2 Stars: Beat target time or move allowance
    // 3 Stars: Beat target time AND move allowance (or collected all tokens in token mode)
    let starsAwarded = 1;

    if (puzzle.mode === 'token_collection') {
      if (totalTokens > 0 && tokensCollected >= totalTokens) {
        starsAwarded = 3;
      } else if (tokensCollected >= Math.ceil(totalTokens / 2)) {
        starsAwarded = 2;
      }
    } else if (puzzle.mode === 'time_challenge') {
      if (puzzle.timeLimit && timeTaken <= puzzle.timeLimit * 0.6) {
        starsAwarded = 3;
      } else if (puzzle.timeLimit && timeTaken <= puzzle.timeLimit) {
        starsAwarded = 2;
      }
    } else if (puzzle.mode === 'restricted_moves') {
      if (puzzle.moveLimit && movesTaken <= puzzle.moveLimit * 0.75) {
        starsAwarded = 3;
      } else {
        starsAwarded = 2;
      }
    } else {
      // Classic / Other modes
      // Benchmarks based on grid size
      const targetTime = (puzzle.width + puzzle.height) * 1.5;
      const targetMoves = (puzzle.width + puzzle.height) * 2;
      if (timeTaken <= targetTime && movesTaken <= targetMoves) {
        starsAwarded = 3;
      } else if (timeTaken <= targetTime * 1.5 || movesTaken <= targetMoves * 1.5) {
        starsAwarded = 2;
      }
    }

    // Point multiplier calculation
    let bonusMultiplier = 1.0;
    if (starsAwarded === 3) bonusMultiplier += 0.5;
    if (starsAwarded === 2) bonusMultiplier += 0.25;
    if (timeTaken < 15) bonusMultiplier += 0.2;

    const basePts = puzzle.basePoints || 25;
    const pointsEarned = Math.round(basePts * bonusMultiplier);

    const existingRecord = userProgress[puzzle.id];
    const isNewRecord = !existingRecord || starsAwarded > existingRecord.stars || timeTaken < existingRecord.bestTime;

    const updatedRecord: UserProgressData = {
      puzzleId: puzzle.id,
      completed: true,
      bestTime: existingRecord ? Math.min(existingRecord.bestTime, timeTaken) : timeTaken,
      bestMoves: existingRecord ? Math.min(existingRecord.bestMoves, movesTaken) : movesTaken,
      stars: Math.max(existingRecord?.stars || 0, starsAwarded),
      points: Math.max(existingRecord?.points || 0, pointsEarned),
      lastPlayedAt: new Date().toISOString(),
    };

    const newProgressMap = {
      ...userProgress,
      [puzzle.id]: updatedRecord,
    };
    setUserProgress(newProgressMap);
    saveLocalProgress(newProgressMap);

    if (user) {
      syncUserProgress(user.uid, updatedRecord);
    }

    const effectiveUserId = user ? user.uid : profile.uid;
    const isDaily = puzzle.id.startsWith('daily_');
    const isWeekly = puzzle.id.startsWith('weekly_');
    const challengeCategory = isDaily ? 'daily' : isWeekly ? 'weekly' : puzzle.mode;

    // Submit score to global & local leaderboard
    submitLeaderboardScore({
      userId: effectiveUserId,
      displayName: profile.displayName || 'Stargazer',
      points: pointsEarned,
      stars: starsAwarded,
      puzzleId: puzzle.id,
      puzzleName: puzzle.name,
      difficulty: puzzle.difficulty,
      gameMode: challengeCategory,
      completionTime: timeTaken,
      moveCount: movesTaken,
    });

    // If Daily or Weekly challenge, record the single completed attempt
    if (isDaily || isWeekly) {
      recordChallengeAttempt(
        {
          challengeId: puzzle.id,
          challengeType: isDaily ? 'daily' : 'weekly',
          completed: true,
          attemptedAt: new Date().toISOString(),
          points: pointsEarned,
          stars: starsAwarded,
          completionTime: timeTaken,
          moveCount: movesTaken,
        },
        user?.uid
      );
    }

    // Play victory sounds
    soundManager.playWin();

    // Trigger confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [activeTheme.playerGlow, activeTheme.exitGlow, activeTheme.accent, '#facc15'],
      });
    } catch {
      // Ignore
    }

    // Check if entire constellation just got completed
    let unlockedConstellation: string | undefined = undefined;
    if (puzzle.constellationId) {
      const cLevels = INITIAL_LEVELS.filter((l) => l.constellationId === puzzle.constellationId);
      const allDone = cLevels.every((l) => newProgressMap[l.id]?.completed);
      if (allDone) {
        soundManager.playConstellationUnlock();
        unlockedConstellation = puzzle.constellationId;
        try {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
          });
        } catch {
          // Ignore
        }
      }
    }

    // Update profile aggregates
    const newTotalPoints = Object.values(newProgressMap).reduce((s, p) => s + p.points, 0);
    const newTotalStars = Object.values(newProgressMap).reduce((s, p) => s + p.stars, 0);
    const newLevelsDone = Object.values(newProgressMap).filter((p) => p.completed).length;

    syncUserProfile({
      ...profile,
      totalPoints: newTotalPoints,
      totalStars: newTotalStars,
      totalLevelsCompleted: newLevelsDone,
    });

    return { starsAwarded, pointsEarned, isNewRecord, unlockedConstellation };
  };

  const addCustomPuzzle = (p: PuzzleDefinition) => {
    setCustomPuzzles((prev) => [p, ...prev]);
  };

  return (
    <GameContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        selectedConstellation,
        setSelectedConstellation,
        activePuzzle,
        setActivePuzzle,
        userProgress,
        activeTheme,
        customPuzzles,
        addCustomPuzzle,
        achievements,
        totalStars,
        totalPoints,
        completedCount,
        playPuzzle,
        handleLevelComplete,
        getNextLevel,
        isLevelUnlocked,
        isConstellationUnlocked,
        getConstellationStars,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
