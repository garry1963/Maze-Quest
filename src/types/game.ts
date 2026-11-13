export type MazeGeometry = 'square' | 'circular' | 'triangular' | 'hexagonal' | 'silhouette';

export type SpecialSilhouette =
  | 'rabbit'
  | 'cat'
  | 'dog'
  | 'tree'
  | 'guitar'
  | 'heart'
  | 'star'
  | 'butterfly'
  | 'flower'
  | 'diamond';

export type GameMode =
  | 'classic'
  | 'time_challenge'
  | 'restricted_moves'
  | 'token_collection'
  | 'intertwined'
  | 'hidden'
  | 'mirror';

export type Difficulty =
  | 'very_easy'
  | 'easy'
  | 'normal'
  | 'medium'
  | 'hard'
  | 'very_hard'
  | 'expert'
  | 'master';

export type MovementMode = 'continuous' | 'step';

export type ColorThemeId =
  | 'midnight_blue'
  | 'aurora_green'
  | 'cosmic_purple'
  | 'sunset_orange'
  | 'ice_blue'
  | 'emerald_forest'
  | 'galaxy'
  | 'monochrome';

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  bgDark: string;
  bgCard: string;
  wallColor: string;
  pathColor: string;
  playerGlow: string;
  playerCore: string;
  exitGlow: string;
  exitCore: string;
  accent: string;
  trailColor: string;
}

export interface Coordinate {
  x: number;
  y: number;
  ring?: number;
  sector?: number;
}

export interface Portal {
  id: string;
  color: string;
  entry: Coordinate;
  exit: Coordinate;
}

export interface CollectibleToken {
  id: string;
  position: Coordinate;
  collected: boolean;
}

export interface MazeNode {
  id: string;
  coord: Coordinate;
  neighbors: string[]; // Connected node IDs
  isStart?: boolean;
  isExit?: boolean;
}

export interface MazeGraph {
  geometry: MazeGeometry;
  silhouette?: SpecialSilhouette;
  width: number;
  height: number;
  nodes: Map<string, MazeNode>;
  startNodeId: string;
  exitNodeId: string;
  portals?: Portal[];
  collectibles?: CollectibleToken[];
  minMoves: number; // Shortest solution length
  solutionPath: string[]; // Node IDs from start to exit
  difficulty: Difficulty;
  seed: number;
}

export interface PuzzleDefinition {
  id: string;
  constellationId?: string;
  levelNumber?: number;
  name: string;
  geometry: MazeGeometry;
  silhouette?: SpecialSilhouette;
  width: number;
  height: number;
  difficulty: Difficulty;
  mode: GameMode;
  seed: number;
  timeLimit?: number; // seconds
  moveLimit?: number;
  basePoints: number;
  isPublished?: boolean;
}

export interface ConstellationInfo {
  id: string;
  name: string;
  latinName: string;
  mythology: string;
  totalLevels: number;
  order: number;
  requiredStars: number;
  starsCoordinates: { x: number; y: number }[]; // 20 coordinates for celestial map layout (0-100%)
  connections: [number, number][]; // pairs of star indices to draw the constellation lines
}

export interface UserProgressData {
  puzzleId: string;
  completed: boolean;
  bestTime: number; // in seconds
  bestMoves: number;
  stars: number; // 1, 2, or 3
  points: number;
  lastPlayedAt: string;
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  totalPoints: number;
  totalLevelsCompleted: number;
  totalStars: number;
  totalPlayTime: number; // in seconds
  currentConstellation: string;
  currentLevel: number;
  selectedTheme: ColorThemeId;
  movementMode: MovementMode;
  playerSpeed?: number; // Movement glide speed in cells/sec (e.g. 5.0 to 20.0)
  dailyStreak?: number;
  lastStreakDate?: string; // YYYY-MM-DD
  bestStreak?: number;
  isGuest?: boolean;
  role?: 'player' | 'admin';
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  points: number;
  stars: number;
  levelsCompleted: number;
  bestTime?: number;
  submittedAt: string;
  puzzleId?: string;
  gameMode?: string;
  difficulty?: Difficulty;
  puzzleName?: string;
}

export interface ChallengeAttemptData {
  challengeId: string;
  challengeType: 'daily' | 'weekly';
  completed: boolean;
  attemptedAt: string;
  points: number;
  stars: number;
  completionTime: number;
  moveCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'progression' | 'performance' | 'exploration' | 'competition';
  icon: string;
  requirement: number;
  pointsReward: number;
  unlocked?: boolean;
  progress?: number;
}
