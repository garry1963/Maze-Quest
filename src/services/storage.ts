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
import { ChallengeAttemptData, Difficulty, LeaderboardEntry, PuzzleDefinition, UserProfileData, UserProgressData } from '../types/game';

const LOCAL_PROGRESS_KEY = 'maze_local_progress';
const LOCAL_PROFILE_KEY = 'maze_local_profile';
const LOCAL_CHALLENGE_ATTEMPTS_KEY = 'stargazer_challenge_attempts';
const LOCAL_SCORES_KEY = 'stargazer_local_scores';

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
      await setDoc(doc(db, 'users', userId, 'challengeAttempts', attempt.challengeId), {
        ...attempt,
        attemptedAt: attempt.attemptedAt || new Date().toISOString(),
      });
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
      await setDoc(doc(db, 'leaderboardScores', scoreId), {
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
    } catch (error) {
      console.warn('Score submission to Firestore skipped/failed (offline or rules):', error);
    }
  }
}

// Difficulty-based benchmark entries ensuring every tier has realistic global competition
const BENCHMARKS_BY_DIFFICULTY: Record<string, LeaderboardEntry[]> = {
  easy: [
    { id: 'b_easy_1', userId: 'bot_101', displayName: 'AstralSpark', points: 125, stars: 3, levelsCompleted: 14, bestTime: 8.6, submittedAt: '2026-11-10', difficulty: 'easy', puzzleName: 'Dawn Starlight' },
    { id: 'b_easy_2', userId: 'bot_102', displayName: 'GlowWanderer', points: 110, stars: 3, levelsCompleted: 16, bestTime: 10.4, submittedAt: '2026-11-09', difficulty: 'easy', puzzleName: 'Polaris Gate' },
    { id: 'b_easy_3', userId: 'bot_103', displayName: 'StarlightCadet', points: 95, stars: 3, levelsCompleted: 18, bestTime: 12.8, submittedAt: '2026-11-09', difficulty: 'easy', puzzleName: 'Little Dipper I' },
    { id: 'b_easy_4', userId: 'bot_104', displayName: 'DawnSeeker', points: 80, stars: 2, levelsCompleted: 19, bestTime: 14.2, submittedAt: '2026-11-08', difficulty: 'easy', puzzleName: 'Corona Spark' },
    { id: 'b_easy_5', userId: 'bot_105', displayName: 'OrbitRookie', points: 70, stars: 2, levelsCompleted: 22, bestTime: 16.5, submittedAt: '2026-11-08', difficulty: 'easy', puzzleName: 'Orion Pathway' },
  ],
  medium: [
    { id: 'b_med_1', userId: 'bot_201', displayName: 'NovaSeeker', points: 310, stars: 3, levelsCompleted: 28, bestTime: 19.4, submittedAt: '2026-11-10', difficulty: 'medium', puzzleName: 'Cassiopeia Crown' },
    { id: 'b_med_2', userId: 'bot_202', displayName: 'CosmicVoyager', points: 285, stars: 3, levelsCompleted: 31, bestTime: 23.2, submittedAt: '2026-11-09', difficulty: 'medium', puzzleName: 'Andromeda Ring' },
    { id: 'b_med_3', userId: 'bot_203', displayName: 'PrismRunner', points: 260, stars: 3, levelsCompleted: 33, bestTime: 26.8, submittedAt: '2026-11-09', difficulty: 'medium', puzzleName: 'Centaurus Spiral' },
    { id: 'b_med_4', userId: 'bot_204', displayName: 'SolarEcho', points: 230, stars: 2, levelsCompleted: 36, bestTime: 30.5, submittedAt: '2026-11-08', difficulty: 'medium', puzzleName: 'Pegasus Drift' },
    { id: 'b_med_5', userId: 'bot_205', displayName: 'AuraWalker', points: 195, stars: 2, levelsCompleted: 40, bestTime: 33.9, submittedAt: '2026-11-07', difficulty: 'medium', puzzleName: 'Taurus Knot' },
  ],
  hard: [
    { id: 'b_hard_1', userId: 'bot_301', displayName: 'NebulaGlide', points: 680, stars: 3, levelsCompleted: 45, bestTime: 38.5, submittedAt: '2026-11-10', difficulty: 'hard', puzzleName: 'Scorpius Maze' },
    { id: 'b_hard_2', userId: 'bot_302', displayName: 'EclipseMaster', points: 620, stars: 3, levelsCompleted: 48, bestTime: 43.1, submittedAt: '2026-11-09', difficulty: 'hard', puzzleName: 'Draco Constellation' },
    { id: 'b_hard_3', userId: 'bot_303', displayName: 'VortexDrifter', points: 570, stars: 3, levelsCompleted: 52, bestTime: 48.7, submittedAt: '2026-11-09', difficulty: 'hard', puzzleName: 'Phoenix Flare' },
    { id: 'b_hard_4', userId: 'bot_304', displayName: 'ShadowWeaver', points: 510, stars: 2, levelsCompleted: 55, bestTime: 54.0, submittedAt: '2026-11-08', difficulty: 'hard', puzzleName: 'Hydra Labyrinth' },
    { id: 'b_hard_5', userId: 'bot_305', displayName: 'ZenithMaze', points: 460, stars: 2, levelsCompleted: 58, bestTime: 62.4, submittedAt: '2026-11-07', difficulty: 'hard', puzzleName: 'Crux Chamber' },
  ],
  expert: [
    { id: 'b_exp_1', userId: 'bot_401', displayName: 'HyperionBlade', points: 1350, stars: 3, levelsCompleted: 64, bestTime: 62.3, submittedAt: '2026-11-10', difficulty: 'expert', puzzleName: 'Cygnus Supernova' },
    { id: 'b_exp_2', userId: 'bot_402', displayName: 'SingularityAce', points: 1210, stars: 3, levelsCompleted: 69, bestTime: 71.0, submittedAt: '2026-11-09', difficulty: 'expert', puzzleName: 'Monoceros Core' },
    { id: 'b_exp_3', userId: 'bot_403', displayName: 'DarkMatterPilot', points: 1080, stars: 3, levelsCompleted: 73, bestTime: 79.5, submittedAt: '2026-11-09', difficulty: 'expert', puzzleName: 'Cepheus Portal' },
    { id: 'b_exp_4', userId: 'bot_404', displayName: 'QuantumVoyager', points: 950, stars: 3, levelsCompleted: 77, bestTime: 88.2, submittedAt: '2026-11-08', difficulty: 'expert', puzzleName: 'Aquila Nexus' },
    { id: 'b_exp_5', userId: 'bot_405', displayName: 'CelestialArchitect', points: 860, stars: 2, levelsCompleted: 82, bestTime: 97.6, submittedAt: '2026-11-07', difficulty: 'expert', puzzleName: 'Lyra Enigma' },
  ],
  master: [
    { id: 'b_mas_1', userId: 'bot_501', displayName: 'AstralNavigator', points: 2450, stars: 3, levelsCompleted: 88, bestTime: 96.5, submittedAt: '2026-11-10', difficulty: 'master', puzzleName: 'Ursa Major Zenith' },
    { id: 'b_mas_2', userId: 'bot_502', displayName: 'GalaxySovereign', points: 2180, stars: 3, levelsCompleted: 92, bestTime: 108.2, submittedAt: '2026-11-09', difficulty: 'master', puzzleName: 'Sagittarius Abyss' },
    { id: 'b_mas_3', userId: 'bot_503', displayName: 'PulsarChampion', points: 1920, stars: 3, levelsCompleted: 95, bestTime: 122.4, submittedAt: '2026-11-09', difficulty: 'master', puzzleName: 'Vela Void Labyrinth' },
    { id: 'b_mas_4', userId: 'bot_504', displayName: 'OmniverseWeaver', points: 1680, stars: 3, levelsCompleted: 101, bestTime: 139.0, submittedAt: '2026-11-08', difficulty: 'master', puzzleName: 'Corona Borealis Prime' },
    { id: 'b_mas_5', userId: 'bot_505', displayName: 'TitanVortex', points: 1490, stars: 2, levelsCompleted: 108, bestTime: 158.4, submittedAt: '2026-11-07', difficulty: 'master', puzzleName: 'Hercules Apex' },
  ],
  daily: [
    { id: 'b_day_1', userId: 'bot_601', displayName: 'ChronosRunner', points: 420, stars: 3, levelsCompleted: 24, bestTime: 18.5, submittedAt: '2026-11-10', gameMode: 'daily', puzzleName: 'Daily Solar Flare' },
    { id: 'b_day_2', userId: 'bot_602', displayName: 'DaybreakPilot', points: 380, stars: 3, levelsCompleted: 27, bestTime: 22.0, submittedAt: '2026-11-10', gameMode: 'daily', puzzleName: 'Daily Solar Flare' },
    { id: 'b_day_3', userId: 'bot_603', displayName: 'HorizonDrifter', points: 340, stars: 3, levelsCompleted: 30, bestTime: 26.4, submittedAt: '2026-11-10', gameMode: 'daily', puzzleName: 'Daily Solar Flare' },
    { id: 'b_day_4', userId: 'bot_604', displayName: 'SunburstSeeker', points: 290, stars: 2, levelsCompleted: 34, bestTime: 31.0, submittedAt: '2026-11-10', gameMode: 'daily', puzzleName: 'Daily Solar Flare' },
    { id: 'b_day_5', userId: 'bot_605', displayName: 'SolarProwler', points: 240, stars: 2, levelsCompleted: 39, bestTime: 36.8, submittedAt: '2026-11-10', gameMode: 'daily', puzzleName: 'Daily Solar Flare' },
  ],
  weekly: [
    { id: 'b_wk_1', userId: 'bot_701', displayName: 'OmniArchitect', points: 1650, stars: 3, levelsCompleted: 62, bestTime: 72.0, submittedAt: '2026-11-09', gameMode: 'weekly', puzzleName: 'Weekly Gateway Master' },
    { id: 'b_wk_2', userId: 'bot_702', displayName: 'AstralLegion', points: 1480, stars: 3, levelsCompleted: 68, bestTime: 81.5, submittedAt: '2026-11-09', gameMode: 'weekly', puzzleName: 'Weekly Gateway Master' },
    { id: 'b_wk_3', userId: 'bot_703', displayName: 'LabyrinthLord', points: 1320, stars: 3, levelsCompleted: 74, bestTime: 94.2, submittedAt: '2026-11-08', gameMode: 'weekly', puzzleName: 'Weekly Gateway Master' },
    { id: 'b_wk_4', userId: 'bot_704', displayName: 'InfinityVoyager', points: 1150, stars: 2, levelsCompleted: 80, bestTime: 108.0, submittedAt: '2026-11-08', gameMode: 'weekly', puzzleName: 'Weekly Gateway Master' },
    { id: 'b_wk_5', userId: 'bot_705', displayName: 'CosmicTitan', points: 980, stars: 2, levelsCompleted: 88, bestTime: 124.5, submittedAt: '2026-11-07', gameMode: 'weekly', puzzleName: 'Weekly Gateway Master' },
  ],
};

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
    console.warn('Leaderboard remote fetch error (using local & benchmark fallback):', error);
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

  // Inject difficulty benchmarks if fewer than 5 entries exist
  const benchmarks = BENCHMARKS_BY_DIFFICULTY[category] || BENCHMARKS_BY_DIFFICULTY['medium'];
  const userIds = new Set(filtered.map((e) => e.userId));

  benchmarks.forEach((b) => {
    if (!userIds.has(b.userId) && filtered.length < 15) {
      filtered.push(b);
    }
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
