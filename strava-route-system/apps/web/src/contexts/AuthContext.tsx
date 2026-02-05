"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "firebase/auth";
import {
  getAuthClient,
  googleProvider,
} from "@/lib/firebase/client";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authRef = useRef<ReturnType<typeof getAuthClient> | null>(null);

  useEffect(() => {
    authRef.current = getAuthClient();
    return onAuthStateChanged(authRef.current, (u) => {
      setUser(u ?? null);
      setLoading(false);
    });
  }, []);

  const setSessionFromUser = useCallback(async (user: User) => {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: idToken }),
    });
    if (!res.ok) throw new Error("Session 設定失敗");
  }, []);

  const signIn = useCallback(async () => {
    const auth = authRef.current ?? getAuthClient();
    const result = await signInWithPopup(auth, googleProvider);
    await setSessionFromUser(result.user);
  }, [setSessionFromUser]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const auth = authRef.current ?? getAuthClient();
      const result = await signInWithEmailAndPassword(auth, email, password);
      await setSessionFromUser(result.user);
    },
    [setSessionFromUser]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const auth = authRef.current ?? getAuthClient();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName?.trim()) {
        await updateProfile(result.user, { displayName: displayName.trim() });
      }
      await setSessionFromUser(result.user);
    },
    [setSessionFromUser]
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    const auth = authRef.current ?? getAuthClient();
    await sendPasswordResetEmail(auth, email);
  }, []);

  const signOut = useCallback(async () => {
    const auth = authRef.current ?? getAuthClient();
    await firebaseSignOut(auth);
    await fetch("/api/auth/signout", { method: "POST" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      sendPasswordReset,
      signOut,
    }),
    [user, loading, signIn, signInWithEmail, signUpWithEmail, sendPasswordReset, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必須在 AuthProvider 內使用");
  return ctx;
}
