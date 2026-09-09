import { useQuery } from "@tanstack/react-query";
import { xtreamCall, type Creds } from "./xtream.functions";
import { useActiveAccount } from "./account";

export type Category = { category_id: string; category_name: string };

export type LiveChannel = {
  stream_id: number;
  name: string;
  stream_icon?: string;
  category_id?: string;
  epg_channel_id?: string;
};

export type Movie = {
  stream_id: number;
  name: string;
  stream_icon?: string;
  rating?: string | number;
  added?: string;
  category_id?: string;
  container_extension?: string;
};

export type Series = {
  series_id: number;
  name: string;
  cover?: string;
  plot?: string;
  rating?: string | number;
  last_modified?: string;
  category_id?: string;
  genre?: string;
};

function baseUrl(creds: Creds) {
  let s = creds.server.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  return s;
}

export function liveUrl(creds: Creds, id: number | string) {
  return `${baseUrl(creds)}/live/${creds.username}/${creds.password}/${id}.m3u8`;
}
export function movieUrl(creds: Creds, id: number | string, ext = "mp4") {
  return `${baseUrl(creds)}/movie/${creds.username}/${creds.password}/${id}.${ext}`;
}
export function episodeUrl(creds: Creds, id: number | string, ext = "mp4") {
  return `${baseUrl(creds)}/series/${creds.username}/${creds.password}/${id}.${ext}`;
}

/** Query any Xtream action through the server proxy for the active account. */
export function useXtream<T>(params: Record<string, string>, enabled = true) {
  const account = useActiveAccount();
  const creds = account
    ? { server: account.server, username: account.username, password: account.password }
    : null;

  return useQuery({
    queryKey: ["xtream", account?.id, params],
    enabled: Boolean(creds) && enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await xtreamCall({ data: { creds: creds!, params } });
      return res as T;
    },
  });
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function posterOf(item: { stream_icon?: string; cover?: string }) {
  const src = item.stream_icon || item.cover || "";
  return src && /^https?:\/\//i.test(src) ? src : "";
}
