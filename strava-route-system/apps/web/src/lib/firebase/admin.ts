// Server Side Firebase Admin (Auth 驗證等)
// 用於 API Routes、RSC、驗證 idToken

import * as admin from "firebase-admin";

let adminApp: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (typeof window !== "undefined") {
    throw new Error("Firebase admin 僅能在 Server 環境使用");
  }
  if (adminApp) return adminApp;
  const certJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (certJson) {
    const cert = JSON.parse(certJson) as admin.ServiceAccount;
    adminApp = admin.apps.length
      ? (admin.app() as admin.app.App)
      : admin.initializeApp({ credential: admin.credential.cert(cert) });
  } else {
    adminApp = admin.apps.length
      ? (admin.app() as admin.app.App)
      : admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  return adminApp;
}

export function getAuthAdmin() {
  return getFirebaseAdmin().auth();
}
