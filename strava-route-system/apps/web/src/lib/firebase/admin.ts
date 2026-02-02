// Server Side Firebase Admin (cert)
// 用於 Server Actions、API Routes、RSC
// TODO: 使用 service account cert 初始化 getFirestore() 等

export function getFirebaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("Firebase admin 僅能在 Server 環境使用");
  }
  // TODO: 從 process.env 讀取 cert，回傳 admin app / firestore
  return null;
}
