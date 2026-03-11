/**
 * 將 Google 頭像
 */
export function getProxiedAvatarUrl(photoURL: string | null | undefined): string | undefined {
  if (!photoURL) return undefined;
  if (!photoURL.includes("lh3.googleusercontent.com")) return photoURL;
  return `/api/avatar?url=${encodeURIComponent(photoURL)}`;
}
