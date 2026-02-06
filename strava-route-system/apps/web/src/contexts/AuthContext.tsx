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

  const setSessionFromUser = useCallback(async (user: User) => {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: idToken }),
    });
    if (!res.ok) throw new Error("Session 設定失敗");
  }, []);

  useEffect(() => {
    authRef.current = getAuthClient();
    let cancelled = false;
    const unsub = onAuthStateChanged(authRef.current, async (u) => {
      setUser(u ?? null);
      // 必須先完成 session cookie 更新，再關閉 loading，否則 B 點 Sync 時可能仍帶 A 的 cookie 而撈到 A 的資料
      if (u) {
        try {
          await setSessionFromUser(u);
        } catch {
          // 仍顯示使用者，後續 API 若 401 再處理
        }
      }
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [setSessionFromUser]);

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
