import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfileData } from '../types/game';
import { calculateStreakUpdate, getLocalProfile, getLocalProgress, loadUserProfile, saveLocalProfile, syncUserProfile } from '../services/storage';

interface AuthContextType {
  user: User | null;
  profile: UserProfileData;
  loading: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateTheme: (theme: string) => void;
  updateMovementMode: (mode: 'continuous' | 'step') => void;
  updatePlayerSpeed: (speed: number) => void;
  updateDisplayName: (name: string) => Promise<void>;
  recordDailyStreak: () => void;
  updateProfileStats: (stats: Partial<UserProfileData>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData>(getLocalProfile());
  const [loading, setLoading] = useState(true);

  // Check admin rights (email is garrydavies1963@gmail.com or role is admin)
  const isAdmin = (user?.email === 'garrydavies1963@gmail.com') || (profile.role === 'admin');
  const isGuest = !user;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Authenticated user
        const remoteProfile = await loadUserProfile(currentUser.uid);
        if (remoteProfile) {
          setProfile({
            ...remoteProfile,
            emailVerified: currentUser.emailVerified,
            isGuest: false,
          });
        } else {
          // Initialize profile from user data & local progress
          const local = getLocalProfile();
          const newProfile: UserProfileData = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Voyager',
            email: currentUser.email || '',
            emailVerified: currentUser.emailVerified,
            totalPoints: local.totalPoints || 0,
            totalLevelsCompleted: local.totalLevelsCompleted || 0,
            totalStars: local.totalStars || 0,
            totalPlayTime: local.totalPlayTime || 0,
            currentConstellation: local.currentConstellation || 'c1_ursa_minor',
            currentLevel: local.currentLevel || 1,
            selectedTheme: local.selectedTheme || 'midnight_blue',
            movementMode: local.movementMode || 'continuous',
            isGuest: false,
            role: currentUser.email === 'garrydavies1963@gmail.com' ? 'admin' : 'player',
          };
          setProfile(newProfile);
          await syncUserProfile(newProfile);
        }
      } else {
        // Guest mode
        setProfile(getLocalProfile());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    if (cred.user) {
      const remoteProfile = await loadUserProfile(cred.user.uid);
      if (!remoteProfile) {
        const local = getLocalProfile();
        const newProfile: UserProfileData = {
          uid: cred.user.uid,
          displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Voyager',
          email: cred.user.email || '',
          emailVerified: cred.user.emailVerified,
          totalPoints: local.totalPoints || 0,
          totalLevelsCompleted: local.totalLevelsCompleted || 0,
          totalStars: local.totalStars || 0,
          totalPlayTime: local.totalPlayTime || 0,
          currentConstellation: local.currentConstellation || 'c1_ursa_minor',
          currentLevel: local.currentLevel || 1,
          selectedTheme: local.selectedTheme || 'midnight_blue',
          movementMode: local.movementMode || 'continuous',
          isGuest: false,
          role: cred.user.email === 'garrydavies1963@gmail.com' ? 'admin' : 'player',
        };
        setProfile(newProfile);
        await syncUserProfile(newProfile);
      }
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        throw new Error(
          'Email/Password sign-in is not enabled in Firebase Console. Please use "Sign in with Google" instead.'
        );
      }
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName });
        try {
          await sendEmailVerification(cred.user);
        } catch (e) {
          console.warn('Verification email send notice:', e);
        }
        const local = getLocalProfile();
        const newProfile: UserProfileData = {
          uid: cred.user.uid,
          displayName,
          email,
          emailVerified: false,
          totalPoints: local.totalPoints || 0,
          totalLevelsCompleted: local.totalLevelsCompleted || 0,
          totalStars: local.totalStars || 0,
          totalPlayTime: local.totalPlayTime || 0,
          currentConstellation: local.currentConstellation || 'c1_ursa_minor',
          currentLevel: local.currentLevel || 1,
          selectedTheme: local.selectedTheme || 'midnight_blue',
          movementMode: local.movementMode || 'continuous',
          isGuest: false,
          role: email === 'garrydavies1963@gmail.com' ? 'admin' : 'player',
        };
        setProfile(newProfile);
        await syncUserProfile(newProfile);
      }
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        throw new Error(
          'Email/Password sign-up is not enabled in Firebase Console. Please use "Sign in with Google" instead.'
        );
      }
      throw err;
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setProfile(getLocalProfile());
  };

  const updateTheme = (theme: any) => {
    const updated = { ...profile, selectedTheme: theme };
    setProfile(updated);
    syncUserProfile(updated);
  };

  const updateMovementMode = (mode: 'continuous' | 'step') => {
    const updated = { ...profile, movementMode: mode };
    setProfile(updated);
    syncUserProfile(updated);
  };

  const updatePlayerSpeed = (speed: number) => {
    const clamped = Math.max(4.0, Math.min(24.0, speed));
    const updated = { ...profile, playerSpeed: clamped };
    setProfile(updated);
    syncUserProfile(updated);
  };

  const updateDisplayName = async (name: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
    }
    const updated = { ...profile, displayName: name };
    setProfile(updated);
    syncUserProfile(updated);
  };

  const recordDailyStreak = () => {
    const updated = calculateStreakUpdate(profile);
    setProfile(updated);
    syncUserProfile(updated);
  };

  const updateProfileStats = (stats: Partial<UserProfileData>) => {
    const updated = { ...profile, ...stats };
    setProfile(updated);
    syncUserProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isGuest,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resendVerification,
        resetPassword,
        logout,
        updateTheme,
        updateMovementMode,
        updatePlayerSpeed,
        updateDisplayName,
        recordDailyStreak,
        updateProfileStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
