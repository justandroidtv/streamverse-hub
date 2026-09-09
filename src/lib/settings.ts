import { useSyncExternalStore } from "react";

export type PlayerEngine = "internal" | "mpv" | "vlc" | "potplayer" | "ask";

export type Settings = {
  /* التشغيل */
  engine: PlayerEngine;
  autoplay: boolean;
  muteOnStart: boolean;
  defaultVolume: number;
  resumePlayback: boolean;
  preferredStreamFormat: "m3u8" | "ts";
  preferredVodExt: "mp4" | "mkv" | "auto";
  /* mpv وبقية المشغلات الخارجية */
  mpvScheme: string;
  mpvArgs: string;
  externalUserAgent: string;
  externalReferer: string;
  showExternalBar: boolean;
  /* HLS */
  hlsLowLatency: boolean;
  hlsMaxBufferLength: number;
  hlsStartLevel: number; // -1 = تلقائي
  hlsWorker: boolean;
  /* الشبكة */
  requestTimeout: number;
  retryCount: number;
  proxyThroughServer: boolean;
  /* الواجهة */
  density: "comfortable" | "compact";
  gridSize: number;
  showRatings: boolean;
  showAdultCategories: boolean;
  pageSize: number;
  /* المطور */
  devMode: boolean;
  logRequests: boolean;
};

export const DEFAULTS: Settings = {
  engine: "internal",
  autoplay: true,
  muteOnStart: false,
  defaultVolume: 100,
  resumePlayback: true,
  preferredStreamFormat: "m3u8",
  preferredVodExt: "auto",
  mpvScheme: "mpv://play/{url_b64}",
  mpvArgs: "--hwdec=auto --cache=yes",
  externalUserAgent: "VLC/3.0.20 LibVLC/3.0.20",
  externalReferer: "",
  showExternalBar: true,
  hlsLowLatency: true,
  hlsMaxBufferLength: 30,
  hlsStartLevel: -1,
  hlsWorker: true,
  requestTimeout: 15000,
  retryCount: 2,
  proxyThroughServer: true,
  density: "comfortable",
  gridSize: 6,
  showRatings: true,
  showAdultCategories: false,
  pageSize: 120,
  devMode: false,
  logRequests: false,
};

const KEY = "iptv.settings.v1";

let cache: Settings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function read(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  if (loaded) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS;
  } catch {
    cache = DEFAULTS;
  }
  loaded = true;
  return cache;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    subscribe,
    () => read(),
    () => DEFAULTS,
  );
}

export function updateSettings(patch: Partial<Settings>) {
  const next = { ...read(), ...patch };
  cache = next;
  loaded = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function resetSettings() {
  cache = DEFAULTS;
  loaded = true;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function getSettings() {
  return read();
}

/* ---------- روابط المشغلات الخارجية ---------- */

function b64(value: string) {
  if (typeof window === "undefined") return "";
  return window.btoa(unescape(encodeURIComponent(value)));
}

export function buildExternalUrl(engine: Exclude<PlayerEngine, "internal" | "ask">, url: string, s: Settings) {
  if (engine === "mpv") {
    return s.mpvScheme
      .replaceAll("{url_b64}", b64(url))
      .replaceAll("{url_enc}", encodeURIComponent(url))
      .replaceAll("{url}", url)
      .replaceAll("{args}", encodeURIComponent(s.mpvArgs));
  }
  if (engine === "vlc") return `vlc://${url}`;
  return `potplayer://${url}`;
}

/** أمر جاهز للنسخ لتشغيل الرابط في mpv من الطرفية. */
export function buildMpvCommand(url: string, s: Settings) {
  const parts = ["mpv"];
  if (s.mpvArgs.trim()) parts.push(s.mpvArgs.trim());
  if (s.externalUserAgent.trim()) parts.push(`--user-agent="${s.externalUserAgent.trim()}"`);
  if (s.externalReferer.trim()) parts.push(`--referrer="${s.externalReferer.trim()}"`);
  parts.push(`"${url}"`);
  return parts.join(" ");
}
