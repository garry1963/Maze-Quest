import React, { useEffect, useState, useTransition } from 'react';
import {
  Trophy,
  Star,
  Search,
  ArrowLeft,
  Crown,
  Clock,
  Sparkles,
  ShieldAlert,
  Flame,
  RotateCw,
  Compass,
  Calendar,
  Layers,
  Zap,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { fetchLeaderboard } from '../../services/storage';
import { LeaderboardEntry } from '../../types/game';

type DifficultyCategory = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'daily' | 'weekly';

interface CategoryTab {
  id: DifficultyCategory;
  label: string;
  sublabel: string;
  badgeColor: string;
  activeBg: string;
  icon: React.ReactNode;
}

const CATEGORY_TABS: CategoryTab[] = [
  {
    id: 'easy',
    label: 'Easy',
    sublabel: '12×12 – 14×14 Labyrinths',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    activeBg: 'bg-emerald-500 text-white shadow-emerald-500/25',
    icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
  },
  {
    id: 'medium',
    label: 'Medium',
    sublabel: '16×16 – 18×18 Complex Paths',
    badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    activeBg: 'bg-sky-500 text-white shadow-sky-500/25',
    icon: <Zap className="w-3.5 h-3.5 text-sky-400" />,
  },
  {
    id: 'hard',
    label: 'Hard',
    sublabel: '20×20 – 22×22 Intricate Mazes',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    activeBg: 'bg-amber-500 text-white shadow-amber-500/25',
    icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    id: 'expert',
    label: 'Expert',
    sublabel: '24×24 – 26×26 Master Portals',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    activeBg: 'bg-purple-600 text-white shadow-purple-500/25',
    icon: <Crown className="w-3.5 h-3.5 text-purple-400" />,
  },
  {
    id: 'master',
    label: 'Master',
    sublabel: '28×28 Apex Grandmaster',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    activeBg: 'bg-rose-600 text-white shadow-rose-500/25',
    icon: <Trophy className="w-3.5 h-3.5 text-rose-400" />,
  },
  {
    id: 'daily',
    label: 'Daily Maze',
    sublabel: 'Single-Attempt Standard',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    activeBg: 'bg-cyan-600 text-white shadow-cyan-500/25',
    icon: <Calendar className="w-3.5 h-3.5 text-cyan-400" />,
  },
  {
    id: 'weekly',
    label: 'Weekly Master',
    sublabel: 'Galactic Gateway Masterpiece',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    activeBg: 'bg-indigo-600 text-white shadow-indigo-500/25',
    icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
  },
];

export const LeaderboardScreen: React.FC = () => {
  const { setCurrentScreen } = useGame();
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<DifficultyCategory>('medium');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLeaderboardData = async (cat: DifficultyCategory) => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard(cat);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData(category);
  }, [category]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadLeaderboardData(category);
    setIsRefreshing(false);
  };

  const activeTabMeta = CATEGORY_TABS.find((t) => t.id === category) || CATEGORY_TABS[1];

  const filteredEntries = entries.filter((e) =>
    e.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = filteredEntries.slice(0, 3);
  const currentUserId = user ? user.uid : profile.uid;
  const userRankIndex = filteredEntries.findIndex(
    (e) => e.userId === currentUserId || (user && e.userId === user.uid)
  );

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
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Global Difficulty Leaderboards
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Real-time competitive celestial rankings segmented by difficulty level
            </p>
          </div>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search players..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-sky-500 text-white placeholder-slate-500 text-xs outline-none transition-all"
            />
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            title="Refresh Leaderboard"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Difficulty Level Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((cat) => {
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${
                isActive
                  ? cat.activeBg
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Difficulty Sub-Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
            {activeTabMeta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white capitalize">{activeTabMeta.label} Labyrinth Tier</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${activeTabMeta.badgeColor}`}>
                Global
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{activeTabMeta.sublabel}</p>
          </div>
        </div>

        {userRankIndex !== -1 ? (
          <div className="px-3.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-mono font-bold self-start sm:self-auto flex items-center gap-2">
            <span>Your Placement:</span>
            <span className="text-amber-400 text-sm">#{userRankIndex + 1}</span>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">
            Complete an {activeTabMeta.label} maze to claim your official rank!
          </div>
        )}
      </div>

      {/* Top 3 Podium (Only shown if no active search) */}
      {top3.length > 0 && !searchQuery && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-2">
          {/* Silver - 2nd place */}
          {top3[1] && (
            <div className="sm:order-1 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center relative overflow-hidden shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-2 font-bold text-lg">
                2
              </div>
              <h3 className="font-bold text-white text-base truncate max-w-[150px]">
                {top3[1].displayName}
              </h3>
              <span className="text-xs text-sky-400 font-extrabold mt-1">
                {top3[1].points.toLocaleString()} pts
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {top3[1].stars}
                </span>
                {top3[1].bestTime && (
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-sky-400" />
                    {top3[1].bestTime.toFixed(1)}s
                  </span>
                )}
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
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-2 font-semibold">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {top3[0].stars}
                </span>
                {top3[0].bestTime && (
                  <span className="flex items-center gap-1 font-mono text-sky-400">
                    <Clock className="w-3.5 h-3.5" />
                    {top3[0].bestTime.toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bronze - 3rd place */}
          {top3[2] && (
            <div className="sm:order-3 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col items-center text-center relative overflow-hidden shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-700 mb-2 font-bold text-lg">
                3
              </div>
              <h3 className="font-bold text-white text-base truncate max-w-[150px]">
                {top3[2].displayName}
              </h3>
              <span className="text-xs text-sky-400 font-extrabold mt-1">
                {top3[2].points.toLocaleString()} pts
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {top3[2].stars}
                </span>
                {top3[2].bestTime && (
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-sky-400" />
                    {top3[2].bestTime.toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-14">Rank</th>
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-4 hidden md:table-cell">Puzzle / Mode</th>
              <th className="py-3 px-4 text-center">Stars</th>
              <th className="py-3 px-4 text-center">Time</th>
              <th className="py-3 px-4 text-center hidden sm:table-cell">Moves</th>
              <th className="py-3 px-4 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                  Loading {activeTabMeta.label} rankings...
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No scores recorded yet for {activeTabMeta.label}. Play a maze to be the first!
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry, idx) => {
                const isCurrentUser =
                  entry.userId === currentUserId ||
                  (user && entry.userId === user.uid) ||
                  (entry.displayName === profile.displayName && !entry.userId.startsWith('bot_'));

                return (
                  <tr
                    key={entry.id || idx}
                    className={`transition-colors ${
                      isCurrentUser
                        ? 'bg-sky-500/15 font-bold text-sky-200 ring-1 ring-inset ring-sky-500/30'
                        : 'hover:bg-slate-850/50 text-slate-300'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold">
                      {idx === 0 && <span className="text-amber-400 font-black">#1</span>}
                      {idx === 1 && <span className="text-slate-300 font-bold">#2</span>}
                      {idx === 2 && <span className="text-amber-600 font-bold">#3</span>}
                      {idx > 2 && <span className="text-slate-500">#{idx + 1}</span>}
                    </td>

                    <td className="py-3.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{entry.displayName}</span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-300 text-[10px] font-extrabold uppercase tracking-wider border border-sky-500/40">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400 hidden md:table-cell capitalize">
                      {entry.puzzleName || entry.gameMode?.replace('_', ' ') || activeTabMeta.label}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {entry.stars}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {entry.bestTime ? `${entry.bestTime.toFixed(1)}s` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-slate-400 hidden sm:table-cell">
                      {entry.levelsCompleted || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-amber-300 text-sm">
                      {entry.points.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
