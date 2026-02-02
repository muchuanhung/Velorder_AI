// Client Side Firebase (initializeApp)
// 僅在瀏覽器使用，用於 Firestore 即時監聽等
// TODO: 從環境變數讀取 config 並 initializeApp

export function getFirebaseApp() {
  if (typeof window === "undefined") {
    throw new Error("Firebase client 僅能在 Client Component 使用");
  }
  // TODO: return getApp() 或 initializeApp(config)
  return null;
}
