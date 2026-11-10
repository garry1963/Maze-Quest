import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ColorTheme, Coordinate, GameMode, MazeGraph, MazeNode, MovementMode } from '../../types/game';
import { soundManager } from '../../services/audio';
import { getCircularParams } from '../../services/mazeEngine';

interface MazeCanvasProps {
  graph: MazeGraph;
  mode: GameMode;
  theme: ColorTheme;
  movementMode: MovementMode;
  speedSetting?: 'relaxed' | 'normal' | 'fast';
  playerSpeed?: number; // Fluid movement velocity in cells/sec (e.g. 4.0 to 22.0)
  showHint?: boolean;
  controllerRef?: React.MutableRefObject<((dir: 'up' | 'down' | 'left' | 'right') => void) | null>;
  onMove?: (movesCount: number) => void;
  onExitReached: () => void;
  onTokenCollected?: (collected: number, total: number) => void;
}

interface AnimationWaypointState {
  isMoving: boolean;
  fromNodeId: string;
  toNodeId: string;
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
  progress: number; // 0.0 to 1.0
  remainingWaypoints: string[];
  currentDir: 'up' | 'down' | 'left' | 'right';
}

export const MazeCanvas: React.FC<MazeCanvasProps> = ({
  graph,
  mode,
  theme,
  movementMode,
  speedSetting = 'normal',
  playerSpeed,
  showHint = false,
  controllerRef,
  onMove,
  onExitReached,
  onTokenCollected,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-performance animation and state refs (prevents 60fps/120fps React re-renders)
  const currentNodeIdRef = useRef<string>(graph.startNodeId);
  const playerPathRef = useRef<string[]>([graph.startNodeId]);
  const collectedTokensRef = useRef<Set<string>>(new Set());
  const exploredNodesRef = useRef<Set<string>>(new Set([graph.startNodeId]));
  const movesRef = useRef<number>(0);
  const hasFinishedRef = useRef<boolean>(false);
  const queuedDirRef = useRef<'up' | 'down' | 'left' | 'right' | null>(null);
  const activeKeyDirRef = useRef<'up' | 'down' | 'left' | 'right' | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchHasMovedRef = useRef<boolean>(false);
  const speedSettingRef = useRef<'relaxed' | 'normal' | 'fast'>(speedSetting);
  speedSettingRef.current = speedSetting;
  const playerSpeedRef = useRef<number | undefined>(playerSpeed);
  playerSpeedRef.current = playerSpeed;

  // Floating sub-pixel head position of the glowing light beam
  const floatingPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Animation state for continuous smooth glide
  const animStateRef = useRef<AnimationWaypointState>({
    isMoving: false,
    fromNodeId: graph.startNodeId,
    toNodeId: graph.startNodeId,
    fromPos: { x: 0, y: 0 },
    toPos: { x: 0, y: 0 },
    progress: 0,
    remainingWaypoints: [],
    currentDir: 'right',
  });

  // Calculate pixel center for any node in any geometry
  const getNodePixelCenter = useCallback(
    (nodeIdOrKey: string, width: number, height: number): { x: number; y: number } => {
      let node = graph.nodes.get(nodeIdOrKey);
      if (!node && nodeIdOrKey.includes(',')) {
        const [cx, cy] = nodeIdOrKey.split(',').map(Number);
        node = Array.from(graph.nodes.values()).find(
          (n) => n.coord.x === cx && n.coord.y === cy
        );
      }
      if (!node) return { x: width / 2, y: height / 2 };

      const pad = 24;
      const renderW = Math.max(10, width - pad * 2);
      const renderH = Math.max(10, height - pad * 2);

      if (graph.geometry === 'circular') {
        const center = { x: width / 2, y: height / 2 };
        const maxRadius = Math.min(renderW, renderH) / 2;
        const { numRings, numSectors } = getCircularParams(graph.width, graph.height);
        const ringWidth = maxRadius / (numRings + 0.5);

        const r = node.coord.ring ?? 0;
        const s = node.coord.sector ?? 0;
        const rMid = (r + 1.0) * ringWidth;
        const angleStep = (Math.PI * 2) / numSectors;
        const angleMid = (s + 0.5) * angleStep - Math.PI / 2;

        return {
          x: center.x + Math.cos(angleMid) * rMid,
          y: center.y + Math.sin(angleMid) * rMid,
        };
      }

      if (graph.geometry === 'hexagonal') {
        const cellW = renderW / (graph.width * 1.5 + 0.5);
        const cellH = renderH / (graph.height + 0.5);
        const R_hex = cellW;
        let cy = pad + (node.coord.y + 0.5) * cellH;
        if (node.coord.x % 2 !== 0) cy += cellH * 0.5;

        return {
          x: pad + (node.coord.x * 1.5 + 1) * R_hex,
          y: cy,
        };
      }

      // Square, Silhouette & Triangular isometric
      const cellW = renderW / graph.width;
      const cellH = renderH / graph.height;
      return {
        x: pad + (node.coord.x + 0.5) * cellW,
        y: pad + (node.coord.y + 0.5) * cellH,
      };
    },
    [graph]
  );

  // Helper to find connected neighbor in a given direction
  const findNextInDir = useCallback(
    (fromId: string, d: 'up' | 'down' | 'left' | 'right'): string | null => {
      const node = graph.nodes.get(fromId);
      if (!node) return null;

      if (graph.geometry === 'circular') {
        const r = node.coord.ring ?? 0;
        const s = node.coord.sector ?? 0;
        const { numRings, numSectors } = getCircularParams(graph.width, graph.height);

        let targetId: string | null = null;
        if (d === 'up') {
          // Inward (towards center)
          if (r > 0) targetId = `r${r - 1}_s${s}`;
        } else if (d === 'down') {
          // Outward (towards outer rim)
          if (r < numRings - 1) targetId = `r${r + 1}_s${s}`;
        } else if (d === 'right') {
          // Clockwise
          targetId = `r${r}_s${(s + 1) % numSectors}`;
        } else if (d === 'left') {
          // Counter-Clockwise
          targetId = `r${r}_s${(s - 1 + numSectors) % numSectors}`;
        }

        if (targetId && node.neighbors.includes(targetId)) {
          return targetId;
        }
        return null;
      }

      for (const nId of node.neighbors) {
        const neighbor = graph.nodes.get(nId);
        if (!neighbor) continue;

        const dx = neighbor.coord.x - node.coord.x;
        const dy = neighbor.coord.y - node.coord.y;

        if (d === 'up' && dy < 0 && Math.abs(dx) <= 1) return nId;
        if (d === 'down' && dy > 0 && Math.abs(dx) <= 1) return nId;
        if (d === 'left' && dx < 0 && Math.abs(dy) <= 1) return nId;
        if (d === 'right' && dx > 0 && Math.abs(dy) <= 1) return nId;
      }
      return null;
    },
    [graph]
  );

  // Build waypoints strictly in the straight direction `d` (stops at walls and intersections)
  const buildGlideWaypoints = useCallback(
    (fromId: string, firstNextId: string, d: 'up' | 'down' | 'left' | 'right'): string[] => {
      const waypoints: string[] = [firstNextId];
      if (movementMode === 'step') {
        return waypoints;
      }

      let curr = firstNextId;
      const visited = new Set<string>([fromId, firstNextId]);

      // In continuous mode, travel straight along the corridor in direction `d`
      // Stops cleanly when reaching:
      // 1. The Exit portal
      // 2. An Intertwined Teleport Portal
      // 3. An Intersection / Junction with side branching options
      // 4. A Wall in front (no passage straight in direction `d`)
      while (visited.size < 80) {
        // Exit reached -> terminate glide at exit
        if (curr === graph.exitNodeId) {
          break;
        }

        // Portals -> pause at portal for teleportation
        if (mode === 'intertwined' && graph.portals) {
          const currNode = graph.nodes.get(curr);
          if (currNode) {
            const isPortal = graph.portals.some(
              (p) =>
                (p.entry.x === currNode.coord.x && p.entry.y === currNode.coord.y) ||
                (p.exit.x === currNode.coord.x && p.exit.y === currNode.coord.y)
            );
            if (isPortal) break;
          }
        }

        const currNode = graph.nodes.get(curr);
        if (!currNode) break;

        // If this node has 3 or more neighbors (junction with branch choices),
        // stop here so player has full control to choose their next turn!
        if (currNode.neighbors.length > 2) {
          break;
        }

        // Check if there is an open passage straight in the SAME direction `d`
        const nextStraight = findNextInDir(curr, d);
        if (!nextStraight || visited.has(nextStraight)) {
          // Reached wall in direction `d` -> stop at the wall!
          break;
        }

        waypoints.push(nextStraight);
        visited.add(nextStraight);
        curr = nextStraight;
      }

      return waypoints;
    },
    [graph, mode, movementMode, findNextInDir]
  );

  // Start smooth continuous glide through waypoints
  const startGlide = useCallback(
    (waypoints: string[], d: 'up' | 'down' | 'left' | 'right') => {
      if (waypoints.length === 0) return;
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      const w = rect?.width || 600;
      const h = rect?.height || 600;

      const fromId = currentNodeIdRef.current;
      const toId = waypoints[0];
      const remaining = waypoints.slice(1);

      const fromPos = getNodePixelCenter(fromId, w, h);
      const toPos = getNodePixelCenter(toId, w, h);

      animStateRef.current = {
        isMoving: true,
        fromNodeId: fromId,
        toNodeId: toId,
        fromPos,
        toPos,
        progress: 0,
        remainingWaypoints: remaining,
        currentDir: d,
      };
    },
    [getNodePixelCenter]
  );

  // Core movement trigger with immediate redirection and direction queuing
  const triggerMove = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (hasFinishedRef.current) return;

      // In Mirror Mode, invert directional controls
      let actualDir = dir;
      if (mode === 'mirror') {
        if (dir === 'up') actualDir = 'down';
        else if (dir === 'down') actualDir = 'up';
        else if (dir === 'left') actualDir = 'right';
        else if (dir === 'right') actualDir = 'left';
      }

      const curId = currentNodeIdRef.current;

      // If currently moving: allow immediate redirection if the new direction is open from current cell
      if (animStateRef.current.isMoving) {
        const redirectNext = findNextInDir(curId, actualDir);
        if (redirectNext) {
          const waypoints = buildGlideWaypoints(curId, redirectNext, actualDir);
          if (waypoints.length > 0) {
            soundManager.playMove();
            startGlide(waypoints, actualDir);
            movesRef.current += 1;
            if (onMove) onMove(movesRef.current);
            return;
          }
        }
        queuedDirRef.current = actualDir;
        return;
      }

      const nextId = findNextInDir(curId, actualDir);
      if (!nextId) {
        soundManager.playBump();
        return;
      }

      const waypoints = buildGlideWaypoints(curId, nextId, actualDir);
      if (waypoints.length > 0) {
        soundManager.playMove();
        startGlide(waypoints, actualDir);

        movesRef.current += 1;
        if (onMove) {
          onMove(movesRef.current);
        }
      }
    },
    [mode, findNextInDir, buildGlideWaypoints, startGlide, onMove]
  );

  // Expose controller callback to parent (for tablet Virtual D-Pad)
  useEffect(() => {
    if (controllerRef) {
      controllerRef.current = triggerMove;
    }
    return () => {
      if (controllerRef) {
        controllerRef.current = null;
      }
    };
  }, [controllerRef, triggerMove]);

  // Reset state when graph changes
  useEffect(() => {
    currentNodeIdRef.current = graph.startNodeId;
    playerPathRef.current = [graph.startNodeId];
    collectedTokensRef.current = new Set();
    exploredNodesRef.current = new Set([graph.startNodeId]);
    movesRef.current = 0;
    hasFinishedRef.current = false;
    queuedDirRef.current = null;
    activeKeyDirRef.current = null;

    animStateRef.current = {
      isMoving: false,
      fromNodeId: graph.startNodeId,
      toNodeId: graph.startNodeId,
      fromPos: { x: 0, y: 0 },
      toPos: { x: 0, y: 0 },
      progress: 0,
      remainingWaypoints: [],
      currentDir: 'right',
    };

    // Re-render static offscreen cache
    offscreenCanvasRef.current = null;
  }, [graph]);

  // Keyboard navigation with active hold tracking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let dir: 'up' | 'down' | 'left' | 'right' | null = null;
      if (['ArrowUp', 'KeyW'].includes(e.code)) dir = 'up';
      else if (['ArrowDown', 'KeyS'].includes(e.code)) dir = 'down';
      else if (['ArrowLeft', 'KeyA'].includes(e.code)) dir = 'left';
      else if (['ArrowRight', 'KeyD'].includes(e.code)) dir = 'right';

      if (dir) {
        e.preventDefault();
        activeKeyDirRef.current = dir;
        triggerMove(dir);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(
          e.code
        )
      ) {
        activeKeyDirRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerMove]);

  // Tablet & Touchscreen Gesture Handlers: deliberate swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchHasMovedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!touchStartPos.current || touchHasMovedRef.current) return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // Intentional 24px threshold: triggers exactly ONE deliberate straight glide per swipe stroke
    if (Math.max(absX, absY) > 24) {
      const dir: 'up' | 'down' | 'left' | 'right' =
        absX > absY ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';

      triggerMove(dir);
      touchHasMovedRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartPos.current && !touchHasMovedRef.current) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) > 16) {
        const dir: 'up' | 'down' | 'left' | 'right' =
          absX > absY ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        triggerMove(dir);
      }
    }
    touchStartPos.current = null;
    touchHasMovedRef.current = false;
  };

  // Pre-render static maze walls and corridors to Offscreen Canvas (eliminates wall redraw latency)
  // Pre-render static maze walls and corridors to Offscreen Canvas (eliminates wall redraw latency)
  const buildOffscreenMaze = (width: number, height: number, dpr: number) => {
    const off = document.createElement('canvas');
    off.width = Math.round(width * dpr);
    off.height = Math.round(height * dpr);
    const ctx = off.getContext('2d');
    if (!ctx) return off;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.scale(dpr, dpr);

    // Deep luminous ambient background with subtle radial vignette
    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.1,
      width / 2,
      height / 2,
      Math.hypot(width, height) * 0.65
    );
    bgGrad.addColorStop(0, theme.bgCard);
    bgGrad.addColorStop(1, theme.bgDark);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const pad = 24;
    const renderW = Math.max(10, width - pad * 2);
    const renderH = Math.max(10, height - pad * 2);

    // Helper to draw high-definition Start Beacon
    const drawStartBeacon = (sx: number, sy: number, radius: number) => {
      ctx.save();
      // Outer radiant ripple
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(6, radius * 0.42), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner glowing core
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(3, radius * 0.2), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f0f9ff';
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(1.5, radius * 0.1), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Helper to draw high-definition Exit Portal
    const drawExitPortal = (ex: number, ey: number, radius: number) => {
      ctx.save();
      ctx.shadowColor = theme.exitGlow;
      ctx.shadowBlur = 16;
      ctx.fillStyle = theme.exitGlow;
      ctx.beginPath();
      ctx.arc(ex, ey, Math.max(6, radius * 0.36), 0, Math.PI * 2);
      ctx.fill();

      // Outer portal ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ex, ey, Math.max(4, radius * 0.24), 0, Math.PI * 2);
      ctx.stroke();

      // White-hot core
      ctx.fillStyle = theme.exitCore;
      ctx.beginPath();
      ctx.arc(ex, ey, Math.max(2.5, radius * 0.16), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // 1. SQUARE GRID & SILHOUETTE
    if (graph.geometry === 'square' || graph.geometry === 'silhouette') {
      const cellW = renderW / graph.width;
      const cellH = renderH / graph.height;

      // Draw corridor floor with refined subtle cell inlay definition
      graph.nodes.forEach((node) => {
        const x0 = pad + node.coord.x * cellW;
        const y0 = pad + node.coord.y * cellH;

        // Base corridor floor
        ctx.fillStyle = theme.pathColor;
        ctx.fillRect(x0, y0, cellW, cellH);

        // High-definition cell floor inlay
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 + 1, y0 + 1, cellW - 2, cellH - 2);
      });

      // Start beacon
      const startNode = graph.nodes.get(graph.startNodeId);
      if (startNode) {
        const sx = pad + (startNode.coord.x + 0.5) * cellW;
        const sy = pad + (startNode.coord.y + 0.5) * cellH;
        drawStartBeacon(sx, sy, Math.min(cellW, cellH));
      }

      // Exit portal
      const exitNode = graph.nodes.get(graph.exitNodeId);
      if (exitNode) {
        const exitX = pad + (exitNode.coord.x + 0.5) * cellW;
        const exitY = pad + (exitNode.coord.y + 0.5) * cellH;
        drawExitPortal(exitX, exitY, Math.min(cellW, cellH));
      }

      // Collect wall path segments
      const wallThickness = Math.max(2.8, Math.min(6.5, cellW * 0.13));
      const buildSquareWallPaths = () => {
        ctx.beginPath();
        graph.nodes.forEach((node) => {
          const x = node.coord.x;
          const y = node.coord.y;
          const x0 = pad + x * cellW;
          const x1 = x0 + cellW;
          const y0 = pad + y * cellH;
          const y1 = y0 + cellH;

          if (!node.neighbors.includes(`${x},${y - 1}`)) {
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y0);
          }
          if (!node.neighbors.includes(`${x - 1},${y}`)) {
            ctx.moveTo(x0, y0);
            ctx.lineTo(x0, y1);
          }
          if (!graph.nodes.has(`${x},${y + 1}`)) {
            ctx.moveTo(x0, y1);
            ctx.lineTo(x1, y1);
          }
          if (!graph.nodes.has(`${x + 1},${y}`)) {
            ctx.moveTo(x1, y0);
            ctx.lineTo(x1, y1);
          }
        });
      };

      // Pass 1: Neon Structural Wall with atmospheric glow
      ctx.save();
      ctx.lineWidth = wallThickness;
      ctx.lineCap = 'round';
      ctx.strokeStyle = theme.wallColor;
      ctx.shadowColor = theme.wallColor;
      ctx.shadowBlur = 5;
      buildSquareWallPaths();
      ctx.stroke();

      // Pass 2: High-Definition White-Hot Center Ridge for razor-sharp definition
      ctx.lineWidth = Math.max(1.2, wallThickness * 0.28);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.shadowBlur = 0;
      buildSquareWallPaths();
      ctx.stroke();
      ctx.restore();
    }

    // 2. CIRCULAR CONCENTRIC POLAR
    else if (graph.geometry === 'circular') {
      const center = { x: width / 2, y: height / 2 };
      const maxRadius = Math.min(renderW, renderH) / 2;
      const { numRings, numSectors } = getCircularParams(graph.width, graph.height);
      const ringWidth = maxRadius / (numRings + 0.5);

      // Floor of the circular labyrinth
      ctx.fillStyle = theme.pathColor;
      ctx.beginPath();
      ctx.arc(center.x, center.y, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      // Concentric guide track rings
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let r = 1; r <= numRings; r++) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, (r + 0.5) * ringWidth, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Dark central sanctuary hub
      ctx.fillStyle = theme.bgDark;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 0.5 * ringWidth, 0, Math.PI * 2);
      ctx.fill();

      // Central Hub Star Glyph
      ctx.save();
      ctx.fillStyle = theme.wallColor;
      ctx.shadowColor = theme.wallColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(center.x, center.y, Math.max(3, ringWidth * 0.16), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Start beacon at innermost ring (r0_s0)
      const startNode = graph.nodes.get(graph.startNodeId);
      if (startNode) {
        const r = startNode.coord.ring ?? 0;
        const s = startNode.coord.sector ?? 0;
        const angleStep = (Math.PI * 2) / numSectors;
        const rMid = (r + 1.0) * ringWidth;
        const angleMid = (s + 0.5) * angleStep - Math.PI / 2;
        const sx = center.x + Math.cos(angleMid) * rMid;
        const sy = center.y + Math.sin(angleMid) * rMid;
        drawStartBeacon(sx, sy, ringWidth);
      }

      // Exit indicator
      const exitNode = graph.nodes.get(graph.exitNodeId);
      if (exitNode) {
        const r = exitNode.coord.ring ?? 0;
        const s = exitNode.coord.sector ?? 0;
        const angleStep = (Math.PI * 2) / numSectors;
        const rMid = (r + 1.0) * ringWidth;
        const angleMid = (s + 0.5) * angleStep - Math.PI / 2;
        const ex = center.x + Math.cos(angleMid) * rMid;
        const ey = center.y + Math.sin(angleMid) * rMid;
        drawExitPortal(ex, ey, ringWidth);
      }

      // Draw crisp circular walls (Pass 1: Neon wall + Pass 2: Sharp Ridge)
      const wallThickness = Math.max(2.8, Math.min(5.5, ringWidth * 0.13));
      const angleStep = (Math.PI * 2) / numSectors;

      // Pass 1: Neon structural wall
      ctx.save();
      ctx.lineWidth = wallThickness;
      ctx.lineCap = 'round';
      ctx.strokeStyle = theme.wallColor;
      ctx.shadowColor = theme.wallColor;
      ctx.shadowBlur = 4;

      // Inner boundary circle around central hub
      ctx.beginPath();
      ctx.arc(center.x, center.y, 0.5 * ringWidth, 0, Math.PI * 2);
      ctx.stroke();

      graph.nodes.forEach((node) => {
        const r = node.coord.ring ?? 0;
        const s = node.coord.sector ?? 0;
        const a0 = s * angleStep - Math.PI / 2;
        const a1 = (s + 1) * angleStep - Math.PI / 2;
        const rInner = (r + 0.5) * ringWidth;
        const rOuter = (r + 1.5) * ringWidth;

        // Outer Arc Wall
        if (r === numRings - 1) {
          if (node.id !== graph.exitNodeId) {
            ctx.beginPath();
            ctx.arc(center.x, center.y, rOuter, a0, a1);
            ctx.stroke();
          }
        } else {
          const outerId = `r${r + 1}_s${s}`;
          if (!node.neighbors.includes(outerId)) {
            ctx.beginPath();
            ctx.arc(center.x, center.y, rOuter, a0, a1);
            ctx.stroke();
          }
        }

        // Radial Spoke Wall
        const prevS = (s - 1 + numSectors) % numSectors;
        const prevId = `r${r}_s${prevS}`;
        if (!node.neighbors.includes(prevId)) {
          ctx.beginPath();
          ctx.moveTo(center.x + Math.cos(a0) * rInner, center.y + Math.sin(a0) * rInner);
          ctx.lineTo(center.x + Math.cos(a0) * rOuter, center.y + Math.sin(a0) * rOuter);
          ctx.stroke();
        }
      });

      // Pass 2: High-definition white ridge
      ctx.lineWidth = Math.max(1.2, wallThickness * 0.28);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(center.x, center.y, 0.5 * ringWidth, 0, Math.PI * 2);
      ctx.stroke();

      graph.nodes.forEach((node) => {
        const r = node.coord.ring ?? 0;
        const s = node.coord.sector ?? 0;
        const a0 = s * angleStep - Math.PI / 2;
        const a1 = (s + 1) * angleStep - Math.PI / 2;
        const rInner = (r + 0.5) * ringWidth;
        const rOuter = (r + 1.5) * ringWidth;

        if (r === numRings - 1) {
          if (node.id !== graph.exitNodeId) {
            ctx.beginPath();
            ctx.arc(center.x, center.y, rOuter, a0, a1);
            ctx.stroke();
          }
        } else {
          const outerId = `r${r + 1}_s${s}`;
          if (!node.neighbors.includes(outerId)) {
            ctx.beginPath();
            ctx.arc(center.x, center.y, rOuter, a0, a1);
            ctx.stroke();
          }
        }

        const prevS = (s - 1 + numSectors) % numSectors;
        const prevId = `r${r}_s${prevS}`;
        if (!node.neighbors.includes(prevId)) {
          ctx.beginPath();
          ctx.moveTo(center.x + Math.cos(a0) * rInner, center.y + Math.sin(a0) * rInner);
          ctx.lineTo(center.x + Math.cos(a0) * rOuter, center.y + Math.sin(a0) * rOuter);
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    // 3. HEXAGONAL HONEYCOMB
    else if (graph.geometry === 'hexagonal') {
      const cellW = renderW / (graph.width * 1.5 + 0.5);
      const cellH = renderH / (graph.height + 0.5);
      const R_hex = cellW;

      const getHexCenter = (x: number, y: number) => {
        const cx = pad + (x * 1.5 + 1) * R_hex;
        let cy = pad + (y + 0.5) * cellH;
        if (x % 2 !== 0) cy += cellH * 0.5;
        return { cx, cy };
      };

      // Draw corridor floor for hexagons
      graph.nodes.forEach((node) => {
        const { cx, cy } = getHexCenter(node.coord.x, node.coord.y);
        ctx.fillStyle = theme.pathColor;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = cx + R_hex * Math.cos(a);
          const py = cy + R_hex * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Start beacon
      const startNode = graph.nodes.get(graph.startNodeId);
      if (startNode) {
        const { cx, cy } = getHexCenter(startNode.coord.x, startNode.coord.y);
        drawStartBeacon(cx, cy, R_hex);
      }

      // Exit indicator
      const exitNode = graph.nodes.get(graph.exitNodeId);
      if (exitNode) {
        const { cx, cy } = getHexCenter(exitNode.coord.x, exitNode.coord.y);
        drawExitPortal(cx, cy, R_hex);
      }

      // Walls
      const wallThickness = Math.max(2.8, Math.min(5.5, R_hex * 0.13));
      const buildHexWalls = () => {
        ctx.beginPath();
        graph.nodes.forEach((node) => {
          const { cx, cy } = getHexCenter(node.coord.x, node.coord.y);
          const isEven = node.coord.x % 2 === 0;

          const verts: { cx: number; cy: number }[] = [];
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            verts.push({ cx: cx + R_hex * Math.cos(a), cy: cy + R_hex * Math.sin(a) });
          }

          const neighborsByEdge = isEven
            ? [
                `${node.coord.x + 1},${node.coord.y}`,
                `${node.coord.x},${node.coord.y + 1}`,
                `${node.coord.x - 1},${node.coord.y}`,
                `${node.coord.x - 1},${node.coord.y - 1}`,
                `${node.coord.x},${node.coord.y - 1}`,
                `${node.coord.x + 1},${node.coord.y - 1}`,
              ]
            : [
                `${node.coord.x + 1},${node.coord.y + 1}`,
                `${node.coord.x},${node.coord.y + 1}`,
                `${node.coord.x - 1},${node.coord.y + 1}`,
                `${node.coord.x - 1},${node.coord.y}`,
                `${node.coord.x},${node.coord.y - 1}`,
                `${node.coord.x + 1},${node.coord.y}`,
              ];

          for (let i = 0; i < 6; i++) {
            if (!node.neighbors.includes(neighborsByEdge[i])) {
              const v1 = verts[i];
              const v2 = verts[(i + 1) % 6];
              ctx.moveTo(v1.cx, v1.cy);
              ctx.lineTo(v2.cx, v2.cy);
            }
          }
        });
      };

      ctx.save();
      ctx.lineWidth = wallThickness;
      ctx.lineCap = 'round';
      ctx.strokeStyle = theme.wallColor;
      ctx.shadowColor = theme.wallColor;
      ctx.shadowBlur = 4;
      buildHexWalls();
      ctx.stroke();

      ctx.lineWidth = Math.max(1.2, wallThickness * 0.28);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.shadowBlur = 0;
      buildHexWalls();
      ctx.stroke();
      ctx.restore();
    }

    // 4. TRIANGULAR ISOMETRIC
    else if (graph.geometry === 'triangular') {
      const cellW = renderW / graph.width;
      const cellH = renderH / graph.height;

      // Draw corridor floor for triangular
      graph.nodes.forEach((node) => {
        const x = node.coord.x;
        const y = node.coord.y;
        const x0 = pad + x * cellW;
        const x1 = x0 + cellW;
        const y0 = pad + y * cellH;
        const y1 = y0 + cellH;
        const isUp = (x + y) % 2 === 0;
        const cx = (x0 + x1) / 2;

        ctx.fillStyle = theme.pathColor;
        ctx.beginPath();
        if (isUp) {
          ctx.moveTo(cx, y0);
          ctx.lineTo(x0, y1);
          ctx.lineTo(x1, y1);
        } else {
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y0);
          ctx.lineTo(cx, y1);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Start beacon
      const startNode = graph.nodes.get(graph.startNodeId);
      if (startNode) {
        const sx = pad + (startNode.coord.x + 0.5) * cellW;
        const sy = pad + (startNode.coord.y + 0.5) * cellH;
        drawStartBeacon(sx, sy, Math.min(cellW, cellH));
      }

      // Exit indicator
      const exitNode = graph.nodes.get(graph.exitNodeId);
      if (exitNode) {
        const ex = pad + (exitNode.coord.x + 0.5) * cellW;
        const ey = pad + (exitNode.coord.y + 0.5) * cellH;
        drawExitPortal(ex, ey, Math.min(cellW, cellH));
      }

      // Walls
      const wallThickness = Math.max(2.8, Math.min(5.5, cellW * 0.13));
      const buildTriWalls = () => {
        ctx.beginPath();
        graph.nodes.forEach((node) => {
          const x = node.coord.x;
          const y = node.coord.y;
          const x0 = pad + x * cellW;
          const x1 = x0 + cellW;
          const y0 = pad + y * cellH;
          const y1 = y0 + cellH;
          const isUp = (x + y) % 2 === 0;
          const cx = (x0 + x1) / 2;

          if (isUp) {
            if (!node.neighbors.includes(`${x - 1},${y}`)) {
              ctx.moveTo(cx, y0);
              ctx.lineTo(x0, y1);
            }
            if (!node.neighbors.includes(`${x + 1},${y}`)) {
              ctx.moveTo(cx, y0);
              ctx.lineTo(x1, y1);
            }
            if (!node.neighbors.includes(`${x},${y + 1}`)) {
              ctx.moveTo(x0, y1);
              ctx.lineTo(x1, y1);
            }
          } else {
            if (!node.neighbors.includes(`${x - 1},${y}`)) {
              ctx.moveTo(x0, y0);
              ctx.lineTo(cx, y1);
            }
            if (!node.neighbors.includes(`${x + 1},${y}`)) {
              ctx.moveTo(x1, y0);
              ctx.lineTo(cx, y1);
            }
            if (!node.neighbors.includes(`${x},${y - 1}`)) {
              ctx.moveTo(x0, y0);
              ctx.lineTo(x1, y0);
            }
          }
        });
      };

      ctx.save();
      ctx.lineWidth = wallThickness;
      ctx.lineCap = 'round';
      ctx.strokeStyle = theme.wallColor;
      ctx.shadowColor = theme.wallColor;
      ctx.shadowBlur = 4;
      buildTriWalls();
      ctx.stroke();

      ctx.lineWidth = Math.max(1.2, wallThickness * 0.28);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.shadowBlur = 0;
      buildTriWalls();
      ctx.stroke();
      ctx.restore();
    }

    return off;
  };

  // Ultra-Smooth 60/120 FPS Main Loop (requestAnimationFrame)
  useEffect(() => {
    let animFrameId: number;
    let lastTime = performance.now();

    const renderLoop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // HiDPI 2x+ supersampling for razor-sharp board resolution & definition
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(width * dpr);
      const targetH = Math.round(height * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        offscreenCanvasRef.current = null; // Rebuild static cache on resize
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Rebuild offscreen maze cache if needed
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = buildOffscreenMaze(width, height, dpr);
      }

      // 1. ADVANCE MOVEMENT PHYSICS WITH SUB-PIXEL INTERPOLATION
      const anim = animStateRef.current;
      if (anim.isMoving) {
        // Controllable glide speed calibrated from playerSpeed (cells/sec) or preset
        const GLIDE_SPEED =
          playerSpeedRef.current !== undefined
            ? playerSpeedRef.current
            : speedSettingRef.current === 'relaxed'
            ? 6.5
            : speedSettingRef.current === 'fast'
            ? 14.0
            : 10.0;
        anim.progress += GLIDE_SPEED * dt;

        if (anim.progress >= 1.0) {
          // Arrived at toNodeId!
          const arrivedNodeId = anim.toNodeId;
          currentNodeIdRef.current = arrivedNodeId;
          exploredNodesRef.current.add(arrivedNodeId);

          // Update traversed path (prune if retracing)
          const p = playerPathRef.current;
          if (p.length > 1 && p[p.length - 2] === arrivedNodeId) {
            playerPathRef.current = p.slice(0, p.length - 1);
          } else {
            playerPathRef.current = [...p, arrivedNodeId];
          }

          // Check Collectibles
          if (mode === 'token_collection' && graph.collectibles) {
            const arrNode = graph.nodes.get(arrivedNodeId);
            if (arrNode) {
              const token = graph.collectibles.find(
                (c) =>
                  c.position.x === arrNode.coord.x &&
                  c.position.y === arrNode.coord.y &&
                  !collectedTokensRef.current.has(c.id)
              );
              if (token) {
                soundManager.playToken();
                collectedTokensRef.current.add(token.id);
                if (onTokenCollected && graph.collectibles) {
                  onTokenCollected(collectedTokensRef.current.size, graph.collectibles.length);
                }
              }
            }
          }

          // Check Portals
          if (mode === 'intertwined' && graph.portals) {
            const arrNode = graph.nodes.get(arrivedNodeId);
            if (arrNode) {
              const portal = graph.portals.find(
                (pt) =>
                  (pt.entry.x === arrNode.coord.x && pt.entry.y === arrNode.coord.y) ||
                  (pt.exit.x === arrNode.coord.x && pt.exit.y === arrNode.coord.y)
              );
              if (portal) {
                const otherCoord =
                  portal.entry.x === arrNode.coord.x && portal.entry.y === arrNode.coord.y
                    ? portal.exit
                    : portal.entry;
                const otherNode = Array.from(graph.nodes.values()).find(
                  (n) => n.coord.x === otherCoord.x && n.coord.y === otherCoord.y
                );
                if (otherNode && otherNode.id !== arrivedNodeId) {
                  soundManager.playPortal();
                  currentNodeIdRef.current = otherNode.id;
                  playerPathRef.current.push(otherNode.id);
                  exploredNodesRef.current.add(otherNode.id);
                  anim.remainingWaypoints = []; // Stop glide after teleporting
                }
              }
            }
          }

          // Check Exit Reached
          if (arrivedNodeId === graph.exitNodeId) {
            if (
              mode === 'token_collection' &&
              graph.collectibles &&
              collectedTokensRef.current.size < graph.collectibles.length
            ) {
              soundManager.playBump();
              anim.isMoving = false;
              anim.remainingWaypoints = [];
            } else {
              hasFinishedRef.current = true;
              anim.isMoving = false;
              anim.remainingWaypoints = [];
              setTimeout(() => {
                onExitReached();
              }, 200);
            }
          }

          // More waypoints in the current corridor?
          if (!hasFinishedRef.current && anim.remainingWaypoints.length > 0) {
            const nextWaypoint = anim.remainingWaypoints.shift()!;
            anim.fromNodeId = arrivedNodeId;
            anim.toNodeId = nextWaypoint;
            anim.fromPos = getNodePixelCenter(arrivedNodeId, width, height);
            anim.toPos = getNodePixelCenter(nextWaypoint, width, height);
            anim.progress = 0;
          } else if (!hasFinishedRef.current) {
            // Reached a junction! If a direction was queued or an arrow key is held, continue without stopping!
            const nextDir = queuedDirRef.current || activeKeyDirRef.current;
            queuedDirRef.current = null;

            if (nextDir) {
              const nextId = findNextInDir(arrivedNodeId, nextDir);
              if (nextId) {
                const waypoints = buildGlideWaypoints(arrivedNodeId, nextId, nextDir);
                if (waypoints.length > 0) {
                  startGlide(waypoints, nextDir);
                } else {
                  anim.isMoving = false;
                }
              } else {
                anim.isMoving = false;
              }
            } else {
              anim.isMoving = false;
            }
          }
        }
      }

      // Compute exact sub-pixel floating coordinates for the light head
      if (anim.isMoving) {
        // Apply smooth ease-out deceleration when docking into the destination cell
        const isFinalCell = anim.remainingWaypoints.length === 0;
        let t = anim.progress;
        if (isFinalCell) {
          t = Math.sin((t * Math.PI) / 2);
        }
        floatingPosRef.current = {
          x: anim.fromPos.x + (anim.toPos.x - anim.fromPos.x) * t,
          y: anim.fromPos.y + (anim.toPos.y - anim.fromPos.y) * t,
        };
      } else {
        floatingPosRef.current = getNodePixelCenter(currentNodeIdRef.current, width, height);
      }

      // 2. BLIT STATIC MAZE CACHE (< 0.1ms GPU operation)
      ctx.save();
      ctx.scale(dpr, dpr);
      if (offscreenCanvasRef.current) {
        ctx.drawImage(offscreenCanvasRef.current, 0, 0, width, height);
      }

      const pad = 24;
      const renderW = Math.max(10, width - pad * 2);
      const cellW = renderW / graph.width;

      // 3. DRAW HINT ROUTE (if toggled)
      if (showHint && graph.solutionPath.length > 0) {
        ctx.save();
        ctx.lineWidth = Math.max(2, cellW * 0.16);
        ctx.strokeStyle = '#facc15';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        let started = false;
        for (const id of graph.solutionPath) {
          const pt = getNodePixelCenter(id, width, height);
          if (!started) {
            ctx.moveTo(pt.x, pt.y);
            started = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // 4. DRAW UNCOLLECTED TOKENS & PORTALS
      if (mode === 'token_collection' && graph.collectibles) {
        graph.collectibles.forEach((tok) => {
          if (collectedTokensRef.current.has(tok.id)) return;
          const pos = getNodePixelCenter(`${tok.position.x},${tok.position.y}`, width, height);
          ctx.save();
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          const s = Math.max(4, cellW * 0.22);
          ctx.moveTo(pos.x, pos.y - s);
          ctx.lineTo(pos.x + s * 0.7, pos.y);
          ctx.lineTo(pos.x, pos.y + s);
          ctx.lineTo(pos.x - s * 0.7, pos.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      }

      if (mode === 'intertwined' && graph.portals) {
        graph.portals.forEach((portal) => {
          [portal.entry, portal.exit].forEach((p) => {
            const pos = getNodePixelCenter(`${p.x},${p.y}`, width, height);
            ctx.save();
            ctx.shadowColor = portal.color;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = portal.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, Math.max(5, cellW * 0.28), 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = portal.color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, Math.max(2, cellW * 0.12), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        });
      }

      // 5. DRAW RADIANT LIGHT BEAM TRAIL (Continuous fluid line connecting traversed points to floating head)
      const path = playerPathRef.current;
      if (path.length > 0) {
        ctx.save();
        const beamWidth = Math.max(3, cellW * 0.38);

        // Radiant Outer Glow
        ctx.lineWidth = beamWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = theme.trailColor;
        ctx.shadowColor = theme.playerGlow;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
          const pt = getNodePixelCenter(path[i], width, height);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        // Connect to current floating head
        ctx.lineTo(floatingPosRef.current.x, floatingPosRef.current.y);
        ctx.stroke();

        // High-Brightness Laser Core
        ctx.lineWidth = Math.max(1.5, beamWidth * 0.38);
        ctx.strokeStyle = theme.playerCore;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();
      }

      // 6. DRAW GLOWING PLAYER LIGHT ORB AT EXACT FLOATING HEAD
      const px = floatingPosRef.current.x;
      const py = floatingPosRef.current.y;

      ctx.save();
      ctx.shadowColor = theme.playerGlow;
      ctx.shadowBlur = 24;

      const haloRadius = Math.max(14, cellW * 0.75);
      const grad = ctx.createRadialGradient(px, py, 2, px, py, haloRadius);
      grad.addColorStop(0, theme.playerGlow);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, haloRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = theme.playerCore;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(4.5, cellW * 0.25), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 7. FOG OF WAR (Hidden Mode)
      if (mode === 'hidden') {
        ctx.save();
        const maskRadius = Math.max(75, Math.min(width, height) * 0.3);
        const fogGrad = ctx.createRadialGradient(px, py, maskRadius * 0.35, px, py, maskRadius);
        fogGrad.addColorStop(0, 'rgba(0,0,0,0)');
        fogGrad.addColorStop(1, theme.bgDark);
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      ctx.restore();

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [
    graph,
    mode,
    theme,
    showHint,
    getNodePixelCenter,
    findNextInDir,
    buildGlideWaypoints,
    startGlide,
    onExitReached,
    onTokenCollected,
  ]);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center select-none touch-none overscroll-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[620px] max-h-[620px] sm:max-w-[720px] sm:max-h-[720px] lg:max-w-[800px] lg:max-h-[800px] aspect-square rounded-3xl cursor-pointer touch-none shadow-2xl shadow-black/90 ring-1 ring-white/10 border border-slate-700/60 transition-all bg-slate-950"
        onClick={(e) => {
          // Direct tap steering relative to player orb
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;

          const pivotX = floatingPosRef.current.x || rect.width / 2;
          const pivotY = floatingPosRef.current.y || rect.height / 2;

          if (graph.geometry === 'circular') {
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rPlayer = Math.hypot(pivotX - cx, pivotY - cy);
            const rClick = Math.hypot(clickX - cx, clickY - cy);
            const { numRings } = getCircularParams(graph.width, graph.height);
            const maxRadius = Math.min(rect.width, rect.height) / 2;
            const ringWidth = maxRadius / (numRings + 0.5);

            const dr = rClick - rPlayer;
            // If radial difference is significant, steer radially:
            if (Math.abs(dr) > ringWidth * 0.4) {
              triggerMove(dr > 0 ? 'down' : 'up'); // down = outward, up = inward
              return;
            }

            // Angular difference: clockwise vs counter-clockwise
            const thetaClick = Math.atan2(clickY - cy, clickX - cx);
            const thetaPlayer = Math.atan2(pivotY - cy, pivotX - cx);
            let dTheta = thetaClick - thetaPlayer;
            while (dTheta > Math.PI) dTheta -= 2 * Math.PI;
            while (dTheta < -Math.PI) dTheta += 2 * Math.PI;

            triggerMove(dTheta > 0 ? 'right' : 'left'); // right = CW, left = CCW
            return;
          }

          const dx = clickX - pivotX;
          const dy = clickY - pivotY;

          if (Math.abs(dx) > Math.abs(dy)) {
            triggerMove(dx > 0 ? 'right' : 'left');
          } else {
            triggerMove(dy > 0 ? 'down' : 'up');
          }
        }}
      />
    </div>
  );
};
