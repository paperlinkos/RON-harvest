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
import { DEFAULT_GROUPS, DEFAULT_CHURCHES } from '../services/organizationService';
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
  /**
   * True only after Firebase onAuthStateChanged has resolved and the live
   * Firestore profile has been fetched. Admin UI gates MUST check this before
   * rendering privileged views — prevents localStorage-role tampering.
   */
  isRoleVerified: boolean;
  signup: (
    name: string,
    email: string,
    phone: string,
    pass: string,
    groupId?: string,
    churchId?: string
  ) => Promise<void>;
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
  // Only flipped to true after a live Firebase auth + Firestore profile fetch.
  // localStorage-cached profiles are loaded for UX (name, email) but this
  // flag stays false until Firebase confirms the real role.
  const [isRoleVerified, setIsRoleVerified] = useState<boolean>(false);

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
        // Role is now confirmed from live Firestore — safe to grant privileged UI
        setIsRoleVerified(true);
      } else if (!localStorage.getItem('ron_user_profile')) {
        setCurrentUser(null);
        setUserProfile(null);
        setSoulWinnerProfile(null);
        clearCachedProfiles();
        setIsRoleVerified(false);
      } else {
        // Offline with cached profile — role is NOT verified until Firebase confirms
        setIsRoleVerified(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (
    name: string,
    email: string,
    phone: string,
    pass: string,
    groupId?: string,
    churchId?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const nowIso = new Date().toISOString();

    const groupObj = DEFAULT_GROUPS.find((g) => g.id === groupId);
    const churchObj = DEFAULT_CHURCHES.find((c) => c.id === churchId);

    const newProfile: UserProfile = {
      id: cred.user.uid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: 'soulWinner',
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const swData: Partial<SoulWinnerProfile> = {
      zoneId: 'zone-abuja-1',
      zoneName: 'Abuja Zone 1',
      groupId: groupObj?.id || groupId,
      groupName: groupObj?.name,
      churchId: churchObj?.id || churchId,
      churchName: churchObj?.name,
    };

    await createUserProfile(newProfile, swData);
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
      groupId: targetRole === 'groupManager' || targetRole === 'churchManager' || targetRole === 'soulWinner' || targetRole === 'pending' ? 'grp-gwarinpa' : undefined,
      groupName: targetRole === 'groupManager' || targetRole === 'churchManager' || targetRole === 'soulWinner' || targetRole === 'pending' ? 'Gwarinpa Group' : undefined,
      churchId: targetRole === 'churchManager' || targetRole === 'soulWinner' || targetRole === 'pending' ? 'ch-gwarinpa1' : undefined,
      churchName: targetRole === 'churchManager' || targetRole === 'soulWinner' || targetRole === 'pending' ? 'CE Gwarinpa 1' : undefined,
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
        isRoleVerified,
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
