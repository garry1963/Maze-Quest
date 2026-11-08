import React, { useState } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Trophy,
  Star,
  CheckCircle2,
  Clock,
  Compass,
  Edit2,
  Save,
  LogOut,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_LEVELS } from '../../services/puzzleData';

export const ProfileScreen: React.FC = () => {
  const { setCurrentScreen, userProgress, totalStars, totalPoints, completedCount } = useGame();
  const { user, profile, logout, updateDisplayName, resendVerification, isGuest } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profile.displayName);
  const [saveMsg, setSaveMsg] = useState('');

  const handleSaveName = async () => {
    if (editedName.trim()) {
      await updateDisplayName(editedName.trim());
      setIsEditingName(false);
      setSaveMsg('Display name updated!');
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  // Calculate breakdown stats
  const completedLevels = INITIAL_LEVELS.filter((l) => userProgress[l.id]?.completed);

  const geoStats = {
    square: completedLevels.filter((l) => l.geometry === 'square').length,
    circular: completedLevels.filter((l) => l.geometry === 'circular').length,
    triangular: completedLevels.filter((l) => l.geometry === 'triangular').length,
    hexagonal: completedLevels.filter((l) => l.geometry === 'hexagonal').length,
    silhouette: completedLevels.filter((l) => l.geometry === 'silhouette').length,
  };

  const modeStats = {
    classic: completedLevels.filter((l) => l.mode === 'classic').length,
    time: completedLevels.filter((l) => l.mode === 'time_challenge').length,
    moves: completedLevels.filter((l) => l.mode === 'restricted_moves').length,
    token: completedLevels.filter((l) => l.mode === 'token_collection').length,
    intertwined: completedLevels.filter((l) => l.mode === 'intertwined').length,
    hidden: completedLevels.filter((l) => l.mode === 'hidden').length,
    mirror: completedLevels.filter((l) => l.mode === 'mirror').length,
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('home')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            title="Return"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Player Profile & Records
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Personal progression and maze puzzle statistics
            </p>
          </div>
        </div>

        {!isGuest && (
          <button
            onClick={() => logout()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {saveMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-sky-500/20">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm font-bold outline-none"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-400"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    {profile.displayName}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-500 hover:text-slate-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {profile.email || 'Guest Explorer'}
              </span>

              {user ? (
                user.emailVerified ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <button
                    onClick={() => resendVerification()}
                    className="flex items-center gap-1 text-amber-400 hover:underline"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Unverified (Send Email)
                  </button>
                )
              ) : null}
            </div>
          </div>
        </div>

        {/* Global Progress Chips */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Stars</span>
            <div className="flex items-center justify-center gap-1 text-amber-400 font-extrabold text-lg mt-0.5">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{totalStars}</span>
            </div>
          </div>

          <div className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Qualifying Points</span>
            <span className="text-sky-400 font-extrabold text-lg block mt-0.5">
              {totalPoints}
            </span>
          </div>

          <div className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Completed</span>
            <span className="text-emerald-400 font-extrabold text-lg block mt-0.5">
              {completedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Performance by Geometry */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky-400" />
          <span>Completed by Maze Geometry</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Square', count: geoStats.square },
            { label: 'Circular', count: geoStats.circular },
            { label: 'Triangular', count: geoStats.triangular },
            { label: 'Hexagonal', count: geoStats.hexagonal },
            { label: 'Silhouettes', count: geoStats.silhouette },
          ].map((item) => (
            <div key={item.label} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-center">
              <span className="text-xs text-slate-400 block font-medium">{item.label}</span>
              <span className="text-lg font-bold text-white mt-1 block">{item.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Performance by Game Mode */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Completed by Game Mode</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            { label: 'Classic', count: modeStats.classic },
            { label: 'Time', count: modeStats.time },
            { label: 'Moves', count: modeStats.moves },
            { label: 'Token', count: modeStats.token },
            { label: 'Portals', count: modeStats.intertwined },
            { label: 'Hidden', count: modeStats.hidden },
            { label: 'Mirror', count: modeStats.mirror },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">{item.label}</span>
              <span className="text-base font-bold text-white mt-0.5 block">{item.count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
