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
  Flame,
  Calendar,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_LEVELS } from '../../services/puzzleData';
import { getStreakStatus } from '../../services/storage';

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

      {/* Daily Engagement & Streak Card */}
      {(() => {
        const streakInfo = getStreakStatus(profile);
        const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const currentDayIndex = (new Date().getDay() + 6) % 7;

        return (
          <section className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/20 flex flex-col gap-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Flame className="w-6 h-6 fill-amber-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Daily Engagement Streak</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Play every day to build your streak and earn bonus profile prestige
                  </p>
                </div>
              </div>

              <div>
                {streakInfo.completedToday ? (
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Today Completed</span>
                  </span>
                ) : streakInfo.needsCompletionToday ? (
                  <span className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-sm">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Streak Active — Play Today!</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Start New Streak Today</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              {/* Main Streak Counter */}
              <div className="md:col-span-1 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col items-center text-center justify-center gap-1">
                <span className="text-[11px] uppercase font-bold text-slate-400">Current Streak</span>
                <div className="flex items-center gap-2 my-1">
                  <Flame className="w-8 h-8 text-amber-400 fill-amber-400" />
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                    {streakInfo.dailyStreak} {streakInfo.dailyStreak === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentScreen('daily_challenge')}
                  className="mt-2 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Play Daily Challenge</span>
                </button>
              </div>

              {/* All-time Best & Activity */}
              <div className="md:col-span-2 flex flex-col justify-between gap-4 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">All-Time Best Streak</span>
                      <span className="text-sm font-bold text-white">
                        {streakInfo.bestStreak} {streakInfo.bestStreak === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Last Active Date</span>
                    <span className="text-xs font-medium text-slate-300 font-mono">
                      {streakInfo.lastStreakDate || 'No record yet'}
                    </span>
                  </div>
                </div>

                {/* Weekly Consistency Visual Dot Matrix */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium text-[11px]">Weekly Activity</span>
                    <span className="text-[10px] text-slate-500">Mon — Sun</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {daysOfWeek.map((day, idx) => {
                      const isToday = idx === currentDayIndex;
                      const isCompletedDay =
                        (isToday && streakInfo.completedToday) ||
                        (idx < currentDayIndex && streakInfo.dailyStreak > (currentDayIndex - idx));

                      return (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div
                            className={`w-full aspect-square max-w-[36 h-9] rounded-xl flex items-center justify-center text-xs font-bold transition-all border ${
                              isCompletedDay
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-sm shadow-amber-500/10'
                                : isToday
                                ? 'bg-slate-900 border-amber-500/40 text-slate-300 animate-pulse'
                                : 'bg-slate-950 border-slate-800 text-slate-600'
                            }`}
                          >
                            {isCompletedDay ? (
                              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ) : (
                              day
                            )}
                          </div>
                          <span className={`text-[10px] ${isToday ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                            {day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

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
