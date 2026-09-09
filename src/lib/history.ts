import { useSyncExternalStore } from "react";

export type WatchItem = {
  key: string;
  kind: "live" | "movie" | "series";
  id: string;
  title: string;
  poster?: string;
  ext?: string;
  progress?: number;
  duration?: number;
  updatedAt: number;
};

export type FavItem = {
  key: string;
  kind: "live" | "movie" | "series";
  id: string;
  title: string;
  poster?: string;
};

const H_KEY = "iptv.history.v1";
const F_KEY = "iptv.favorites.v1";

const listeners = new Set<() => void>();
const cache: Record<string, unknown> = {};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  if (key in cache) return cache[key] as T;
  try {
    const raw = window.localStorage.getItem(key);
    cache[key] = raw ? JSON.parse(raw) : fallback;
  } catch {
    cache[key] = fallback;
  }
  return cache[key] as T;
}

function write<T>(key: string, value: T) {
  cache[key] = value;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const EMPTY_H: WatchItem[] = [];
const EMPTY_F: FavItem[] = [];

export function useHistory() {
  return useSyncExternalStore(
    subscribe,
    () => read<WatchItem[]>(H_KEY, EMPTY_H),
    () => EMPTY_H,
  );
}

export function useFavorites() {
  return useSyncExternalStore(
    subscribe,
    () => read<FavItem[]>(F_KEY, EMPTY_F),
    () => EMPTY_F,
  );
}

export function recordWatch(item: Omit<WatchItem, "updatedAt">) {
  const list = read<WatchItem[]>(H_KEY, EMPTY_H).filter((x) => x.key !== item.key);
  write(H_KEY, [{ ...item, updatedAt: Date.now() }, ...list].slice(0, 40));
}

export function clearHistory() {
  write(H_KEY, [] as WatchItem[]);
}

export function toggleFavorite(item: FavItem) {
  const list = read<FavItem[]>(F_KEY, EMPTY_F);
  const exists = list.some((x) => x.key === item.key);
  write(F_KEY, exists ? list.filter((x) => x.key !== item.key) : [item, ...list]);
  return !exists;
}

export function isFavorite(list: FavItem[], key: string) {
  return list.some((x) => x.key === key);
}

/* ---------- تقدّم الحلقات (لكل حلقة على حدة) ---------- */

export type EpisodeProgress = Record<string, { p: number; d: number; t: number }>;

const E_KEY = "iptv.episodes.v1";
const EMPTY_E: EpisodeProgress = {};

export function useEpisodeProgress() {
  return useSyncExternalStore(
    subscribe,
    () => read<EpisodeProgress>(E_KEY, EMPTY_E),
    () => EMPTY_E,
  );
}

export function recordEpisodeProgress(episodeId: string, current: number, duration: number) {
  if (!duration) return;
  const map = read<EpisodeProgress>(E_KEY, EMPTY_E);
  const prev = map[episodeId];
  if (prev && Math.abs(prev.p - current) < 5 && prev.d === duration) return;
  write(E_KEY, { ...map, [episodeId]: { p: current, d: duration, t: Date.now() } });
}

export function markEpisodeWatched(episodeId: string, watched = true) {
  const map = read<EpisodeProgress>(E_KEY, EMPTY_E);
  const prev = map[episodeId];
  const d = prev?.d || 1;
  write(E_KEY, { ...map, [episodeId]: { p: watched ? d : 0, d, t: Date.now() } });
}

export type EpisodeState = "watched" | "partial" | "none";

export function episodeState(map: EpisodeProgress, episodeId: string): EpisodeState {
  const e = map[episodeId];
  if (!e || !e.d) return "none";
  const ratio = e.p / e.d;
  if (ratio >= 0.9) return "watched";
  return ratio > 0.02 ? "partial" : "none";
}

export function clearEpisodeProgress() {
  write(E_KEY, {} as EpisodeProgress);
}
