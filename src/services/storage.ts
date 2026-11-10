import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ChallengeAttemptData, Difficulty, LeaderboardEntry, PuzzleDefinition, UserProfileData, UserProgressData } from '../types/game';

const LOCAL_PROGRESS_KEY = 'maze_local_progress';
const LOCAL_PROFILE_KEY = 'maze_local_profile';
const LOCAL_CHALLENGE_ATTEMPTS_KEY = 'stargazer_challenge_attempts';
const LOCAL_SCORES_KEY = 'stargazer_local_scores';

// Helper to strip undefined properties before passing payloads to Firestore setDoc()
function cleanFirestorePayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// Get local cached progress (for guests or offline play)
export function getLocalProgress(): Record<string, UserProgressData> {
  try {
    const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Save local progress
export function saveLocalProgress(progress: Record<string, UserProgressData>) {
  try {
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota
  }
}

// Get local profile
export function getLocalProfile(): UserProfileData {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return {
    uid: 'guest_' + Math.random().toString(36).substring(2, 9),
    displayName: 'Stargazer Guest',
    email: '',
    emailVerified: false,
    totalPoints: 0,
    totalLevelsCompleted: 0,
    totalStars: 0,
    totalPlayTime: 0,
    currentConstellation: 'c1_ursa_minor',
    currentLevel: 1,
    selectedTheme: 'midnight_blue',
    movementMode: 'continuous',
    playerSpeed: 10.0,
    dailyStreak: 0,
    lastStreakDate: '',
    bestStreak: 0,
    isGuest: true,
    role: 'player',
  };
}

// Save local profile
export function saveLocalProfile(profile: UserProfileData) {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

// Get active streak status for a profile
export function getStreakStatus(profile: UserProfileData): {
  activeStreak: number;
  dailyStreak: number;
  completedToday: boolean;
  needsCompletionToday: boolean;
  bestStreak: number;
  lastStreakDate: string;
} {
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const lastDateStr = profile.lastStreakDate || '';
  const storedStreak = profile.dailyStreak || 0;
  const storedBest = Math.max(profile.bestStreak || 0, storedStreak);

  if (!lastDateStr) {
    return {
      activeStreak: 0,
      dailyStreak: 0,
      completedToday: false,
      needsCompletionToday: true,
      bestStreak: storedBest,
      lastStreakDate: '',
    };
  }

  if (lastDateStr === todayStr) {
    return {
      activeStreak: storedStreak,
      dailyStreak: storedStreak,
      completedToday: true,
      needsCompletionToday: false,
      bestStreak: storedBest,
      lastStreakDate: lastDateStr,
    };
  }

  const todayMs = new Date(todayStr).getTime();
  const lastMs = new Date(lastDateStr).getTime();
  const diffDays = Math.round((todayMs - lastMs) / (1000 * 3600 * 24));

  if (diffDays === 1) {
    // Completed yesterday: streak is active, needs completion today to advance!
    return {
      activeStreak: storedStreak,
      dailyStreak: storedStreak,
      completedToday: false,
      needsCompletionToday: true,
      bestStreak: storedBest,
      lastStreakDate: lastDateStr,
    };
  }

  // More than 1 day missed: streak reset
  return {
    activeStreak: 0,
    dailyStreak: 0,
    completedToday: false,
    needsCompletionToday: true,
    bestStreak: storedBest,
    lastStreakDate: lastDateStr,
  };
}

// Calculate streak update when a user completes a puzzle or challenge
export function calculateStreakUpdate(profile: UserProfileData): UserProfileData {
  const todayStr = new Date().toISOString().split('T')[0];
  const lastDateStr = profile.lastStreakDate || '';

  if (lastDateStr === todayStr) {
    // Already recorded for today
    return profile;
  }

  let newStreak = 1;
  if (lastDateStr) {
    const todayMs = new Date(todayStr).getTime();
    const lastMs = new Date(lastDateStr).getTime();
    const diffDays = Math.round((todayMs - lastMs) / (1000 * 3600 * 24));

    if (diffDays === 1) {
      newStreak = (profile.dailyStreak || 0) + 1;
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const newBest = Math.max(profile.bestStreak || 0, newStreak);

  return {
    ...profile,
    dailyStreak: newStreak,
    lastStreakDate: todayStr,
    bestStreak: newBest,
  };
}

// Sync progress to Firestore
export async function syncUserProgress(userId: string, data: UserProgressData) {
  const path = `users/${userId}/progress/${data.puzzleId}`;
  try {
    const payload = cleanFirestorePayload({
      ...data,
      lastPlayedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', userId, 'progress', data.puzzleId), payload, { merge: true });
  } catch (error) {
    console.warn('Could not sync progress to Firestore, saved locally:', error);
    // Don't throw fatal error if offline
  }
}

// Sync user profile to Firestore
export async function syncUserProfile(profile: UserProfileData) {
  if (profile.isGuest) {
    saveLocalProfile(profile);
    return;
  }
  const path = `users/${profile.uid}`;
  try {
    const payload = cleanFirestorePayload({
      uid: profile.uid,
      displayName: profile.displayName,
      email: profile.email,
      emailVerified: profile.emailVerified,
      totalPoints: profile.totalPoints,
      totalLevelsCompleted: profile.totalLevelsCompleted,
      totalStars: profile.totalStars,
      totalPlayTime: profile.totalPlayTime,
      currentConstellation: profile.currentConstellation,
      currentLevel: profile.currentLevel,
      selectedTheme: profile.selectedTheme,
      movementMode: profile.movementMode,
      playerSpeed: profile.playerSpeed ?? 10.0,
      dailyStreak: profile.dailyStreak || 0,
      lastStreakDate: profile.lastStreakDate || '',
      bestStreak: profile.bestStreak || 0,
      role: profile.role || 'player',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', profile.uid), payload, { merge: true });
    saveLocalProfile(profile);
  } catch (error) {
    console.warn('Could not sync user profile to Firestore:', error);
    saveLocalProfile(profile);
  }
}

// Load user profile from Firestore
export async function loadUserProfile(userId: string): Promise<UserProfileData | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Load all progress for user
export async function loadUserAllProgress(userId: string): Promise<Record<string, UserProgressData>> {
  const path = `users/${userId}/progress`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'progress'));
    const result: Record<string, UserProgressData> = {};
    snap.forEach((d) => {
      result[d.id] = d.data() as UserProgressData;
    });
    return result;
  } catch (error) {
    console.warn('Error loading user progress from Firestore, using local fallback:', error);
    return getLocalProgress();
  }
}

// --- Challenge Attempts (Strict 1 Attempt Only) ---

export function getLocalChallengeAttempts(): Record<string, ChallengeAttemptData> {
  try {
    const raw = localStorage.getItem(LOCAL_CHALLENGE_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function hasAttemptedChallenge(challengeId: string): boolean {
  const attempts = getLocalChallengeAttempts();
  return !!attempts[challengeId];
}

export function getChallengeAttempt(challengeId: string): ChallengeAttemptData | null {
  const attempts = getLocalChallengeAttempts();
  return attempts[challengeId] || null;
}

export async function recordChallengeAttempt(
  attempt: ChallengeAttemptData,
  userId?: string
): Promise<void> {
  // Always record locally immediately
  try {
    const attempts = getLocalChallengeAttempts();
    attempts[attempt.challengeId] = attempt;
    localStorage.setItem(LOCAL_CHALLENGE_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {
    // Ignore storage quota
  }

  // If user is authenticated, sync to Firestore
  if (userId && !userId.startsWith('guest_')) {
    const path = `users/${userId}/challengeAttempts/${attempt.challengeId}`;
    try {
      const payload = cleanFirestorePayload({
        ...attempt,
        attemptedAt: attempt.attemptedAt || new Date().toISOString(),
      });
      await setDoc(doc(db, 'users', userId, 'challengeAttempts', attempt.challengeId), payload);
    } catch (error) {
      console.warn('Could not sync challenge attempt to Firestore (offline or rules):', error);
    }
  }
}

// --- Local & Remote Leaderboards ---

export function getLocalScores(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_SCORES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalScore(entry: LeaderboardEntry) {
  try {
    const scores = getLocalScores();
    // Prepend new score and keep last 200
    scores.unshift(entry);
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores.slice(0, 200)));
  } catch {
    // Ignore
  }
}

// Submit a competitive leaderboard score
export async function submitLeaderboardScore(score: {
  userId: string;
  displayName: string;
  points: number;
  stars: number;
  puzzleId: string;
  puzzleName?: string;
  difficulty?: string;
  gameMode: string;
  completionTime: number;
  moveCount: number;
}) {
  const scoreId = `score_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  const entry: LeaderboardEntry = {
    id: scoreId,
    userId: score.userId,
    displayName: score.displayName || 'Stargazer',
    points: score.points,
    stars: score.stars,
    levelsCompleted: score.moveCount,
    bestTime: score.completionTime,
    submittedAt: new Date().toISOString(),
    gameMode: score.gameMode,
    difficulty: (score.difficulty || 'normal') as Difficulty,
    puzzleName: score.puzzleName || 'Labyrinth',
  };

  // Always save locally so player sees their score instantly in any mode
  saveLocalScore(entry);

  // If authenticated with Firebase, write to global leaderboard collection
  if (score.userId && !score.userId.startsWith('guest_')) {
    try {
      const payload = cleanFirestorePayload({
        scoreId,
        userId: score.userId,
        displayNameSnapshot: score.displayName,
        points: score.points,
        stars: score.stars,
        puzzleId: score.puzzleId,
        puzzleName: score.puzzleName || '',
        difficulty: score.difficulty || 'normal',
        gameMode: score.gameMode,
        completionTime: score.completionTime,
        moveCount: score.moveCount,
        submittedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'leaderboardScores', scoreId), payload);
    } catch (error) {
      console.warn('Score submission to Firestore skipped/failed (offline or rules):', error);
    }
  }
}

// Fetch leaderboard entries for a specific difficulty level or challenge type
export async function fetchLeaderboard(category = 'medium'): Promise<LeaderboardEntry[]> {
  const path = 'leaderboardScores';
  const remoteEntries: LeaderboardEntry[] = [];

  try {
    const scoresRef = collection(db, path);
    const q = query(scoresRef, limit(100));
    const snap = await getDocs(q);

    snap.forEach((d) => {
      const data = d.data();
      remoteEntries.push({
        id: d.id,
        userId: data.userId,
        displayName: data.displayNameSnapshot || 'Stargazer',
        points: data.points || 0,
        stars: data.stars || 0,
        levelsCompleted: data.moveCount || 1,
        bestTime: data.completionTime,
        submittedAt: data.submittedAt || new Date().toISOString(),
        gameMode: data.gameMode || 'classic',
        difficulty: data.difficulty as Difficulty,
        puzzleName: data.puzzleName,
      });
    });
  } catch (error) {
    console.warn('Leaderboard remote fetch error (using local fallback):', error);
  }

  // Combine remote entries with local scores
  const localScores = getLocalScores();
  const combinedMap = new Map<string, LeaderboardEntry>();

  // Add remote first
  remoteEntries.forEach((e) => combinedMap.set(e.id, e));
  // Overlay local scores (ensures latest local plays are represented)
  localScores.forEach((e) => combinedMap.set(e.id, e));

  const allEntries = Array.from(combinedMap.values());

  // Filter based on selected difficulty category
  const filtered = allEntries.filter((entry) => {
    const diff = (entry.difficulty || '').toLowerCase();
    const mode = (entry.gameMode || '').toLowerCase();
    const pId = ((entry as any).puzzleId || entry.id || '').toLowerCase();

    if (category === 'daily') {
      return mode === 'daily' || pId.includes('daily') || (entry.puzzleName || '').toLowerCase().includes('daily');
    }
    if (category === 'weekly') {
      return mode === 'weekly' || pId.includes('weekly') || (entry.puzzleName || '').toLowerCase().includes('weekly');
    }
    if (category === 'easy') {
      return diff === 'easy' || diff === 'very_easy';
    }
    if (category === 'medium') {
      return diff === 'medium' || diff === 'normal';
    }
    if (category === 'hard') {
      return diff === 'hard' || diff === 'very_hard';
    }
    if (category === 'expert') {
      return diff === 'expert';
    }
    if (category === 'master') {
      return diff === 'master';
    }
    return true;
  });

  // Sort: highest points first, then fastest completion time
  filtered.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return (a.bestTime || 999) - (b.bestTime || 999);
  });

  return filtered.slice(0, 50);
}

// --- Cloud Community Puzzle Bank ---

export interface CommunityPuzzleData {
  puzzleId: string;
  puzzleName: string;
  creatorId: string;
  creatorName: string;
  mazeShape: string;
  silhouette?: string;
  gridWidth: number;
  gridHeight: number;
  difficulty: Difficulty;
  gameMode: string;
  generationSeed: number;
  timeLimit?: number;
  moveLimit?: number;
  basePoints: number;
  playsCount: number;
  likesCount: number;
  createdAt: string;
}

const LOCAL_COMMUNITY_PUZZLES_KEY = 'maze_quest_community_puzzles';

export function getLocalCommunityPuzzles(): CommunityPuzzleData[] {
  try {
    const raw = localStorage.getItem(LOCAL_COMMUNITY_PUZZLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCommunityPuzzle(puzzle: CommunityPuzzleData) {
  try {
    const list = getLocalCommunityPuzzles();
    const existingIdx = list.findIndex((p) => p.puzzleId === puzzle.puzzleId);
    if (existingIdx >= 0) {
      list[existingIdx] = puzzle;
    } else {
      list.unshift(puzzle);
    }
    localStorage.setItem(LOCAL_COMMUNITY_PUZZLES_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    // Ignore storage quota
  }
}

export async function publishCommunityPuzzle(puzzle: CommunityPuzzleData): Promise<void> {
  saveLocalCommunityPuzzle(puzzle);
  if (puzzle.creatorId && !puzzle.creatorId.startsWith('guest_')) {
    const path = `communityPuzzles/${puzzle.puzzleId}`;
    try {
      const payload = cleanFirestorePayload({
        ...puzzle,
        createdAt: puzzle.createdAt || new Date().toISOString(),
      });
      await setDoc(doc(db, 'communityPuzzles', puzzle.puzzleId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function fetchCommunityPuzzles(): Promise<CommunityPuzzleData[]> {
  const path = 'communityPuzzles';
  const remotePuzzles: CommunityPuzzleData[] = [];
  try {
    const colRef = collection(db, path);
    const q = query(colRef, limit(100));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      remotePuzzles.push(d.data() as CommunityPuzzleData);
    });
  } catch (error) {
    console.warn('Could not fetch community puzzles from Firestore, fallback to local cache:', error);
  }

  const localList = getLocalCommunityPuzzles();
  const map = new Map<string, CommunityPuzzleData>();
  remotePuzzles.forEach((p) => map.set(p.puzzleId, p));
  localList.forEach((p) => map.set(p.puzzleId, p));

  const all = Array.from(map.values());
  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return all;
}

export async function deleteCommunityPuzzle(puzzleId: string): Promise<void> {
  try {
    const list = getLocalCommunityPuzzles().filter((p) => p.puzzleId !== puzzleId);
    localStorage.setItem(LOCAL_COMMUNITY_PUZZLES_KEY, JSON.stringify(list));
  } catch {}

  const path = `communityPuzzles/${puzzleId}`;
  try {
    await deleteDoc(doc(db, 'communityPuzzles', puzzleId));
  } catch (error) {
    console.warn('Could not delete community puzzle from Firestore:', error);
  }
}

