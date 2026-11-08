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
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfileData } from '../types/game';
import { getLocalProfile, getLocalProgress, loadUserProfile, saveLocalProfile, syncUserProfile } from '../services/storage';

interface AuthContextType {
  user: User | null;
  profile: UserProfileData;
  loading: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateTheme: (theme: string) => void;
  updateMovementMode: (mode: 'continuous' | 'step') => void;
  updateDisplayName: (name: string) => Promise<void>;
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

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string) => {
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

  const updateDisplayName = async (name: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
    }
    const updated = { ...profile, displayName: name };
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
        loginWithEmail,
        registerWithEmail,
        resendVerification,
        resetPassword,
        logout,
        updateTheme,
        updateMovementMode,
        updateDisplayName,
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
