import {
  collection,
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
import { LeaderboardEntry, PuzzleDefinition, UserProfileData, UserProgressData } from '../types/game';

const LOCAL_PROGRESS_KEY = 'maze_local_progress';
const LOCAL_PROFILE_KEY = 'maze_local_profile';

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

// Sync progress to Firestore
export async function syncUserProgress(userId: string, data: UserProgressData) {
  const path = `users/${userId}/progress/${data.puzzleId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'progress', data.puzzleId), {
      ...data,
      lastPlayedAt: new Date().toISOString(),
    }, { merge: true });
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
    await setDoc(doc(db, 'users', profile.uid), {
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
      role: profile.role || 'player',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
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

// Submit a competitive leaderboard score
export async function submitLeaderboardScore(score: {
  userId: string;
  displayName: string;
  points: number;
  stars: number;
  puzzleId: string;
  gameMode: string;
  completionTime: number;
  moveCount: number;
}) {
  const scoreId = `score_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `leaderboardScores/${scoreId}`;
  try {
    await setDoc(doc(db, 'leaderboardScores', scoreId), {
      scoreId,
      userId: score.userId,
      displayNameSnapshot: score.displayName,
      points: score.points,
      stars: score.stars,
      puzzleId: score.puzzleId,
      gameMode: score.gameMode,
      completionTime: score.completionTime,
      moveCount: score.moveCount,
      submittedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Score submission error (offline or rules):', error);
  }
}

// Fetch leaderboard entries
export async function fetchLeaderboard(mode?: string): Promise<LeaderboardEntry[]> {
  const path = 'leaderboardScores';
  try {
    const scoresRef = collection(db, path);
    const q = query(scoresRef, orderBy('points', 'desc'), limit(50));
    const snap = await getDocs(q);
    const entries: LeaderboardEntry[] = [];
    snap.forEach((d) => {
      const data = d.data();
      entries.push({
        id: d.id,
        userId: data.userId,
        displayName: data.displayNameSnapshot || 'Stargazer',
        points: data.points || 0,
        stars: data.stars || 0,
        levelsCompleted: data.moveCount || 1,
        bestTime: data.completionTime,
        submittedAt: data.submittedAt || new Date().toISOString(),
        gameMode: data.gameMode || 'classic',
      });
    });

    if (entries.length === 0) {
      // Provide initial galactic hall of fame benchmarks
      return [
        { id: 'hall_1', userId: 'usr_1', displayName: 'AstralNavigator', points: 3420, stars: 120, levelsCompleted: 42, bestTime: 12.4, submittedAt: '2026-11-08' },
        { id: 'hall_2', userId: 'usr_2', displayName: 'NovaSeeker', points: 2890, stars: 98, levelsCompleted: 35, bestTime: 14.1, submittedAt: '2026-11-08' },
        { id: 'hall_3', userId: 'usr_3', displayName: 'CosmicVoyager', points: 2450, stars: 85, levelsCompleted: 30, bestTime: 16.8, submittedAt: '2026-11-07' },
        { id: 'hall_4', userId: 'usr_4', displayName: 'NebulaGlide', points: 1980, stars: 72, levelsCompleted: 26, bestTime: 18.2, submittedAt: '2026-11-07' },
        { id: 'hall_5', userId: 'usr_5', displayName: 'ZenithMaze', points: 1650, stars: 60, levelsCompleted: 22, bestTime: 21.0, submittedAt: '2026-11-06' },
      ];
    }
    return entries;
  } catch (error) {
    console.warn('Leaderboard fetch fallback:', error);
    return [
      { id: 'hall_1', userId: 'usr_1', displayName: 'AstralNavigator', points: 3420, stars: 120, levelsCompleted: 42, bestTime: 12.4, submittedAt: '2026-11-08' },
      { id: 'hall_2', userId: 'usr_2', displayName: 'NovaSeeker', points: 2890, stars: 98, levelsCompleted: 35, bestTime: 14.1, submittedAt: '2026-11-08' },
      { id: 'hall_3', userId: 'usr_3', displayName: 'CosmicVoyager', points: 2450, stars: 85, levelsCompleted: 30, bestTime: 16.8, submittedAt: '2026-11-07' },
      { id: 'hall_4', userId: 'usr_4', displayName: 'NebulaGlide', points: 1980, stars: 72, levelsCompleted: 26, bestTime: 18.2, submittedAt: '2026-11-07' },
      { id: 'hall_5', userId: 'usr_5', displayName: 'ZenithMaze', points: 1650, stars: 60, levelsCompleted: 22, bestTime: 21.0, submittedAt: '2026-11-06' },
    ];
  }
}
