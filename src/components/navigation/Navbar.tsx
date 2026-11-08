import React, { useState } from 'react';
import {
  Compass,
  Star,
  Trophy,
  User,
  Shield,
  Volume2,
  VolumeX,
  Sparkles,
  Calendar,
  Layers,
  Settings,
  LogIn,
  AlertTriangle,
  Wand2,
} from 'lucide-react';
import { useGame, ScreenType } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../services/audio';
import { AuthModal } from '../modals/AuthModal';

export const Navbar: React.FC = () => {
  const { currentScreen, setCurrentScreen, totalStars, totalPoints, activeTheme } = useGame();
  const { user, profile, isAdmin, isGuest } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(soundManager.musicEnabled);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    soundManager.setMusicEnabled(next);
  };

  const navLinks: { screen: ScreenType; label: string; icon: React.ReactNode }[] = [
    { screen: 'home', label: 'Home', icon: <Compass className="w-4 h-4" /> },
    { screen: 'generator', label: 'Generator', icon: <Wand2 className="w-4 h-4" /> },
    { screen: 'constellations', label: 'Constellations', icon: <Sparkles className="w-4 h-4" /> },
    { screen: 'daily_challenge', label: 'Daily Maze', icon: <Calendar className="w-4 h-4" /> },
    { screen: 'weekly_challenge', label: 'Weekly', icon: <Layers className="w-4 h-4" /> },
    { screen: 'leaderboards', label: 'Rankings', icon: <Trophy className="w-4 h-4" /> },
    { screen: 'achievements', label: 'Badges', icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-slate-800/80 bg-slate-950/70 transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentScreen('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-base md:text-lg text-white tracking-tight flex items-center gap-1.5">
                MAZE <span className="text-xs font-normal text-sky-400 border border-sky-400/30 px-1.5 py-0.2 rounded-md">QUEST</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = currentScreen === link.screen;
              return (
                <button
                  key={link.screen}
                  onClick={() => setCurrentScreen(link.screen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Progress Chips & Profile Controls */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Stars Counter */}
            <div
              onClick={() => setCurrentScreen('constellations')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer hover:bg-amber-500/20 transition-all"
              title="Total Stars Collected"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{totalStars}</span>
            </div>

            {/* Points Counter */}
            <div
              onClick={() => setCurrentScreen('leaderboards')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold cursor-pointer hover:bg-sky-500/20 transition-all"
              title="Total Qualifying Points"
            >
              <Trophy className="w-3.5 h-3.5 text-sky-400" />
              <span>{totalPoints}</span>
            </div>

            {/* Ambient Music Toggle */}
            <button
              onClick={toggleMusic}
              className={`p-2 rounded-xl border text-xs transition-all ${
                musicOn
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={musicOn ? 'Mute Relaxing Music' : 'Play Relaxing Music'}
            >
              {musicOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Admin Dashboard button if admin */}
            {isAdmin && (
              <button
                onClick={() => setCurrentScreen('admin')}
                className={`p-2 rounded-xl border text-xs transition-all ${
                  currentScreen === 'admin'
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-purple-400 hover:bg-purple-500/10'
                }`}
                title="Admin Dashboard"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={() => setCurrentScreen('settings')}
              className={`p-2 rounded-xl border text-xs transition-all ${
                currentScreen === 'settings'
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Settings & Themes"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Auth Button or Profile */}
            {isGuest ? (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentScreen('profile')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  currentScreen === 'profile'
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span className="max-w-[80px] truncate">{profile.displayName}</span>
                {!user?.emailVerified && (
                  <span title="Email not verified" className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation ribbon */}
        <div className="lg:hidden flex items-center justify-around px-2 py-1.5 border-t border-slate-900 bg-slate-950/80 overflow-x-auto">
          {navLinks.map((link) => {
            const active = currentScreen === link.screen;
            return (
              <button
                key={link.screen}
                onClick={() => setCurrentScreen(link.screen)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 whitespace-nowrap transition-all ${
                  active ? 'text-sky-400 bg-sky-500/10 font-semibold' : 'text-slate-400'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};
