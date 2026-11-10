import React, { useState } from 'react';
import {
  Palette,
  Volume2,
  VolumeX,
  Compass,
  ArrowLeft,
  Check,
  Music,
  Sliders,
  Gauge,
  Zap,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { COLOR_THEMES } from '../../services/colorThemes';
import { soundManager } from '../../services/audio';
import { ColorThemeId, MovementMode } from '../../types/game';

export const SettingsScreen: React.FC = () => {
  const { setCurrentScreen } = useGame();
  const { profile, updateTheme, updateMovementMode, updatePlayerSpeed } = useAuth();

  const [musicEnabled, setMusicEnabled] = useState(soundManager.musicEnabled);
  const [sfxEnabled, setSfxEnabled] = useState(soundManager.sfxEnabled);
  const [musicVol, setMusicVol] = useState(soundManager.musicVolume);
  const [sfxVol, setSfxVol] = useState(soundManager.sfxVolume);

  const handleToggleMusic = (val: boolean) => {
    setMusicEnabled(val);
    soundManager.setMusicEnabled(val);
  };

  const handleToggleSfx = (val: boolean) => {
    setSfxEnabled(val);
    soundManager.setSfxEnabled(val);
  };

  const handleMusicVol = (val: number) => {
    setMusicVol(val);
    soundManager.setMusicVolume(val);
  };

  const handleSfxVol = (val: number) => {
    setSfxVol(val);
    soundManager.setSfxVolume(val);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <button
          onClick={() => setCurrentScreen('home')}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
          title="Return"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Settings & Themes
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Personalize your labyrinth visual ambiance and controls
          </p>
        </div>
      </div>

      {/* Visual Ambiance / Themes Section */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-bold text-white">Visual Themes</h2>
        </div>
        <p className="text-xs text-slate-400">
          Choose a luminous color palette for walls, player glow, and portals.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {Object.values(COLOR_THEMES).map((theme) => {
            const isSelected = profile.selectedTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => updateTheme(theme.id)}
                className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-800/90 border-sky-400 shadow-lg shadow-sky-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{theme.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                </div>

                {/* Color preview swatches */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: theme.playerGlow }}
                    title="Player Glow"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: theme.wallColor }}
                    title="Wall Color"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: theme.exitGlow }}
                    title="Exit Glow"
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: theme.bgDark }}
                    title="Background"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Movement Controls Configuration */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Movement Controls</h2>
        </div>
        <p className="text-xs text-slate-400">
          Select how your glowing player moves through the labyrinth pathways.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div
            onClick={() => updateMovementMode('continuous')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
              profile.movementMode === 'continuous'
                ? 'bg-slate-800/90 border-emerald-400 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Continuous Glide</span>
              {profile.movementMode === 'continuous' && (
                <Check className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <p className="text-xs text-slate-400">
              The player moves smoothly in the selected direction until encountering a wall or junction. (Standard casual relaxing style)
            </p>
          </div>

          <div
            onClick={() => updateMovementMode('step')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
              profile.movementMode === 'step'
                ? 'bg-slate-800/90 border-emerald-400 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Step-by-Step Movement</span>
              {profile.movementMode === 'step' && (
                <Check className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <p className="text-xs text-slate-400">
              Each swipe or keypress advances the player exactly one cell. Great for strategic puzzle solving and restricted moves mode.
            </p>
          </div>
        </div>

        {/* Player Movement Speed Control */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white">Light Movement Speed</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              {(profile.playerSpeed ?? 10.0).toFixed(1)} cells/sec
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Control how swiftly your glowing orb navigates maze corridors. Can also be adjusted live during gameplay.
          </p>

          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Slow</span>
            <input
              type="range"
              min="4"
              max="22"
              step="0.5"
              value={profile.playerSpeed ?? 10.0}
              onChange={(e) => updatePlayerSpeed(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[11px] text-amber-400/80 font-medium">Hyper</span>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[
              { label: 'Slow', speed: 5.0, icon: '🐢' },
              { label: 'Relaxed', speed: 7.5, icon: '🌿' },
              { label: 'Normal', speed: 10.0, icon: '⚡' },
              { label: 'Fast', speed: 14.0, icon: '🚀' },
              { label: 'Hyper', speed: 19.0, icon: '🔥' },
            ].map((preset) => {
              const active = Math.abs((profile.playerSpeed ?? 10.0) - preset.speed) < 0.25;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updatePlayerSpeed(preset.speed)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    active
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20 font-bold'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <span className="text-xs">{preset.icon}</span>
                  <span className="text-[10px] sm:text-xs truncate">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Audio & Synthesizer Controls */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-5 shadow-xl">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Sound & Ambient Music</h2>
        </div>

        <div className="flex flex-col gap-4">
          {/* Ambient Music */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-850">
            <div>
              <span className="text-sm font-bold text-white block">Relaxing Ambient Drone & Chimes</span>
              <span className="text-xs text-slate-400">Generative pentatonic harmonic frequencies</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVol}
                onChange={(e) => handleMusicVol(parseFloat(e.target.value))}
                className="w-28 accent-sky-400"
              />
              <button
                onClick={() => handleToggleMusic(!musicEnabled)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  musicEnabled
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {musicEnabled ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Tactile SFX */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-850">
            <div>
              <span className="text-sm font-bold text-white block">Sound Effects</span>
              <span className="text-xs text-slate-400">Tactile glide, wall bumps, token chimes and fanfare</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => handleSfxVol(parseFloat(e.target.value))}
                className="w-28 accent-emerald-400"
              />
              <button
                onClick={() => handleToggleSfx(!sfxEnabled)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  sfxEnabled
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {sfxEnabled ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
