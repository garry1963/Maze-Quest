import { ColorTheme, ColorThemeId } from '../types/game';

export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  midnight_blue: {
    id: 'midnight_blue',
    name: 'Midnight Blue',
    bgDark: '#030712', // slate 950
    bgCard: '#0f172a', // slate 900
    wallColor: '#38bdf8', // radiant sky cyan walls
    pathColor: '#070d1e', // subtle dark corridor floor
    playerGlow: '#38bdf8', // sky 400
    playerCore: '#ffffff',
    exitGlow: '#f43f5e', // rose 500
    exitCore: '#ffe4e6',
    accent: '#38bdf8',
    trailColor: '#38bdf8',
  },
  aurora_green: {
    id: 'aurora_green',
    name: 'Aurora Green',
    bgDark: '#02130e',
    bgCard: '#06261d',
    wallColor: '#34d399', // luminous emerald green walls
    pathColor: '#031c14',
    playerGlow: '#34d399', // emerald 400
    playerCore: '#ecfdf5',
    exitGlow: '#a855f7', // purple 500
    exitCore: '#faf5ff',
    accent: '#10b981',
    trailColor: '#34d399',
  },
  cosmic_purple: {
    id: 'cosmic_purple',
    name: 'Cosmic Purple',
    bgDark: '#090514',
    bgCard: '#170c2e',
    wallColor: '#c084fc', // radiant purple walls
    pathColor: '#120a24',
    playerGlow: '#c084fc', // purple 400
    playerCore: '#ffffff',
    exitGlow: '#38bdf8', // sky 400
    exitCore: '#f0f9ff',
    accent: '#a855f7',
    trailColor: '#c084fc',
  },
  sunset_orange: {
    id: 'sunset_orange',
    name: 'Sunset Orange',
    bgDark: '#120703',
    bgCard: '#240d06',
    wallColor: '#fb923c', // radiant warm amber walls
    pathColor: '#200b05',
    playerGlow: '#fb923c', // orange 400
    playerCore: '#fff7ed',
    exitGlow: '#06b6d4', // cyan 500
    exitCore: '#ecfeff',
    accent: '#f97316',
    trailColor: '#fb923c',
  },
  ice_blue: {
    id: 'ice_blue',
    name: 'Ice Blue',
    bgDark: '#040d1a',
    bgCard: '#081a33',
    wallColor: '#67e8f9', // arctic cyan frost walls
    pathColor: '#07152b',
    playerGlow: '#67e8f9', // cyan 300
    playerCore: '#ffffff',
    exitGlow: '#f59e0b', // amber 500
    exitCore: '#fffbeb',
    accent: '#06b6d4',
    trailColor: '#67e8f9',
  },
  emerald_forest: {
    id: 'emerald_forest',
    name: 'Emerald Forest',
    bgDark: '#03140b',
    bgCard: '#082618',
    wallColor: '#4ade80', // bright jade green walls
    pathColor: '#062112',
    playerGlow: '#4ade80', // green 400
    playerCore: '#f0fdf4',
    exitGlow: '#ec4899', // pink 500
    exitCore: '#fdf2f8',
    accent: '#22c55e',
    trailColor: '#4ade80',
  },
  galaxy: {
    id: 'galaxy',
    name: 'Galaxy',
    bgDark: '#070314',
    bgCard: '#13082e',
    wallColor: '#f472b6', // nebula magenta walls
    pathColor: '#100624',
    playerGlow: '#f472b6', // pink 400
    playerCore: '#ffffff',
    exitGlow: '#facc15', // yellow 400
    exitCore: '#fefce8',
    accent: '#ec4899',
    trailColor: '#f472b6',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    bgDark: '#09090b', // zinc 950
    bgCard: '#18181b', // zinc 900
    wallColor: '#e4e4e7', // crisp zinc 200 walls
    pathColor: '#121216',
    playerGlow: '#fafafa', // zinc 50
    playerCore: '#ffffff',
    exitGlow: '#a1a1aa', // zinc 400
    exitCore: '#e4e4e7',
    accent: '#e4e4e7',
    trailColor: '#fafafa',
  },
};
