"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
} from "react";

/** Reverse geocoding 回傳的地名結構 */
export type LocationInfo = {
  latitude: number;
  longitude: number;
  displayName: string;
  /** 城市，如 台北市 */
  city?: string;
  /** 區/鄉鎮，如 信義區 */
  district?: string;
  /** 郵遞區號，如 110 */
  postcode?: string;
  /** 縣/州 */
  admin1?: string;
  country?: string;
};

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "error";

type LocationContextValue = {
  location: LocationInfo | null;
  status: LocationStatus;
  error: string | null;
  requestLocation: () => void;
  clearLocation: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

/** 由 lat/lng 取得地名，透過 API route 代理 avoid CORS */
async function reverseGeocode(
  lat: number,
  lng: number
): Promise<LocationInfo | null> {
  const url = `/api/geocode/reverse?latitude=${lat}&longitude=${lng}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error) return null;

  let city: string | undefined;
  let district: string | undefined;
  let postcode: string | undefined;
  let country: string | undefined;
  let rawName: string | undefined;

  if (data.source === "openmeteo" && data.results?.[0]) {
    const r = data.results[0];
    rawName = r.name;
    city = r.admin1 ?? r.name;
    district = r.admin2 ?? r.name;
    postcode = undefined;
    country = r.country;
  } else {
    const addr = data.address ?? {};
    city = addr.city ?? addr.town ?? addr.municipality ?? addr.county;
    district = addr.suburb ?? addr.district ?? addr.village ?? addr.neighbourhood ?? addr.county;
    postcode = addr.postcode;
    country = addr.country;
    rawName = data.display_name;
  }

  const parts: string[] = [];
  if (district && district !== city) parts.push(district);
  if (city) parts.push(city);
  if (country && !parts.some((p) => p?.includes(country ?? ""))) parts.push(country ?? "");
  const displayName = parts.length > 0 ? parts.filter(Boolean).join(" ") : rawName ?? "Unknown";

  return {
    latitude: lat,
    longitude: lng,
    displayName,
    city,
    district: district !== city ? district : undefined,
    postcode,
    admin1: data.source === "nominatim" ? (data.address?.state ?? data.address?.province) : undefined,
    country,
  };
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setStatus("error");
      setError("此瀏覽器不支援定位功能");
      return;
    }

    setStatus("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const fallbackLocation: LocationInfo = {
          latitude,
          longitude,
          displayName: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
        };
        try {
          const info = await reverseGeocode(latitude, longitude);
          setLocation(info ?? fallbackLocation);
          setStatus("granted");
        } catch {
          setStatus("granted"); // 有座標就視為成功，顯示 fallback
          setLocation(fallbackLocation);
          setError("無法取得地區名稱（顯示座標）");
        }
      },
      (err) => {
        setStatus(err.code === 1 ? "denied" : "error");
        setError(
          err.code === 1
            ? "已拒絕定位權限"
            : err.code === 2
              ? "無法取得位置"
              : "定位逾時"
        );
        setLocation(null);
        if (err.code === 1 && typeof window !== "undefined") {
          try {
            window.localStorage.setItem("location_denied", "1");
          } catch { /* ignore */ }
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setStatus("idle");
    setError(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("location_denied");
      } catch { /* ignore */ }
    }
  }, []);

  const value = useMemo(
    () => ({
      location,
      status,
      error,
      requestLocation,
      clearLocation,
    }),
    [location, status, error, requestLocation, clearLocation]
  );

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation 必須在 LocationProvider 內使用");
  return ctx;
}
