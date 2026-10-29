import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types/models';
import { Logo } from '../components/ui/Logo';

export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'error';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  profileStatus: ProfileStatus;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, displayName: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  loginWithDemo: () => void;
  logout: () => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  retryProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USER: User = {
  uid: 'demo-user-123',
  email: 'alex@kurashii.app',
  displayName: 'Alex Chen',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'demo-token',
  getIdTokenResult: async () => ({
    token: 'demo-token',
    signInProvider: 'password',
    claims: {},
    authTime: '',
    issuedAtTime: '',
    expirationTime: '',
    signInSecondFactor: null,
  }),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
  photoURL: null,
  providerId: 'demo',
};

function getDemoProfile(): UserProfile {
  try {
    const raw = localStorage.getItem('kurashii_demo_profile');
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {
    uid: 'demo-user-123',
    email: 'alex@kurashii.app',
    displayName: 'Alex Chen',
    handle: 'alexchen',
    primaryUse: 'personal',
    lastWorkspace: 'personal',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    defaultMonthlyBudgetMinor: 5000000,
    theme: 'light',
    avatarColor: '#047857',
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  const [loading, setLoading] = useState(true);

  // Fetch Firestore user doc
  const fetchUserProfile = useCallback(async (uid: string) => {
    if (uid === 'demo-user-123') {
      const demoProfile = getDemoProfile();
      setUserProfile(demoProfile);
      setProfileStatus('ready');
      return;
    }

    setProfileStatus('loading');
    try {
      const userDocRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userDocRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserProfile({
          uid,
          email: data.email || '',
          displayName: data.displayName || '',
          handle: data.handle || '',
          primaryUse: data.primaryUse || 'personal',
          lastWorkspace: data.lastWorkspace || data.primaryUse || 'personal',
          timezone: data.timezone || 'Asia/Kolkata',
          currency: data.currency || 'INR',
          defaultMonthlyBudgetMinor: data.defaultMonthlyBudgetMinor || 0,
          theme: data.theme || 'light',
          avatarColor: data.avatarColor || '#047857',
          onboardingComplete: Boolean(data.onboardingComplete),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        setProfileStatus('ready');
      } else {
        setUserProfile(null);
        setProfileStatus('missing');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      setUserProfile(null);
      setProfileStatus('error');
    }
  }, []);

  useEffect(() => {
    // Check if demo autostart or active demo session
    const isAutostart =
      typeof window !== 'undefined' &&
      (window.location.search.includes('autostart=1') ||
        sessionStorage.getItem('kurashii_demo_session') === 'true');

    if (isAutostart) {
      sessionStorage.setItem('kurashii_demo_session', 'true');
      setUser(DEMO_USER);
      setUserProfile(getDemoProfile());
      setProfileStatus('ready');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If demo session is active, do not override
      if (sessionStorage.getItem('kurashii_demo_session') === 'true') {
        setUser(DEMO_USER);
        setUserProfile(getDemoProfile());
        setProfileStatus('ready');
        setLoading(false);
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        try {
          await fetchUserProfile(currentUser.uid);
        } finally {
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setProfileStatus('idle');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const loginWithDemo = () => {
    sessionStorage.setItem('kurashii_demo_session', 'true');
    setUser(DEMO_USER);
    setUserProfile(getDemoProfile());
    setProfileStatus('ready');
    setLoading(false);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    sessionStorage.removeItem('kurashii_demo_session');
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await fetchUserProfile(cred.user.uid);
  };

  const signupWithEmail = async (email: string, pass: string, displayName: string) => {
    sessionStorage.removeItem('kurashii_demo_session');
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await updateAuthProfile(cred.user, { displayName: displayName.trim() });
    return cred.user;
  };

  const loginWithGoogle = async () => {
    sessionStorage.removeItem('kurashii_demo_session');
    const cred = await signInWithPopup(auth, googleProvider);
    await fetchUserProfile(cred.user.uid);
  };

  const logout = async () => {
    sessionStorage.removeItem('kurashii_demo_session');
    localStorage.removeItem('kurashii_demo_profile');
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    setUserProfile(null);
    setProfileStatus('idle');
  };

  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  };

  const retryProfile = async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    if (user.uid === 'demo-user-123') {
      const current = getDemoProfile();
      const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
      try {
        localStorage.setItem('kurashii_demo_profile', JSON.stringify(updated));
      } catch {
        // ignore
      }
      setUserProfile(updated);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#F1F5F9] flex flex-col items-center justify-center p-4 select-none">
        <div className="flex flex-col items-center gap-4 animate-fade-up">
          <Logo size={40} />
          <div className="h-1.5 w-32 bg-slate-300 rounded-full overflow-hidden">
            <div className="h-full bg-slate-800 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        profileStatus,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginWithDemo,
        logout,
        sendResetEmail,
        refreshProfile,
        retryProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
