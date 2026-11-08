import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Medal,
  Star,
  Search,
  ArrowLeft,
  Crown,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { fetchLeaderboard } from '../../services/storage';
import { LeaderboardEntry } from '../../types/game';

export const LeaderboardScreen: React.FC = () => {
  const { setCurrentScreen } = useGame();
  const { user, profile, isGuest } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<
    'all_time' | 'weekly' | 'daily' | 'time' | 'moves' | 'stars'
  >('all_time');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchLeaderboard(category);
      setEntries(data);
      setLoading(false);
    }
    loadData();
  }, [category]);

  const filteredEntries = entries.filter((e) =>
    e.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = filteredEntries.slice(0, 3);
  const rest = filteredEntries.slice(3);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('home')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            title="Return"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Global Leaderboards
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Verified celestial rankings computed and stored in Firebase
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-sky-500 text-white placeholder-slate-500 text-xs outline-none transition-all"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all_time', label: 'All-Time Global' },
          { id: 'weekly', label: 'Weekly Global' },
          { id: 'daily', label: 'Daily Maze' },
          { id: 'time', label: 'Time Challenge' },
          { id: 'moves', label: 'Restricted Moves' },
          { id: 'stars', label: 'Total Stars' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              category === cat.id
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Guest or Email verification notice */}
      {isGuest ? (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <span>You are viewing as Guest. Create a verified account to register your scores on the official leaderboards.</span>
        </div>
      ) : (
        !user?.emailVerified && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
            <span>Email verification required for verified leaderboard badge. Check your inbox to verify.</span>
          </div>
        )
      )}

      {/* Top 3 Podium */}
      {top3.length > 0 && !searchQuery && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-2">
          {/* Silver - 2nd place */}
          {top3[1] && (
            <div className="sm:order-1 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-2 font-bold text-lg">
                2
              </div>
              <h3 className="font-bold text-white text-base truncate max-w-[150px]">
                {top3[1].displayName}
              </h3>
              <span className="text-xs text-sky-400 font-extrabold mt-1">
                {top3[1].points.toLocaleString()} pts
              </span>
              <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-2">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{top3[1].stars} stars</span>
              </div>
            </div>
          )}

          {/* Gold - 1st place */}
          {top3[0] && (
            <div className="sm:order-2 p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 to-slate-900 border border-amber-500/40 flex flex-col items-center text-center relative overflow-hidden shadow-xl shadow-amber-500/5 sm:-translate-y-2">
              <div className="absolute top-2 right-2">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2 font-black text-xl">
                1
              </div>
              <h3 className="font-extrabold text-white text-lg truncate max-w-[160px]">
                {top3[0].displayName}
              </h3>
              <span className="text-sm text-amber-400 font-extrabold mt-1">
                {top3[0].points.toLocaleString()} pts
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-400 mt-2 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{top3[0].stars} stars</span>
              </div>
            </div>
          )}

          {/* Bronze - 3rd place */}
          {top3[2] && (
            <div className="sm:order-3 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-700 mb-2 font-bold text-lg">
                3
              </div>
              <h3 className="font-bold text-white text-base truncate max-w-[150px]">
                {top3[2].displayName}
              </h3>
              <span className="text-xs text-sky-400 font-extrabold mt-1">
                {top3[2].points.toLocaleString()} pts
              </span>
              <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-2">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{top3[2].stars} stars</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-14">Rank</th>
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-4 text-center">Stars</th>
              <th className="py-3 px-4 text-center hidden sm:table-cell">Best Time</th>
              <th className="py-3 px-4 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredEntries.map((entry, idx) => {
              const isCurrentUser = user && entry.userId === user.uid;
              return (
                <tr
                  key={entry.id || idx}
                  className={`transition-colors ${
                    isCurrentUser
                      ? 'bg-sky-500/10 font-bold text-sky-300'
                      : 'hover:bg-slate-850/50 text-slate-300'
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {idx === 0 && <span className="text-amber-400">#1</span>}
                    {idx === 1 && <span className="text-slate-300">#2</span>}
                    {idx === 2 && <span className="text-amber-600">#3</span>}
                    {idx > 2 && <span className="text-slate-500">#{idx + 1}</span>}
                  </td>
                  <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                    <span className="text-white">{entry.displayName}</span>
                    {isCurrentUser && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px] font-bold">
                        YOU
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {entry.stars}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400 hidden sm:table-cell">
                    {entry.bestTime ? `${entry.bestTime.toFixed(1)}s` : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sky-400">
                    {entry.points.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
