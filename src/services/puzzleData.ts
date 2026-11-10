import {
  ConstellationInfo,
  Difficulty,
  GameMode,
  MazeGeometry,
  PuzzleDefinition,
  SpecialSilhouette,
} from '../types/game';

export const CONSTELLATIONS: ConstellationInfo[] = [
  {
    id: 'c1_ursa_minor',
    name: 'The Little Dipper',
    latinName: 'Ursa Minor',
    mythology: 'The navigational North Star constellation guiding voyagers home.',
    totalLevels: 20,
    order: 1,
    requiredStars: 0,
    starsCoordinates: [
      { x: 15, y: 30 }, { x: 22, y: 28 }, { x: 30, y: 32 }, { x: 38, y: 40 },
      { x: 48, y: 38 }, { x: 58, y: 44 }, { x: 54, y: 56 }, { x: 42, y: 52 },
      { x: 28, y: 65 }, { x: 35, y: 75 }, { x: 46, y: 80 }, { x: 62, y: 74 },
      { x: 70, y: 62 }, { x: 78, y: 48 }, { x: 82, y: 35 }, { x: 74, y: 22 },
      { x: 62, y: 18 }, { x: 48, y: 20 }, { x: 35, y: 15 }, { x: 20, y: 18 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 4],
      [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
      [14, 15], [15, 16], [16, 17], [17, 18], [18, 19]
    ],
  },
  {
    id: 'c2_orion',
    name: 'Orion',
    latinName: 'Orion the Hunter',
    mythology: 'The mighty celestial hunter with glowing belt and nebula sword.',
    totalLevels: 20,
    order: 2,
    requiredStars: 25,
    starsCoordinates: [
      { x: 25, y: 15 }, { x: 75, y: 15 }, { x: 45, y: 48 }, { x: 50, y: 50 },
      { x: 55, y: 52 }, { x: 30, y: 85 }, { x: 70, y: 85 }, { x: 49, y: 58 },
      { x: 48, y: 66 }, { x: 20, y: 35 }, { x: 80, y: 35 }, { x: 15, y: 20 },
      { x: 85, y: 20 }, { x: 50, y: 30 }, { x: 50, y: 40 }, { x: 38, y: 68 },
      { x: 62, y: 68 }, { x: 35, y: 92 }, { x: 65, y: 92 }, { x: 50, y: 88 },
    ],
    connections: [
      [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 1], [3, 7],
      [7, 8], [0, 9], [1, 10], [9, 11], [10, 12], [0, 13], [1, 13],
      [13, 14], [5, 15], [6, 16], [5, 17], [6, 18]
    ],
  },
  {
    id: 'c3_ursa_major',
    name: 'The Great Bear',
    latinName: 'Ursa Major',
    mythology: 'Ancient cosmic protector illuminating the northern sky.',
    totalLevels: 20,
    order: 3,
    requiredStars: 50,
    starsCoordinates: [
      { x: 18, y: 25 }, { x: 28, y: 32 }, { x: 40, y: 35 }, { x: 52, y: 48 },
      { x: 50, y: 65 }, { x: 70, y: 68 }, { x: 72, y: 50 }, { x: 35, y: 55 },
      { x: 22, y: 68 }, { x: 15, y: 80 }, { x: 38, y: 82 }, { x: 58, y: 85 },
      { x: 78, y: 85 }, { x: 85, y: 70 }, { x: 82, y: 35 }, { x: 65, y: 28 },
      { x: 50, y: 22 }, { x: 32, y: 18 }, { x: 15, y: 15 }, { x: 88, y: 18 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3], [1, 7],
      [7, 8], [8, 9], [7, 10], [4, 11], [5, 12], [12, 13], [6, 14],
      [14, 15], [15, 16], [16, 17], [17, 18], [14, 19]
    ],
  },
  {
    id: 'c4_cassiopeia',
    name: 'Cassiopeia',
    latinName: 'The Queen',
    mythology: 'The sparkling W-shaped throne in the starry realm.',
    totalLevels: 20,
    order: 4,
    requiredStars: 80,
    starsCoordinates: [
      { x: 15, y: 60 }, { x: 30, y: 35 }, { x: 50, y: 55 }, { x: 70, y: 30 },
      { x: 85, y: 50 }, { x: 20, y: 20 }, { x: 40, y: 18 }, { x: 60, y: 15 },
      { x: 80, y: 18 }, { x: 25, y: 75 }, { x: 45, y: 80 }, { x: 65, y: 78 },
      { x: 75, y: 70 }, { x: 10, y: 45 }, { x: 92, y: 38 }, { x: 50, y: 35 },
      { x: 35, y: 45 }, { x: 65, y: 45 }, { x: 50, y: 70 }, { x: 50, y: 90 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [2, 6], [3, 7], [4, 8],
      [0, 9], [2, 10], [4, 11], [11, 12], [0, 13], [4, 14], [1, 15],
      [3, 15], [1, 16], [3, 17], [2, 18], [18, 19]
    ],
  },
  {
    id: 'c5_pegasus',
    name: 'Pegasus',
    latinName: 'The Winged Horse',
    mythology: 'The winged steed soaring across celestial horizons.',
    totalLevels: 20,
    order: 5,
    requiredStars: 110,
    starsCoordinates: [
      { x: 30, y: 35 }, { x: 65, y: 35 }, { x: 65, y: 68 }, { x: 30, y: 68 },
      { x: 80, y: 20 }, { x: 90, y: 30 }, { x: 75, y: 85 }, { x: 85, y: 92 },
      { x: 20, y: 25 }, { x: 12, y: 45 }, { x: 15, y: 75 }, { x: 22, y: 88 },
      { x: 48, y: 20 }, { x: 48, y: 50 }, { x: 48, y: 80 }, { x: 60, y: 15 },
      { x: 72, y: 12 }, { x: 38, y: 15 }, { x: 25, y: 52 }, { x: 70, y: 52 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [4, 5], [2, 6], [6, 7],
      [0, 8], [8, 9], [3, 10], [10, 11], [0, 12], [1, 12], [0, 13],
      [1, 13], [2, 14], [3, 14], [4, 15], [15, 16]
    ],
  },
  {
    id: 'c6_andromeda',
    name: 'Andromeda',
    latinName: 'The Spiral Galaxy',
    mythology: 'Gateway to spiral starbursts and cosmic wonders.',
    totalLevels: 20,
    order: 6,
    requiredStars: 140,
    starsCoordinates: [
      { x: 20, y: 80 }, { x: 35, y: 65 }, { x: 50, y: 50 }, { x: 65, y: 35 },
      { x: 80, y: 20 }, { x: 42, y: 42 }, { x: 58, y: 58 }, { x: 28, y: 50 },
      { x: 72, y: 50 }, { x: 50, y: 25 }, { x: 50, y: 75 }, { x: 15, y: 60 },
      { x: 85, y: 40 }, { x: 30, y: 25 }, { x: 70, y: 75 }, { x: 60, y: 18 },
      { x: 40, y: 82 }, { x: 25, y: 38 }, { x: 75, y: 62 }, { x: 50, y: 92 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [2, 6], [1, 7], [3, 8],
      [2, 9], [2, 10], [7, 11], [8, 12], [5, 13], [6, 14], [9, 15],
      [10, 16], [5, 17], [6, 18], [10, 19], [0, 11]
    ],
  },
  {
    id: 'c7_draco',
    name: 'The Dragon',
    latinName: 'Draco',
    mythology: 'The ancient serpentine serpent coiling around the northern pole.',
    totalLevels: 20,
    order: 7,
    requiredStars: 170,
    starsCoordinates: [
      { x: 85, y: 18 }, { x: 75, y: 15 }, { x: 70, y: 25 }, { x: 80, y: 30 },
      { x: 62, y: 35 }, { x: 50, y: 32 }, { x: 42, y: 44 }, { x: 48, y: 56 },
      { x: 62, y: 62 }, { x: 75, y: 68 }, { x: 68, y: 80 }, { x: 52, y: 85 },
      { x: 38, y: 78 }, { x: 28, y: 68 }, { x: 20, y: 52 }, { x: 18, y: 35 },
      { x: 25, y: 22 }, { x: 35, y: 18 }, { x: 50, y: 18 }, { x: 58, y: 12 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6], [6, 7],
      [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14],
      [14, 15], [15, 16], [16, 17], [17, 18], [18, 19]
    ],
  },
  {
    id: 'c8_cygnus',
    name: 'The Swan',
    latinName: 'Cygnus',
    mythology: 'The celestial swan gliding along the silver Milky Way.',
    totalLevels: 20,
    order: 8,
    requiredStars: 200,
    starsCoordinates: [
      { x: 50, y: 15 }, { x: 50, y: 35 }, { x: 50, y: 55 }, { x: 50, y: 80 },
      { x: 20, y: 55 }, { x: 35, y: 55 }, { x: 65, y: 55 }, { x: 80, y: 55 },
      { x: 15, y: 45 }, { x: 85, y: 45 }, { x: 12, y: 65 }, { x: 88, y: 65 },
      { x: 40, y: 25 }, { x: 60, y: 25 }, { x: 40, y: 70 }, { x: 60, y: 70 },
      { x: 48, y: 92 }, { x: 52, y: 92 }, { x: 30, y: 40 }, { x: 70, y: 40 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [4, 5], [5, 2], [2, 6], [6, 7], [4, 8],
      [7, 9], [4, 10], [7, 11], [1, 12], [1, 13], [2, 14], [2, 15],
      [3, 16], [3, 17], [5, 18], [6, 19], [0, 1]
    ],
  },
  {
    id: 'c9_phoenix',
    name: 'The Phoenix',
    latinName: 'Phoenix',
    mythology: 'The immortal bird of fire reborn in luminous radiant splendor.',
    totalLevels: 20,
    order: 9,
    requiredStars: 240,
    starsCoordinates: [
      { x: 50, y: 12 }, { x: 48, y: 28 }, { x: 50, y: 45 }, { x: 50, y: 65 },
      { x: 22, y: 38 }, { x: 32, y: 42 }, { x: 68, y: 42 }, { x: 78, y: 38 },
      { x: 15, y: 25 }, { x: 85, y: 25 }, { x: 25, y: 75 }, { x: 38, y: 85 },
      { x: 50, y: 92 }, { x: 62, y: 85 }, { x: 75, y: 75 }, { x: 40, y: 55 },
      { x: 60, y: 55 }, { x: 35, y: 25 }, { x: 65, y: 25 }, { x: 50, y: 35 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [4, 5], [5, 2], [2, 6], [6, 7], [4, 8],
      [7, 9], [3, 10], [10, 11], [11, 12], [12, 13], [13, 14], [3, 14],
      [2, 15], [2, 16], [1, 17], [1, 18], [1, 19]
    ],
  },
  {
    id: 'c10_galaxy',
    name: 'The Galaxy',
    latinName: 'Milky Way Core',
    mythology: 'The grand celestial core where all stars and labyrinths converge.',
    totalLevels: 20,
    order: 10,
    requiredStars: 280,
    starsCoordinates: [
      { x: 50, y: 50 }, { x: 40, y: 42 }, { x: 30, y: 38 }, { x: 20, y: 42 },
      { x: 15, y: 55 }, { x: 22, y: 68 }, { x: 35, y: 72 }, { x: 48, y: 65 },
      { x: 60, y: 58 }, { x: 70, y: 62 }, { x: 80, y: 58 }, { x: 85, y: 45 },
      { x: 78, y: 32 }, { x: 65, y: 28 }, { x: 52, y: 35 }, { x: 50, y: 20 },
      { x: 20, y: 25 }, { x: 80, y: 78 }, { x: 22, y: 85 }, { x: 80, y: 15 },
    ],
    connections: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
      [0, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 0],
      [14, 15], [2, 16], [9, 17], [5, 18]
    ],
  },
];

// Base scoring table per difficulty as instructed in the prompt
export const BASE_POINTS: Record<Difficulty, number> = {
  very_easy: 10,
  easy: 20,
  normal: 35,
  medium: 50,
  hard: 75,
  very_hard: 100,
  expert: 150,
  master: 200,
};

// Generate 200 standard playable levels (20 per constellation)
export function generateInitialLevels(): PuzzleDefinition[] {
  const levels: PuzzleDefinition[] = [];
  const geometries: MazeGeometry[] = ['square', 'circular', 'triangular', 'hexagonal', 'silhouette'];
  const silhouettes: SpecialSilhouette[] = [
    'heart', 'star', 'tree', 'cat', 'rabbit', 'dog', 'guitar', 'diamond', 'butterfly', 'flower'
  ];
  const modes: GameMode[] = [
    'classic', 'time_challenge', 'restricted_moves', 'token_collection', 'intertwined', 'hidden', 'mirror'
  ];
  const difficulties: Difficulty[] = [
    'very_easy', 'easy', 'normal', 'medium', 'hard', 'very_hard', 'expert', 'master'
  ];

  CONSTELLATIONS.forEach((constellation, cIdx) => {
    for (let lvl = 1; lvl <= constellation.totalLevels; lvl++) {
      const globalIndex = cIdx * 20 + lvl;
      const seed = 1000 + globalIndex * 73;

      // Progressive difficulty mapping
      let diffIndex = 0;
      if (cIdx < 2) {
        diffIndex = Math.min(2, Math.floor(lvl / 7)); // very_easy to normal
      } else if (cIdx < 5) {
        diffIndex = Math.min(4, 1 + Math.floor(lvl / 6)); // easy to hard
      } else if (cIdx < 8) {
        diffIndex = Math.min(6, 2 + Math.floor(lvl / 5)); // normal to expert
      } else {
        diffIndex = Math.min(7, 4 + Math.floor(lvl / 5)); // hard to master
      }
      const difficulty = difficulties[diffIndex];

      // Rotate geometries and special silhouettes
      const geo = geometries[(globalIndex + lvl) % geometries.length];
      const sil = geo === 'silhouette' ? silhouettes[globalIndex % silhouettes.length] : undefined;

      // Rotate game modes
      const mode = modes[(globalIndex * 2 + lvl) % modes.length];

      // Dimensions based on difficulty
      let width = 6 + diffIndex * 3;
      let height = 6 + diffIndex * 3;
      if (geo === 'circular') {
        width = Math.min(18, 6 + diffIndex * 2);
        height = width;
      }

      // Generous, realistically achievable constraints for special modes
      const timeLimit = mode === 'time_challenge' ? 60 + diffIndex * 45 : undefined;
      const moveLimit = mode === 'restricted_moves' ? 35 + diffIndex * 22 : undefined;

      levels.push({
        id: `lvl_${cIdx + 1}_${lvl}`,
        constellationId: constellation.id,
        levelNumber: lvl,
        name: `${constellation.name} - Star ${lvl}`,
        geometry: geo,
        silhouette: sil,
        width,
        height,
        difficulty,
        mode,
        seed,
        timeLimit,
        moveLimit,
        basePoints: BASE_POINTS[difficulty],
        isPublished: true,
      });
    }
  });

  return levels;
}

export const INITIAL_LEVELS = generateInitialLevels();

// Deterministic Daily Challenge based on UTC date
export function getDailyChallenge(dateStr?: string): PuzzleDefinition {
  const d = dateStr || new Date().toISOString().slice(0, 10);
  // Numeric hash of date string
  let hash = 0;
  for (let i = 0; i < d.length; i++) {
    hash = (hash << 5) - hash + d.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash) + 50000;
  const difficulties: Difficulty[] = ['normal', 'medium', 'hard'];
  const diff = difficulties[Math.abs(hash) % difficulties.length];
  const modes: GameMode[] = ['time_challenge', 'token_collection', 'classic'];
  const mode = modes[Math.abs(hash >> 2) % modes.length];

  return {
    id: `daily_${d}`,
    name: `Daily Labyrinth (${d})`,
    geometry: 'square',
    width: 16,
    height: 16,
    difficulty: diff,
    mode,
    seed,
    timeLimit: mode === 'time_challenge' ? 120 : undefined,
    basePoints: BASE_POINTS[diff] * 2, // Double points for daily challenge
  };
}

// Deterministic Weekly Challenge
export function getWeeklyChallenge(): PuzzleDefinition {
  const now = new Date();
  const startYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((now.getTime() - startYear.getTime()) / 86400000) + startYear.getDay() + 1) / 7);
  const weekKey = `${now.getFullYear()}_W${weekNumber}`;
  const seed = 999000 + weekNumber * 1337;

  return {
    id: `weekly_${weekKey}`,
    name: `Weekly Master Labyrinth (Week ${weekNumber})`,
    geometry: 'silhouette',
    silhouette: 'star',
    width: 22,
    height: 22,
    difficulty: 'expert',
    mode: 'intertwined',
    seed,
    timeLimit: 240,
    basePoints: 300,
  };
}

// 12 Built-in Achievements
export const INITIAL_ACHIEVEMENTS = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your first maze puzzle.',
    category: 'progression' as const,
    icon: 'Compass',
    requirement: 1,
    pointsReward: 50,
  },
  {
    id: 'maze_explorer',
    title: 'Maze Explorer',
    description: 'Complete 25 maze puzzles.',
    category: 'progression' as const,
    icon: 'MapPin',
    requirement: 25,
    pointsReward: 150,
  },
  {
    id: 'labyrinth_expert',
    title: 'Labyrinth Expert',
    description: 'Complete 100 maze puzzles.',
    category: 'progression' as const,
    icon: 'Trophy',
    requirement: 100,
    pointsReward: 500,
  },
  {
    id: 'speed_runner',
    title: 'Speed Runner',
    description: 'Beat a Time Challenge with more than 10 seconds remaining.',
    category: 'performance' as const,
    icon: 'Zap',
    requirement: 1,
    pointsReward: 100,
  },
  {
    id: 'perfect_route',
    title: 'Perfect Route',
    description: 'Solve a maze using the optimal minimum moves.',
    category: 'performance' as const,
    icon: 'Target',
    requirement: 1,
    pointsReward: 120,
  },
  {
    id: 'three_star_collector',
    title: 'Three-Star Collector',
    description: 'Earn 30 three-star ratings across all labyrinths.',
    category: 'performance' as const,
    icon: 'Star',
    requirement: 30,
    pointsReward: 300,
  },
  {
    id: 'shape_explorer',
    title: 'Shape Explorer',
    description: 'Solve a maze in all 4 geometries and special silhouettes.',
    category: 'exploration' as const,
    icon: 'Hexagon',
    requirement: 5,
    pointsReward: 200,
  },
  {
    id: 'portal_traveller',
    title: 'Portal Traveller',
    description: 'Travel through 15 teleportation portals.',
    category: 'exploration' as const,
    icon: 'Infinity',
    requirement: 15,
    pointsReward: 150,
  },
  {
    id: 'treasure_hunter',
    title: 'Treasure Hunter',
    description: 'Collect 50 glowing tokens.',
    category: 'exploration' as const,
    icon: 'Gem',
    requirement: 50,
    pointsReward: 200,
  },
  {
    id: 'daily_challenger',
    title: 'Daily Challenger',
    description: 'Complete 3 Daily Maze challenges.',
    category: 'competition' as const,
    icon: 'Calendar',
    requirement: 3,
    pointsReward: 250,
  },
  {
    id: 'constellation_master',
    title: 'Constellation Master',
    description: 'Complete all 20 stars of any constellation.',
    category: 'progression' as const,
    icon: 'Sparkles',
    requirement: 20,
    pointsReward: 400,
  },
  {
    id: 'shadow_walker',
    title: 'Shadow Walker',
    description: 'Solve 5 Hidden Fog of War mazes.',
    category: 'exploration' as const,
    icon: 'EyeOff',
    requirement: 5,
    pointsReward: 180,
  },
];
