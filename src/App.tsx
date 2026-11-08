/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { GameProvider, useGame } from './context/GameContext';
import { Navbar } from './components/navigation/Navbar';
import { HomeScreen } from './components/screens/HomeScreen';
import { ConstellationMap } from './components/screens/ConstellationMap';
import { ConstellationLevelSelect } from './components/screens/ConstellationLevelSelect';
import { GameScreen } from './components/maze/GameScreen';
import { DailyWeeklyChallenge } from './components/screens/DailyWeeklyChallenge';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { AchievementsScreen } from './components/screens/AchievementsScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { AdminDashboard } from './components/screens/AdminDashboard';
import { PuzzleGeneratorScreen } from './components/screens/PuzzleGeneratorScreen';
import { CONSTELLATIONS, INITIAL_LEVELS } from './services/puzzleData';

const AppContent: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    selectedConstellation,
    activePuzzle,
    activeTheme,
  } = useGame();

  return (
    <div
      className="min-h-screen w-full flex flex-col text-slate-100 transition-colors duration-500 font-sans"
      style={{ backgroundColor: activeTheme.bgDark }}
    >
      {/* Hide global navbar during focused maze play to maximize viewport presence */}
      {currentScreen !== 'game' && <Navbar />}

      <main className="flex-1 w-full flex flex-col items-center">
        {currentScreen === 'home' && <HomeScreen />}
        {currentScreen === 'generator' && <PuzzleGeneratorScreen />}
        {currentScreen === 'constellations' && <ConstellationMap />}
        {currentScreen === 'level_select' && (
          <ConstellationLevelSelect
            constellation={selectedConstellation || CONSTELLATIONS[0]}
            onBack={() => setCurrentScreen('constellations')}
          />
        )}
        {currentScreen === 'game' && activePuzzle && (
          <GameScreen
            puzzle={activePuzzle}
            onBack={() => {
              if (activePuzzle.constellationId) {
                setCurrentScreen('level_select');
              } else {
                setCurrentScreen('home');
              }
            }}
          />
        )}
        {currentScreen === 'daily_challenge' && (
          <DailyWeeklyChallenge initialTab="daily" />
        )}
        {currentScreen === 'weekly_challenge' && (
          <DailyWeeklyChallenge initialTab="weekly" />
        )}
        {currentScreen === 'leaderboards' && <LeaderboardScreen />}
        {currentScreen === 'profile' && <ProfileScreen />}
        {currentScreen === 'achievements' && <AchievementsScreen />}
        {currentScreen === 'settings' && <SettingsScreen />}
        {currentScreen === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </AuthProvider>
  );
}
