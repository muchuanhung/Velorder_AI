"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const LOCATION_STORAGE_KEY = "velorder_location";
const LOCATION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

function loadStoredLocation(): LocationInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as LocationInfo & { savedAt?: number };
    if (data.savedAt && Date.now() - data.savedAt > LOCATION_MAX_AGE_MS) return null;
    const { savedAt: _, ...info } = data;
    if (typeof info.latitude === "number" && typeof info.longitude === "number") return info;
  } catch { /* ignore */ }
  return null;
}

function saveLocation(info: LocationInfo): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify({ ...info, savedAt: Date.now() })
    );
  } catch { /* ignore */ }
}

/** Reverse geocoding 回傳的地名結構 */
export type LocationInfo = {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  district?: string;
  county?: string;
  postcode?: string;
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
  let county: string | undefined;
  let postcode: string | undefined;
  let country: string | undefined;
  let rawName: string | undefined;

  if (data.source === "openmeteo" && data.results?.[0]) {
    const r = data.results[0];
    rawName = r.name;
    city = r.admin1 ?? r.name;
    district = r.admin2 ?? r.name;
    county = r.admin1 ?? r.name;
    postcode = undefined;
    country = r.country;
  } else {
    const addr = data.address ?? {};
    city = addr.city ?? addr.town ?? addr.municipality ?? addr.county;
    district = addr.suburb ?? addr.district ?? addr.village ?? addr.neighbourhood ?? addr.county;
    county = addr.county ?? addr.state ?? addr.city ?? addr.town;
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
    county,
    postcode,
    admin1: data.source === "nominatim" ? (data.address?.state ?? data.address?.province) : undefined,
    country
  };
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // 延遲到 hydration 完成後再還原，避免 SSR/client 不一致
  useEffect(() => {
    const id = setTimeout(() => {
      const stored = loadStoredLocation();
      if (stored) setLocation(stored);
    }, 0);
    return () => clearTimeout(id);
  }, []);

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
          const resolved = info ?? fallbackLocation;
          setLocation(resolved);
          saveLocation(resolved);
          setStatus("granted");
        } catch {
          setStatus("granted");
          setLocation(fallbackLocation);
          saveLocation(fallbackLocation);
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
        if (typeof window !== "undefined") {
          try {
            if (err.code === 1) {
              window.localStorage.setItem("location_denied", "1");
              window.localStorage.removeItem(LOCATION_STORAGE_KEY);
            }
          } catch { /* ignore */ }
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setStatus("idle");
    setError(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("location_denied");
        window.localStorage.removeItem(LOCATION_STORAGE_KEY);
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
