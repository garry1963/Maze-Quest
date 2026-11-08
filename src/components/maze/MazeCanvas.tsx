import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ColorTheme, Coordinate, GameMode, MazeGraph, MazeNode, MovementMode } from '../../types/game';
import { soundManager } from '../../services/audio';

interface MazeCanvasProps {
  graph: MazeGraph;
  mode: GameMode;
  theme: ColorTheme;
  movementMode: MovementMode;
  showHint?: boolean;
  controllerRef?: React.MutableRefObject<((dir: 'up' | 'down' | 'left' | 'right') => void) | null>;
  onMove?: (movesCount: number) => void;
  onExitReached: () => void;
  onTokenCollected?: (collected: number, total: number) => void;
}

export const MazeCanvas: React.FC<MazeCanvasProps> = ({
  graph,
  mode,
  theme,
  movementMode,
  showHint = false,
  controllerRef,
  onMove,
  onExitReached,
  onTokenCollected,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string>(graph.startNodeId);
  const [playerPath, setPlayerPath] = useState<string[]>([graph.startNodeId]);
  const [collectedTokens, setCollectedTokens] = useState<Set<string>>(new Set());
  const [exploredNodes, setExploredNodes] = useState<Set<string>>(new Set([graph.startNodeId]));
  const [movesCount, setMovesCount] = useState<number>(0);
  const [hasFinished, setHasFinished] = useState<boolean>(false);
  const [isGliding, setIsGliding] = useState<boolean>(false);

  // References for touch swipes and synchronous value tracking
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const currentPosRef = useRef<string>(graph.startNodeId);
  currentPosRef.current = currentNodeId;
  const movesRef = useRef<number>(0);
  const collectedTokensRef = useRef<Set<string>>(new Set());

  // Reset state when graph changes
  useEffect(() => {
    setCurrentNodeId(graph.startNodeId);
    setPlayerPath([graph.startNodeId]);
    setCollectedTokens(new Set());
    collectedTokensRef.current = new Set();
    setExploredNodes(new Set([graph.startNodeId]));
    setMovesCount(0);
    movesRef.current = 0;
    setHasFinished(false);
    setIsGliding(false);
  }, [graph]);

  // Movement executor for stepping into an adjacent neighbor
  const moveTowards = useCallback(
    (targetNodeId: string) => {
      if (hasFinished) return false;
      const currentNode = graph.nodes.get(currentPosRef.current);
      if (!currentNode) return false;

      if (currentNode.neighbors.includes(targetNodeId)) {
        soundManager.playMove();

        // Increment moves cleanly and notify parent safely
        const nextMoves = movesRef.current + 1;
        movesRef.current = nextMoves;
        setMovesCount(nextMoves);
        if (onMove) {
          onMove(nextMoves);
        }

        setCurrentNodeId(targetNodeId);
        setPlayerPath((prev) => {
          // If retracing back one step, prune the trail
          if (prev.length > 1 && prev[prev.length - 2] === targetNodeId) {
            return prev.slice(0, prev.length - 1);
          }
          return [...prev, targetNodeId];
        });
        setExploredNodes((prev) => new Set(prev).add(targetNodeId));

        // Check token collection
        if (mode === 'token_collection' && graph.collectibles) {
          const targetNode = graph.nodes.get(targetNodeId);
          if (targetNode) {
            const token = graph.collectibles.find(
              (c) =>
                c.position.x === targetNode.coord.x &&
                c.position.y === targetNode.coord.y &&
                !collectedTokensRef.current.has(c.id)
            );
            if (token) {
              soundManager.playToken();
              const nextSet = new Set(collectedTokensRef.current).add(token.id);
              collectedTokensRef.current = nextSet;
              setCollectedTokens(nextSet);
              if (onTokenCollected && graph.collectibles) {
                onTokenCollected(nextSet.size, graph.collectibles.length);
              }
            }
          }
        }

        // Check portal teleportation
        if (mode === 'intertwined' && graph.portals) {
          const targetNode = graph.nodes.get(targetNodeId);
          if (targetNode) {
            const portal = graph.portals.find(
              (p) =>
                (p.entry.x === targetNode.coord.x && p.entry.y === targetNode.coord.y) ||
                (p.exit.x === targetNode.coord.x && p.exit.y === targetNode.coord.y)
            );
            if (portal) {
              const otherCoord =
                portal.entry.x === targetNode.coord.x && portal.entry.y === targetNode.coord.y
                  ? portal.exit
                  : portal.entry;
              const otherNode = Array.from(graph.nodes.values()).find(
                (n) => n.coord.x === otherCoord.x && n.coord.y === otherCoord.y
              );
              if (otherNode && otherNode.id !== targetNodeId) {
                soundManager.playPortal();
                setTimeout(() => {
                  setCurrentNodeId(otherNode.id);
                  setPlayerPath((prev) => [...prev, otherNode.id]);
                  setExploredNodes((prev) => new Set(prev).add(otherNode.id));
                }, 100);
              }
            }
          }
        }

        // Check exit reached
        if (targetNodeId === graph.exitNodeId) {
          if (mode === 'token_collection' && graph.collectibles) {
            if (collectedTokensRef.current.size < graph.collectibles.length) {
              soundManager.playBump();
              return true;
            }
          }
          setHasFinished(true);
          setTimeout(() => {
            onExitReached();
          }, 250);
        }

        return true;
      } else {
        soundManager.playBump();
        return false;
      }
    },
    [
      graph,
      hasFinished,
      mode,
      collectedTokens,
      onMove,
      onExitReached,
      onTokenCollected,
    ]
  );

  // Directional movement with continuous glide down corridor or single step
  const moveDirection = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (hasFinished || isGliding) return;
      const cur = graph.nodes.get(currentPosRef.current);
      if (!cur) return;

      // In mirror mode, invert directions
      let actualDir = dir;
      if (mode === 'mirror') {
        if (dir === 'up') actualDir = 'down';
        else if (dir === 'down') actualDir = 'up';
        else if (dir === 'left') actualDir = 'right';
        else if (dir === 'right') actualDir = 'left';
      }

      // Helper to find connected neighbor in the chosen direction
      const findNextInDir = (fromId: string, d: 'up' | 'down' | 'left' | 'right'): string | null => {
        const node = graph.nodes.get(fromId);
        if (!node) return null;

        for (const nId of node.neighbors) {
          const neighbor = graph.nodes.get(nId);
          if (!neighbor) continue;

          if (graph.geometry === 'circular') {
            if (d === 'up' && neighbor.coord.ring !== undefined && node.coord.ring !== undefined && neighbor.coord.ring < node.coord.ring) {
              return nId; // Inward
            }
            if (d === 'down' && neighbor.coord.ring !== undefined && node.coord.ring !== undefined && neighbor.coord.ring > node.coord.ring) {
              return nId; // Outward
            }
            if (d === 'right' && neighbor.coord.ring === node.coord.ring) {
              return nId;
            }
            if (d === 'left' && neighbor.coord.ring === node.coord.ring) {
              return nId;
            }
          } else {
            const dx = neighbor.coord.x - node.coord.x;
            const dy = neighbor.coord.y - node.coord.y;

            if (d === 'up' && dy < 0 && Math.abs(dx) <= 1) return nId;
            if (d === 'down' && dy > 0 && Math.abs(dx) <= 1) return nId;
            if (d === 'left' && dx < 0 && Math.abs(dy) <= 1) return nId;
            if (d === 'right' && dx > 0 && Math.abs(dy) <= 1) return nId;
          }
        }
        return null;
      };

      if (movementMode === 'step') {
        const nextId = findNextInDir(currentPosRef.current, actualDir);
        if (nextId) moveTowards(nextId);
        else soundManager.playBump();
      } else {
        // Continuous Movement: glide forward along the corridor until hitting a wall or junction
        let curId = currentPosRef.current;
        const initialNext = findNextInDir(curId, actualDir);
        if (!initialNext) {
          soundManager.playBump();
          return;
        }

        setIsGliding(true);
        let steps = 0;
        let activeNext: string | null = initialNext;

        const interval = setInterval(() => {
          if (!activeNext || hasFinished) {
            clearInterval(interval);
            setIsGliding(false);
            return;
          }

          moveTowards(activeNext);
          curId = activeNext;
          steps++;

          if (curId === graph.exitNodeId || steps > 60) {
            clearInterval(interval);
            setIsGliding(false);
            return;
          }

          const node = graph.nodes.get(curId);
          if (!node) {
            clearInterval(interval);
            setIsGliding(false);
            return;
          }

          // A junction is reached if there is more than 1 choice forward/sideways
          // Or if dead end is reached (1 neighbor which is where we came from)
          if (node.neighbors.length !== 2) {
            clearInterval(interval);
            setIsGliding(false);
            return;
          }

          // Continue in the same direction or single clear corridor bend
          const straightNext = findNextInDir(curId, actualDir);
          if (straightNext) {
            activeNext = straightNext;
          } else {
            // Reached a turn or wall
            clearInterval(interval);
            setIsGliding(false);
          }
        }, 32);
      }
    },
    [
      graph,
      hasFinished,
      isGliding,
      mode,
      movementMode,
      moveTowards,
    ]
  );

  // Expose controller callback to parent (for tablet Virtual D-Pad)
  useEffect(() => {
    if (controllerRef) {
      controllerRef.current = moveDirection;
    }
    return () => {
      if (controllerRef) {
        controllerRef.current = null;
      }
    };
  }, [controllerRef, moveDirection]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        moveDirection('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        moveDirection('down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        moveDirection('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        moveDirection('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveDirection]);

  // Tablet & Touchscreen Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent default scrolling on touchscreen tablets
    if (e.cancelable) e.preventDefault();
    if (!touchStartPos.current) return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // Continuous Drag: as user drags finger on tablet glass, step or glide
    if (Math.max(absX, absY) > 22) {
      if (absX > absY) {
        moveDirection(dx > 0 ? 'right' : 'left');
      } else {
        moveDirection(dy > 0 ? 'down' : 'up');
      }
      // Re-anchor to current finger position for seamless continuous dragging
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 16) {
      if (absX > absY) {
        moveDirection(dx > 0 ? 'right' : 'left');
      } else {
        moveDirection(dy > 0 ? 'down' : 'up');
      }
    }
    touchStartPos.current = null;
  };

  // Canvas High-Definition Rendering with True Walls and Corridor Route
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Deep dark background
    ctx.fillStyle = theme.bgDark;
    ctx.fillRect(0, 0, width, height);

    const pad = 24;
    const renderW = width - pad * 2;
    const renderH = height - pad * 2;

    const isVisible = (id: string): boolean => {
      if (mode !== 'hidden') return true;
      if (exploredNodes.has(id)) return true;
      const pNode = graph.nodes.get(currentNodeId);
      const target = graph.nodes.get(id);
      if (!pNode || !target) return false;
      const dist = Math.hypot(pNode.coord.x - target.coord.x, pNode.coord.y - target.coord.y);
      return dist <= 2.2;
    };

    // =========================================================================
    // 1. SQUARE GRID & SILHOUETTE MAZE RENDERING (True Walls + Inside Corridors)
    // =========================================================================
    if (graph.geometry === 'square' || graph.geometry === 'silhouette') {
      const cellW = renderW / graph.width;
      const cellH = renderH / graph.height;

      // 1A. Draw Walkable Corridor Floor
      ctx.fillStyle = theme.pathColor;
      graph.nodes.forEach((node) => {
        if (!isVisible(node.id)) return;
        const x0 = pad + node.coord.x * cellW;
        const y0 = pad + node.coord.y * cellH;
        ctx.fillRect(x0, y0, cellW, cellH);
      });

      // 1B. Draw Hint Route along Corridor Centers
      if (showHint && graph.solutionPath.length > 0) {
        ctx.save();
        ctx.lineWidth = Math.max(2, cellW * 0.16);
        ctx.strokeStyle = '#facc15';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        let started = false;
        for (const id of graph.solutionPath) {
          const node = graph.nodes.get(id);
          if (!node) continue;
          const cx = pad + (node.coord.x + 0.5) * cellW;
          const cy = pad + (node.coord.y + 0.5) * cellH;
          if (!started) {
            ctx.moveTo(cx, cy);
            started = true;
          } else {
            ctx.lineTo(cx, cy);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // 1C. Draw The Path of Light (Traversed Route through the Corridors)
      if (playerPath.length > 0) {
        ctx.save();
        const beamWidth = Math.max(3, cellW * 0.38);

        // Outer radiant glow beam
        ctx.lineWidth = beamWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = theme.trailColor;
        ctx.shadowColor = theme.playerGlow;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        for (let i = 0; i < playerPath.length; i++) {
          const node = graph.nodes.get(playerPath[i]);
          if (!node) continue;
          const cx = pad + (node.coord.x + 0.5) * cellW;
          const cy = pad + (node.coord.y + 0.5) * cellH;
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        // Inner bright laser core of the light beam
        ctx.lineWidth = Math.max(1.5, beamWidth * 0.38);
        ctx.strokeStyle = theme.playerCore;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();
      }

      // 1D. Collectibles & Portals inside Corridors
      if (mode === 'token_collection' && graph.collectibles) {
        graph.collectibles.forEach((tok) => {
          if (collectedTokens.has(tok.id)) return;
          const cx = pad + (tok.position.x + 0.5) * cellW;
          const cy = pad + (tok.position.y + 0.5) * cellH;

          ctx.save();
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          const s = Math.max(4, cellW * 0.22);
          ctx.moveTo(cx, cy - s);
          ctx.lineTo(cx + s * 0.7, cy);
          ctx.lineTo(cx, cy + s);
          ctx.lineTo(cx - s * 0.7, cy);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      }

      if (mode === 'intertwined' && graph.portals) {
        graph.portals.forEach((portal) => {
          [portal.entry, portal.exit].forEach((p) => {
            const cx = pad + (p.x + 0.5) * cellW;
            const cy = pad + (p.y + 0.5) * cellH;

            ctx.save();
            ctx.shadowColor = portal.color;
            ctx.shadowBlur = 12;
            ctx.strokeStyle = portal.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(5, cellW * 0.28), 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = portal.color;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(2, cellW * 0.12), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        });
      }

      // 1E. Exit Portal (Inside Exit Cell Corridor)
      const exitNode = graph.nodes.get(graph.exitNodeId);
      if (exitNode && isVisible(exitNode.id)) {
        const exitX = pad + (exitNode.coord.x + 0.5) * cellW;
        const exitY = pad + (exitNode.coord.y + 0.5) * cellH;

        ctx.save();
        ctx.shadowColor = theme.exitGlow;
        ctx.shadowBlur = 16;
        ctx.fillStyle = theme.exitGlow;

        ctx.beginPath();
        ctx.arc(exitX, exitY, Math.max(6, cellW * 0.32), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = theme.exitCore;
        ctx.beginPath();
        ctx.arc(exitX, exitY, Math.max(3, cellW * 0.16), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 1F. Player Glowing Light Orb (Inside Player Cell Corridor)
      const playerNode = graph.nodes.get(currentNodeId);
      if (playerNode) {
        const px = pad + (playerNode.coord.x + 0.5) * cellW;
        const py = pad + (playerNode.coord.y + 0.5) * cellH;

        ctx.save();
        ctx.shadowColor = theme.playerGlow;
        ctx.shadowBlur = 22;

        const haloRadius = Math.max(12, cellW * 0.7);
        const grad = ctx.createRadialGradient(px, py, 2, px, py, haloRadius);
        grad.addColorStop(0, theme.playerGlow);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = theme.playerCore;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(4, cellW * 0.24), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 1G. DRAW SOLID MAZE WALLS (Dividing corridors and perimeter)
      // High-visibility glowing barrier walls separating cells where there is NO passage
      ctx.save();
      const wallThickness = Math.max(2.5, Math.min(6, cellW * 0.12));
      ctx.lineWidth = wallThickness;
      ctx.lineCap = 'round';
      ctx.strokeStyle = theme.wallColor;
      ctx.shadowColor = theme.wallColor;
      ctx.shadowBlur = 4;

      ctx.beginPath();
      graph.nodes.forEach((node) => {
        if (!isVisible(node.id)) return;
        const x = node.coord.x;
        const y = node.coord.y;
        const x0 = pad + x * cellW;
        const x1 = x0 + cellW;
        const y0 = pad + y * cellH;
        const y1 = y0 + cellH;

        // Top Wall: Draw if North neighbor is not connected
        const northId = `${x},${y - 1}`;
        if (!node.neighbors.includes(northId)) {
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y0);
        }

        // Left Wall: Draw if West neighbor is not connected
        const westId = `${x - 1},${y}`;
        if (!node.neighbors.includes(westId)) {
          ctx.moveTo(x0, y0);
          ctx.lineTo(x0, y1);
        }

        // Bottom Wall: Draw if South neighbor is not active
        const southId = `${x},${y + 1}`;
        if (!graph.nodes.has(southId)) {
          ctx.moveTo(x0, y1);
          ctx.lineTo(x1, y1);
        }

        // Right Wall: Draw if East neighbor is not active
        const eastId = `${x + 1},${y}`;
        if (!graph.nodes.has(eastId)) {
          ctx.moveTo(x1, y0);
          ctx.lineTo(x1, y1);
        }
      });
      ctx.stroke();
      ctx.restore();
    }

    // =========================================================================
    // 2. CIRCULAR / CONCENTRIC POLAR MAZE RENDERING (True Curved Walls)
    // =========================================================================
    else if (graph.geometry === 'circular') {
      const center = { x: width / 2, y: height / 2 };
      const maxRadius = Math.min(renderW, renderH) / 2;
      const numRings = Math.max(3, Math.floor(Math.min(graph.width, graph.height) / 2));
      const ringWidth = maxRadius / numRings;

      // Draw Walkable Ring Corridor Floors
      ctx.fillStyle = theme.pathColor;
      ctx.beginPath();
      ctx.arc(center.x, center.y, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw Path of Light through Circular Corridors
      if (playerPath.length > 0) {
        ctx.save();
        ctx.lineWidth = Math.max(3, ringWidth * 0.35);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = theme.trailColor;
        ctx.shadowColor = theme.playerGlow;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        for (let i = 0; i < playerPath.length; i++) {
          const node = graph.nodes.get(playerPath[i]);
          if (!node) continue;
          const r = node.coord.ring || 0;
          const s = node.coord.sector || 0;
          const numSectors = r === 0 ? 4 : Math.min(24, 6 * (r + 1));
          const rMid = (r + 0.5) * ringWidth;
          const angleMid = (s + 0.5) * (Math.PI * 2 / numSectors) - Math.PI / 2;
          const cx = center.x + Math.cos(angleMid) * rMid;
          const cy = center.y + Math.sin(angleMid) * rMid;

          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        ctx.lineWidth = Math.max(1.5, ringWidth * 0.14);
        ctx.strokeStyle = theme.playerCore;
        ctx.stroke();
        ctx.restore();
      }

      // Exit & Player in Circular Maze
      const exitNode = graph.nodes.get(graph.exitNodeId);
      if (exitNode) {
        const r = exitNode.coord.ring || 0;
        const s = exitNode.coord.sector || 0;
        const numSectors = r === 0 ? 4 : Math.min(24, 6 * (r + 1));
        const rMid = (r + 0.5) * ringWidth;
        const angleMid = (s + 0.5) * (Math.PI * 2 / numSectors) - Math.PI / 2;
        const ex = center.x + Math.cos(angleMid) * rMid;
        const ey = center.y + Math.sin(angleMid) * rMid;

        ctx.save();
        ctx.shadowColor = theme.exitGlow;
        ctx.shadowBlur = 14;
        ctx.fillStyle = theme.exitGlow;
        ctx.beginPath();
        ctx.arc(ex, ey, Math.max(5, ringWidth * 0.28), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.exitCore;
        ctx.beginPath();
        ctx.arc(ex, ey, Math.max(2.5, ringWidth * 0.14), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const playerNode = graph.nodes.get(currentNodeId);
      if (playerNode) {
        const r = playerNode.coord.ring || 0;
        const s = playerNode.coord.sector || 0;
        const numSectors = r === 0 ? 4 : Math.min(24, 6 * (r + 1));
        const rMid = (r + 0.5) * ringWidth;
        const angleMid = (s + 0.5) * (Math.PI * 2 / numSectors) - Math.PI / 2;
        const px = center.x + Math.cos(angleMid) * rMid;
        const py = center.y + Math.sin(angleMid) * rMid;

        ctx.save();
        ctx.shadowColor = theme.playerGlow;
        ctx.shadowBlur = 20;
        ctx.fillStyle = theme.playerGlow;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(6, ringWidth * 0.32), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.playerCore;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(3, ringWidth * 0.16), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // DRAW CIRCULAR WALLS (Concentric arc barriers & radial spokes)
      ctx.save();
      ctx.lineWidth = Math.max(2.5, Math.min(5, ringWidth * 0.12));
      ctx.strokeStyle = theme.wallColor;
      ctx.shadowColor = theme.wallColor;
      ctx.shadowBlur = 4;
      ctx.beginPath();

      graph.nodes.forEach((node) => {
        const r = node.coord.ring || 0;
        const s = node.coord.sector || 0;
        const numSectors = r === 0 ? 4 : Math.min(24, 6 * (r + 1));
        const angleStep = (Math.PI * 2) / numSectors;
        const a0 = s * angleStep - Math.PI / 2;
        const a1 = (s + 1) * angleStep - Math.PI / 2;
        const rInner = r * ringWidth;
        const rOuter = (r + 1) * ringWidth;

        // Outer Arc Wall: draw if outermost ring or not connected outward
        if (r === numRings - 1) {
          ctx.arc(center.x, center.y, rOuter, a0, a1);
        } else {
          const outerRingSectors = Math.min(24, 6 * (r + 2));
          const outerS = Math.floor((s / numSectors) * outerRingSectors);
          const outerId = `r${r + 1}_s${outerS}`;
          if (!node.neighbors.includes(outerId)) {
            ctx.arc(center.x, center.y, rOuter, a0, a1);
          }
        }

        // Radial Spoke Wall at a0: draw if not connected counter-clockwise
        const prevS = (s - 1 + numSectors) % numSectors;
        const prevId = `r${r}_s${prevS}`;
        if (!node.neighbors.includes(prevId)) {
          ctx.moveTo(center.x + Math.cos(a0) * rInner, center.y + Math.sin(a0) * rInner);
          ctx.lineTo(center.x + Math.cos(a0) * rOuter, center.y + Math.sin(a0) * rOuter);
        }
      });
      ctx.stroke();
      ctx.restore();
    }

    // =========================================================================
    // 3. HEXAGONAL HONEYCOMB MAZE RENDERING (True Hexagonal Walls)
    // =========================================================================
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

      // Draw Path of Light through Hex Corridors
      if (playerPath.length > 0) {
        ctx.save();
        ctx.lineWidth = Math.max(3, R_hex * 0.4);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = theme.trailColor;
        ctx.shadowColor = theme.playerGlow;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        for (let i = 0; i < playerPath.length; i++) {
          const node = graph.nodes.get(playerPath[i]);
          if (!node) continue;
          const { cx, cy } = getHexCenter(node.coord.x, node.coord.y);
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        ctx.lineWidth = Math.max(1.5, R_hex * 0.16);
        ctx.strokeStyle = theme.playerCore;
        ctx.stroke();
        ctx.restore();
      }

      // Exit & Player
      const exitNode = graph.nodes.get(graph.exitNodeId);
      if (exitNode) {
        const { cx, cy } = getHexCenter(exitNode.coord.x, exitNode.coord.y);
        ctx.save();
        ctx.shadowColor = theme.exitGlow;
        ctx.shadowBlur = 14;
        ctx.fillStyle = theme.exitGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(5, R_hex * 0.3), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.exitCore;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(2.5, R_hex * 0.15), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const playerNode = graph.nodes.get(currentNodeId);
      if (playerNode) {
        const { cx, cy } = getHexCenter(playerNode.coord.x, playerNode.coord.y);
        ctx.save();
        ctx.shadowColor = theme.playerGlow;
        ctx.shadowBlur = 20;
        ctx.fillStyle = theme.playerGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(6, R_hex * 0.35), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.playerCore;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(3, R_hex * 0.18), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // DRAW HEXAGONAL WALLS
      ctx.save();
      ctx.lineWidth = Math.max(2.5, Math.min(5, R_hex * 0.12));
      ctx.strokeStyle = theme.wallColor;
      ctx.shadowColor = theme.wallColor;
      ctx.shadowBlur = 4;
      ctx.beginPath();

      graph.nodes.forEach((node) => {
        const { cx, cy } = getHexCenter(node.coord.x, node.coord.y);
        const isEven = node.coord.x % 2 === 0;

        // 6 hexagonal vertices
        const verts: { x: number; y: number }[] = [];
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          verts.push({ cx: cx + R_hex * Math.cos(a), cy: cy + R_hex * Math.sin(a) } as any);
        }

        // Check 6 directions & draw walls where disconnected
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
          const neighborId = neighborsByEdge[i];
          if (!node.neighbors.includes(neighborId)) {
            const v1 = verts[i];
            const v2 = verts[(i + 1) % 6];
            ctx.moveTo((v1 as any).cx, (v1 as any).cy);
            ctx.lineTo((v2 as any).cx, (v2 as any).cy);
          }
        }
      });
      ctx.stroke();
      ctx.restore();
    }

    // =========================================================================
    // 4. TRIANGULAR ISOMETRIC MAZE RENDERING (True Triangular Walls)
    // =========================================================================
    else if (graph.geometry === 'triangular') {
      const cellW = renderW / graph.width;
      const cellH = renderH / graph.height;

      const getTriCenter = (x: number, y: number) => {
        const cx = pad + (x + 0.5) * cellW;
        const cy = pad + (y + 0.5) * cellH;
        return { cx, cy };
      };

      // Draw Path of Light
      if (playerPath.length > 0) {
        ctx.save();
        ctx.lineWidth = Math.max(3, cellW * 0.35);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = theme.trailColor;
        ctx.shadowColor = theme.playerGlow;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        for (let i = 0; i < playerPath.length; i++) {
          const node = graph.nodes.get(playerPath[i]);
          if (!node) continue;
          const { cx, cy } = getTriCenter(node.coord.x, node.coord.y);
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        ctx.lineWidth = Math.max(1.5, cellW * 0.15);
        ctx.strokeStyle = theme.playerCore;
        ctx.stroke();
        ctx.restore();
      }

      // Exit & Player
      const exitNode = graph.nodes.get(graph.exitNodeId);
      if (exitNode) {
        const { cx, cy } = getTriCenter(exitNode.coord.x, exitNode.coord.y);
        ctx.save();
        ctx.shadowColor = theme.exitGlow;
        ctx.shadowBlur = 14;
        ctx.fillStyle = theme.exitGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(5, cellW * 0.28), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.exitCore;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(2.5, cellW * 0.14), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const playerNode = graph.nodes.get(currentNodeId);
      if (playerNode) {
        const { cx, cy } = getTriCenter(playerNode.coord.x, playerNode.coord.y);
        ctx.save();
        ctx.shadowColor = theme.playerGlow;
        ctx.shadowBlur = 20;
        ctx.fillStyle = theme.playerGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(6, cellW * 0.32), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.playerCore;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(3, cellW * 0.16), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // DRAW TRIANGULAR WALLS
      ctx.save();
      ctx.lineWidth = Math.max(2.5, Math.min(5, cellW * 0.12));
      ctx.strokeStyle = theme.wallColor;
      ctx.shadowColor = theme.wallColor;
      ctx.shadowBlur = 4;
      ctx.beginPath();

      graph.nodes.forEach((node) => {
        const x = node.coord.x;
        const y = node.coord.y;
        const x0 = pad + x * cellW;
        const x1 = x0 + cellW;
        const y0 = pad + y * cellH;
        const y1 = y0 + cellH;
        const isUp = (x + y) % 2 === 0;

        if (isUp) {
          // Pointing up: apex (cx, y0), base-left (x0, y1), base-right (x1, y1)
          const cx = (x0 + x1) / 2;
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
          // Pointing down: apex (cx, y1), top-left (x0, y0), top-right (x1, y0)
          const cx = (x0 + x1) / 2;
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
      ctx.stroke();
      ctx.restore();
    }

    // =========================================================================
    // FOG OF WAR OVERLAY (Hidden Mode)
    // =========================================================================
    if (mode === 'hidden') {
      const pNode = graph.nodes.get(currentNodeId);
      if (pNode) {
        const cellW = renderW / graph.width;
        const cellH = renderH / graph.height;
        const px = pad + (pNode.coord.x + 0.5) * cellW;
        const py = pad + (pNode.coord.y + 0.5) * cellH;

        ctx.save();
        const maskRadius = Math.max(70, Math.min(width, height) * 0.28);
        const fogGrad = ctx.createRadialGradient(
          px,
          py,
          maskRadius * 0.4,
          px,
          py,
          maskRadius
        );
        fogGrad.addColorStop(0, 'rgba(0,0,0,0)');
        fogGrad.addColorStop(1, theme.bgDark);

        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }
  }, [
    graph,
    currentNodeId,
    playerPath,
    collectedTokens,
    exploredNodes,
    theme,
    showHint,
    mode,
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
        className="w-full h-full max-w-[580px] max-h-[580px] sm:max-w-[680px] sm:max-h-[680px] lg:max-w-[760px] lg:max-h-[760px] aspect-square rounded-3xl cursor-pointer touch-none shadow-2xl transition-all"
        onClick={(e) => {
          // Allow tapping directionally relative to the player orb
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;

          let pivotX = rect.width / 2;
          let pivotY = rect.height / 2;

          const pNode = graph.nodes.get(currentNodeId);
          if (pNode && (graph.geometry === 'square' || graph.geometry === 'silhouette')) {
            const pad = 24;
            const renderW = rect.width - pad * 2;
            const renderH = rect.height - pad * 2;
            const cellW = renderW / graph.width;
            const cellH = renderH / graph.height;
            pivotX = pad + (pNode.coord.x + 0.5) * cellW;
            pivotY = pad + (pNode.coord.y + 0.5) * cellH;
          }

          const dx = clickX - pivotX;
          const dy = clickY - pivotY;
          if (Math.abs(dx) > Math.abs(dy)) {
            moveDirection(dx > 0 ? 'right' : 'left');
          } else {
            moveDirection(dy > 0 ? 'down' : 'up');
          }
        }}
      />
    </div>
  );
};
