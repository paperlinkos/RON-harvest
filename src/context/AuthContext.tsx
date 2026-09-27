import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  createUserProfile,
  fetchUserProfile,
  fetchSoulWinnerProfile,
  clearCachedProfiles,
  getCachedLocalProfiles,
} from '../services/userService';
import type { UserProfile, SoulWinnerProfile, UserRole, AccountStatus } from '../types/auth';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  soulWinnerProfile: SoulWinnerProfile | null;
  role: UserRole | null;
  status: AccountStatus | null;
  isAuthenticated: boolean;
  isActiveSoulWinner: boolean;
  isPendingAssignment: boolean;
  isLoading: boolean;
  signup: (name: string, email: string, phone: string, pass: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setDevRole: (targetRole: UserRole | 'pending' | 'logout') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [soulWinnerProfile, setSoulWinnerProfile] = useState<SoulWinnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadProfiles = async (uid: string) => {
    const [uProf, swProf] = await Promise.all([
      fetchUserProfile(uid),
      fetchSoulWinnerProfile(uid),
    ]);
    setUserProfile(uProf);
    setSoulWinnerProfile(swProf);
  };

  useEffect(() => {
    const cached = getCachedLocalProfiles();
    if (cached.userProfile) {
      setUserProfile(cached.userProfile);
      setSoulWinnerProfile(cached.soulWinnerProfile);
      if (!currentUser) {
        setCurrentUser({
          uid: cached.userProfile.id,
          email: cached.userProfile.email,
          displayName: cached.userProfile.name,
        } as FirebaseUser);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await loadProfiles(user.uid);
      } else if (!localStorage.getItem('ron_user_profile')) {
        setCurrentUser(null);
        setUserProfile(null);
        setSoulWinnerProfile(null);
        clearCachedProfiles();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (name: string, email: string, phone: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const nowIso = new Date().toISOString();

    const newProfile: UserProfile = {
      id: cred.user.uid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: 'soulWinner',
      status: 'pendingAssignment',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await createUserProfile(newProfile);
    await loadProfiles(cred.user.uid);
  };

  const login = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await loadProfiles(cred.user.uid);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setSoulWinnerProfile(null);
    clearCachedProfiles();
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await loadProfiles(currentUser.uid);
    }
  };

  const setDevRole = (targetRole: UserRole | 'pending' | 'logout') => {
    if (targetRole === 'logout') {
      setCurrentUser(null);
      setUserProfile(null);
      setSoulWinnerProfile(null);
      clearCachedProfiles();
      return;
    }

    const mockUid = `demo-${targetRole}-uid`;
    const formattedTitle =
      targetRole === 'soulWinner' || targetRole === 'pending'
        ? 'Demo Soul Winner'
        : targetRole === 'superAdmin'
        ? 'Super Admin'
        : targetRole === 'zoneManager'
        ? 'Abuja Zonal Leader'
        : targetRole === 'groupManager'
        ? 'Central Group Leader'
        : targetRole === 'churchManager'
        ? 'Abuja Cathedral Pastor'
        : 'Demo User';

    const mockUser = {
      uid: mockUid,
      email: `${targetRole}@ron.org`,
      displayName: formattedTitle,
    } as FirebaseUser;

    const nowIso = new Date().toISOString();
    const actualRole: UserRole = targetRole === 'pending' ? 'soulWinner' : (targetRole as UserRole);
    const actualStatus: AccountStatus = targetRole === 'pending' ? 'pendingAssignment' : 'active';

    const uProf: UserProfile = {
      id: mockUid,
      name: formattedTitle,
      email: `${targetRole}@ron.org`,
      phone: '+234 800 000 0000',
      role: actualRole,
      status: actualStatus,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const swProf: SoulWinnerProfile = {
      id: mockUid,
      userId: mockUid,
      zoneId: 'zone-abuja-1',
      zoneName: 'Abuja Zone 1',
      groupId: targetRole === 'groupManager' || targetRole === 'churchManager' || targetRole === 'soulWinner' || targetRole === 'pending' ? 'grp-central' : undefined,
      groupName: targetRole === 'groupManager' || targetRole === 'churchManager' || targetRole === 'soulWinner' || targetRole === 'pending' ? 'Central Group' : undefined,
      churchId: targetRole === 'churchManager' || targetRole === 'soulWinner' || targetRole === 'pending' ? 'ch-cathedral' : undefined,
      churchName: targetRole === 'churchManager' || targetRole === 'soulWinner' || targetRole === 'pending' ? 'Abuja Cathedral' : undefined,
      status: actualStatus,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setCurrentUser(mockUser);
    setUserProfile(uProf);
    setSoulWinnerProfile(swProf);
    localStorage.setItem('ron_user_profile', JSON.stringify(uProf));
    localStorage.setItem('ron_soul_winner_profile', JSON.stringify(swProf));
  };

  const role = userProfile?.role || null;
  const status = userProfile?.status || null;
  const isAuthenticated = Boolean(currentUser);
  const isActiveSoulWinner = status === 'active';
  const isPendingAssignment = status === 'pendingAssignment';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        soulWinnerProfile,
        role,
        status,
        isAuthenticated,
        isActiveSoulWinner,
        isPendingAssignment,
        isLoading,
        signup,
        login,
        logout,
        resetPassword,
        refreshProfile,
        setDevRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
