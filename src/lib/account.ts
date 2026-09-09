import { useSyncExternalStore } from "react";
import type { Creds } from "./xtream.functions";

export type Account = Creds & { id: string; name: string };

const KEY = "iptv.accounts.v1";

type Store = { accounts: Account[]; activeId: string | null };

const EMPTY: Store = { accounts: [], activeId: null };

let cache: Store = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): Store {
  if (typeof window === "undefined") return EMPTY;
  if (loaded) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Store) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  loaded = true;
  return cache;
}

function write(next: Store) {
  cache = next;
  loaded = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAccounts() {
  return useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY,
  );
}

export function useActiveAccount(): Account | null {
  const store = useAccounts();
  return store.accounts.find((a) => a.id === store.activeId) ?? null;
}

export function addAccount(acc: Omit<Account, "id">) {
  const store = read();
  const id = `${Date.now()}`;
  write({ accounts: [...store.accounts, { ...acc, id }], activeId: id });
  return id;
}

export function setActiveAccount(id: string) {
  write({ ...read(), activeId: id });
}

export function removeAccount(id: string) {
  const store = read();
  const accounts = store.accounts.filter((a) => a.id !== id);
  write({ accounts, activeId: store.activeId === id ? (accounts[0]?.id ?? null) : store.activeId });
}
