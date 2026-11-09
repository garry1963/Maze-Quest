import {
  Coordinate,
  Difficulty,
  GameMode,
  MazeGeometry,
  MazeGraph,
  MazeNode,
  Portal,
  CollectibleToken,
  SpecialSilhouette,
} from '../types/game';

// Deterministic Mulberry32 PRNG
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 10 Distinct silhouettes (matrices where 1 = inside shape, 0 = empty)
export const SILHOUETTE_MASKS: Record<SpecialSilhouette, number[][]> = {
  heart: [
    [0, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
  ],
  star: [
    [0, 0, 0, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 0],
    [1, 1, 0, 0, 0, 1, 1],
  ],
  tree: [
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
  ],
  cat: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 1],
  ],
  rabbit: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 1, 1],
    [0, 1, 0],
    [1, 1, 1],
    [1, 1, 1],
    [1, 0, 1],
  ],
  dog: [
    [1, 1, 0, 0, 0],
    [1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1],
    [0, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0],
  ],
  guitar: [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 1, 1],
    [0, 1, 0],
  ],
  diamond: [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  butterfly: [
    [1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
  ],
  flower: [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
};

// Scale mask up to the target dimension
function scaleMask(mask: number[][], targetW: number, targetH: number): boolean[][] {
  const srcH = mask.length;
  const srcW = mask[0].length;
  const result: boolean[][] = [];

  for (let y = 0; y < targetH; y++) {
    result[y] = [];
    const srcY = Math.min(srcH - 1, Math.floor((y / targetH) * srcH));
    for (let x = 0; x < targetW; x++) {
      const srcX = Math.min(srcW - 1, Math.floor((x / targetW) * srcW));
      result[y][x] = mask[srcY][srcX] === 1;
    }
  }
  return result;
}

// Calculate consistent concentric polar maze parameters
export function getCircularParams(width: number, height: number): { numRings: number; numSectors: number } {
  const numRings = Math.max(3, Math.min(10, Math.floor(Math.min(width, height) / 2)));
  const numSectors = Math.max(12, Math.min(24, 8 + numRings * 2));
  return { numRings, numSectors };
}

// Generate Maze Graph using Randomized DFS
export function generateMaze(
  geometry: MazeGeometry,
  width: number,
  height: number,
  seed: number,
  mode: GameMode = 'classic',
  difficulty: Difficulty = 'normal',
  silhouette?: SpecialSilhouette
): MazeGraph {
  const prng = createPRNG(seed);
  const nodes = new Map<string, MazeNode>();

  // Determine active cell set based on geometry
  const cellKeys: string[] = [];
  const coordsMap = new Map<string, Coordinate>();

  if (geometry === 'square') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const id = `${x},${y}`;
        cellKeys.push(id);
        coordsMap.set(id, { x, y });
        nodes.set(id, { id, coord: { x, y }, neighbors: [] });
      }
    }
  } else if (geometry === 'silhouette') {
    const silKey = silhouette || 'heart';
    const rawMask = SILHOUETTE_MASKS[silKey] || SILHOUETTE_MASKS.heart;
    const scaled = scaleMask(rawMask, width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (scaled[y][x]) {
          const id = `${x},${y}`;
          cellKeys.push(id);
          coordsMap.set(id, { x, y });
          nodes.set(id, { id, coord: { x, y }, neighbors: [] });
        }
      }
    }
  } else if (geometry === 'circular') {
    // Concentric rings with uniform sector subdivision guaranteeing 100% reciprocal symmetry
    const { numRings, numSectors } = getCircularParams(width, height);
    for (let r = 0; r < numRings; r++) {
      for (let s = 0; s < numSectors; s++) {
        const id = `r${r}_s${s}`;
        cellKeys.push(id);
        coordsMap.set(id, { x: s, y: r, ring: r, sector: s });
        nodes.set(id, { id, coord: { x: s, y: r, ring: r, sector: s }, neighbors: [] });
      }
    }
  } else if (geometry === 'triangular') {
    // Triangular isometric grid
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const id = `${x},${y}`;
        cellKeys.push(id);
        coordsMap.set(id, { x, y });
        nodes.set(id, { id, coord: { x, y }, neighbors: [] });
      }
    }
  } else if (geometry === 'hexagonal') {
    // Hexagonal cell grid
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const id = `${x},${y}`;
        cellKeys.push(id);
        coordsMap.set(id, { x, y });
        nodes.set(id, { id, coord: { x, y }, neighbors: [] });
      }
    }
  }

  // Fallback if empty
  if (cellKeys.length === 0) {
    const fallbackId = '0,0';
    cellKeys.push(fallbackId);
    coordsMap.set(fallbackId, { x: 0, y: 0 });
    nodes.set(fallbackId, { id: fallbackId, coord: { x: 0, y: 0 }, neighbors: [] });
  }

  // Adjacency potential function
  const getPotentialNeighbors = (id: string): string[] => {
    const c = coordsMap.get(id);
    if (!c) return [];
    const potential: string[] = [];

    if (geometry === 'square' || geometry === 'silhouette') {
      const deltas = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
      ];
      for (const d of deltas) {
        const nid = `${c.x + d.dx},${c.y + d.dy}`;
        if (nodes.has(nid)) potential.push(nid);
      }
    } else if (geometry === 'circular') {
      const r = c.ring!;
      const s = c.sector!;
      const { numRings, numSectors } = getCircularParams(width, height);

      // 1. Clockwise & Counter-clockwise in same ring
      const prevSector = (s - 1 + numSectors) % numSectors;
      const nextSector = (s + 1) % numSectors;
      potential.push(`r${r}_s${prevSector}`);
      potential.push(`r${r}_s${nextSector}`);

      // 2. Inward ring connection (towards center)
      if (r > 0) {
        potential.push(`r${r - 1}_s${s}`);
      }

      // 3. Outward ring connection (towards outer rim)
      if (r < numRings - 1) {
        potential.push(`r${r + 1}_s${s}`);
      }
    } else if (geometry === 'triangular') {
      // Triangle pointing up (x + y is even) or pointing down (odd)
      const isUp = (c.x + c.y) % 2 === 0;
      // Horizontals:
      const left = `${c.x - 1},${c.y}`;
      const right = `${c.x + 1},${c.y}`;
      if (nodes.has(left)) potential.push(left);
      if (nodes.has(right)) potential.push(right);
      // Vertical base neighbor:
      const vertY = isUp ? c.y + 1 : c.y - 1;
      const vert = `${c.x},${vertY}`;
      if (nodes.has(vert)) potential.push(vert);
    } else if (geometry === 'hexagonal') {
      // Axial offset coordinates (even-q layout)
      const isEvenCol = c.x % 2 === 0;
      const deltas = isEvenCol
        ? [
            { dx: 0, dy: -1 }, // N
            { dx: 1, dy: -1 }, // NE
            { dx: 1, dy: 0 },  // SE
            { dx: 0, dy: 1 },  // S
            { dx: -1, dy: 0 }, // SW
            { dx: -1, dy: -1 },// NW
          ]
        : [
            { dx: 0, dy: -1 }, // N
            { dx: 1, dy: 0 },  // NE
            { dx: 1, dy: 1 },  // SE
            { dx: 0, dy: 1 },  // S
            { dx: -1, dy: 1 }, // SW
            { dx: -1, dy: 0 }, // NW
          ];
      for (const d of deltas) {
        const nid = `${c.x + d.dx},${c.y + d.dy}`;
        if (nodes.has(nid)) potential.push(nid);
      }
    }

    return potential.filter((p) => nodes.has(p));
  };

  // Randomized DFS / Backtracking Maze Generation
  const visited = new Set<string>();
  const startNodeId = geometry === 'circular' ? 'r0_s0' : cellKeys[0];
  const stack: string[] = [startNodeId];
  visited.add(startNodeId);

  while (stack.length > 0) {
    const currentId = stack[stack.length - 1];
    const neighbors = getPotentialNeighbors(currentId).filter((n) => !visited.has(n));

    if (neighbors.length > 0) {
      // Pick random unvisited neighbor
      const nextIdx = Math.floor(prng() * neighbors.length);
      const chosen = neighbors[nextIdx];

      // Connect passage
      nodes.get(currentId)!.neighbors.push(chosen);
      nodes.get(chosen)!.neighbors.push(currentId);

      visited.add(chosen);
      stack.push(chosen);
    } else {
      stack.pop();
    }
  }

  // Ensure all disconnected islands are bridged
  for (const key of cellKeys) {
    if (!visited.has(key)) {
      const candidates = getPotentialNeighbors(key).filter((n) => visited.has(n));
      if (candidates.length > 0) {
        const bridge = candidates[Math.floor(prng() * candidates.length)];
        nodes.get(key)!.neighbors.push(bridge);
        nodes.get(bridge)!.neighbors.push(key);
        visited.add(key);
      }
    }
  }

  // Find furthest node using BFS from startNodeId for optimal challenging exit
  const { distances, prev } = bfs(nodes, startNodeId);

  let maxDist = -1;
  let exitNodeId = cellKeys[cellKeys.length - 1];

  if (geometry === 'circular') {
    const { numRings } = getCircularParams(width, height);
    const outerRing = numRings - 1;
    // Prefer furthest node on the outermost ring for a full concentric labyrinth journey
    for (const [id, dist] of distances.entries()) {
      const node = nodes.get(id);
      if (node && node.coord.ring === outerRing && dist > maxDist) {
        maxDist = dist;
        exitNodeId = id;
      }
    }
  }

  // Fallback to absolute furthest node if no outer ring node found or for other geometries
  if (maxDist === -1) {
    for (const [id, dist] of distances.entries()) {
      if (dist > maxDist) {
        maxDist = dist;
        exitNodeId = id;
      }
    }
  }

  // Reconstruct shortest solution path
  const solutionPath: string[] = [];
  let curr: string | undefined = exitNodeId;
  while (curr) {
    solutionPath.unshift(curr);
    curr = prev.get(curr);
  }

  nodes.get(startNodeId)!.isStart = true;
  nodes.get(exitNodeId)!.isExit = true;

  // Intertwined mode: generate portals
  let portals: Portal[] | undefined = undefined;
  if (mode === 'intertwined' && cellKeys.length > 12) {
    portals = [];
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#a855f7'];
    const portalCount = Math.min(2, Math.floor(cellKeys.length / 15));
    
    // Choose non-start, non-exit points away from each other
    for (let p = 0; p < portalCount; p++) {
      const idxA = Math.floor(cellKeys.length * 0.25) + p * 4;
      const idxB = Math.floor(cellKeys.length * 0.75) - p * 4;
      const idA = cellKeys[Math.min(cellKeys.length - 2, Math.max(1, idxA))];
      const idB = cellKeys[Math.min(cellKeys.length - 2, Math.max(1, idxB))];
      
      const coordA = coordsMap.get(idA)!;
      const coordB = coordsMap.get(idB)!;

      // Connect nodes via portal link
      nodes.get(idA)?.neighbors.push(idB);
      nodes.get(idB)?.neighbors.push(idA);

      portals.push({
        id: `portal_${p}`,
        color: colors[p % colors.length],
        entry: coordA,
        exit: coordB,
      });
    }
  }

  // Token collection mode: scatter 3 to 6 tokens along pathways
  let collectibles: CollectibleToken[] | undefined = undefined;
  if (mode === 'token_collection' && cellKeys.length > 8) {
    collectibles = [];
    const tokenCount = Math.min(6, Math.max(3, Math.floor(cellKeys.length / 8)));
    const step = Math.floor(cellKeys.length / (tokenCount + 1));
    for (let i = 1; i <= tokenCount; i++) {
      const tIdx = Math.min(cellKeys.length - 2, Math.max(1, i * step));
      const tId = cellKeys[tIdx];
      collectibles.push({
        id: `token_${i}`,
        position: coordsMap.get(tId)!,
        collected: false,
      });
    }
  }

  return {
    geometry,
    silhouette,
    width,
    height,
    nodes,
    startNodeId,
    exitNodeId,
    portals,
    collectibles,
    minMoves: solutionPath.length - 1,
    solutionPath,
    difficulty,
    seed,
  };
}

// Breadth-First Search for shortest paths & solvability guarantee
export function bfs(nodes: Map<string, MazeNode>, startId: string) {
  const distances = new Map<string, number>();
  const prev = new Map<string, string>();
  const queue: string[] = [startId];
  distances.set(startId, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const curDist = distances.get(current)!;
    const node = nodes.get(current);
    if (!node) continue;

    for (const neighbor of node.neighbors) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, curDist + 1);
        prev.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  return { distances, prev };
}

// Convert difficulty to grid dimensions
export function getDifficultyDimensions(diff: Difficulty): { w: number; h: number } {
  switch (diff) {
    case 'very_easy':
      return { w: 6, h: 6 };
    case 'easy':
      return { w: 8, h: 8 };
    case 'normal':
      return { w: 12, h: 12 };
    case 'medium':
      return { w: 16, h: 16 };
    case 'hard':
      return { w: 20, h: 20 };
    case 'very_hard':
      return { w: 24, h: 24 };
    case 'expert':
      return { w: 28, h: 28 };
    case 'master':
      return { w: 32, h: 32 };
    default:
      return { w: 12, h: 12 };
  }
}
