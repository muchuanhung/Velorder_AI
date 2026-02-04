"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";

const FIREBASE_AUTH_DISABLED =
  process.env.NEXT_PUBLIC_DISABLE_FIREBASE_AUTH === "true";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authRef = useRef<ReturnType<typeof getAuthClient> | null>(null);

  useEffect(() => {
    if (FIREBASE_AUTH_DISABLED) {
      setLoading(false);
      return;
    }
    authRef.current = getAuthClient();
    return onAuthStateChanged(authRef.current, (u) => {
      setUser(u ?? null);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async () => {
    if (FIREBASE_AUTH_DISABLED) return;
    const auth = authRef.current ?? getAuthClient();
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: idToken }),
    });
    if (!res.ok) throw new Error("Session 設定失敗");
  }, []);

  const signOut = useCallback(async () => {
    if (FIREBASE_AUTH_DISABLED) return;
    const auth = authRef.current ?? getAuthClient();
    await firebaseSignOut(auth);
    await fetch("/api/auth/signout", { method: "POST" });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必須在 AuthProvider 內使用");
  return ctx;
}
