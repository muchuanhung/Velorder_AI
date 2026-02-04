// Client Side Firebase (Auth)
// 僅在瀏覽器使用，用於登入／登出與取得 idToken

import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type User } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  if (typeof window === "undefined") {
    throw new Error("Firebase client 僅能在 Client Component 使用");
  }
  const apiKey = firebaseConfig.apiKey;
  if (!apiKey || apiKey.length < 20) {
    throw new Error(
      "Firebase API Key 未設定或無效。請在 .env.local 設定 NEXT_PUBLIC_FIREBASE_API_KEY（從 Firebase Console > 專案設定 > 一般 > 您的應用程式 取得）。"
    );
  }
  const apps = getApps();
  if (apps.length > 0) return apps[0]!;
  return initializeApp(firebaseConfig);
}

export function getAuthClient() {
  return getAuth(getFirebaseApp());
}

export const googleProvider = new GoogleAuthProvider();

export type { User };
