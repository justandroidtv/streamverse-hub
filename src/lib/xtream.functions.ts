import { createServerFn } from "@tanstack/react-start";

export type Creds = { server: string; username: string; password: string };

function normalizeBase(server: string) {
  let s = server.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  return s;
}

async function call(creds: Creds, params: Record<string, string>) {
  const base = normalizeBase(creds.server);
  const url = new URL(`${base}/player_api.php`);
  url.searchParams.set("username", creds.username);
  url.searchParams.set("password", creds.password);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "VLC/3.0.20 LibVLC/3.0.20", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`تعذر الاتصال بالخادم (${res.status})`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("رد الخادم غير صالح. تأكد من الرابط وبيانات الدخول.");
  }
}

type Input = { creds: Creds; params: Record<string, string> };

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Generic Xtream Codes proxy — keeps credentials off cross-origin browser requests. */
export const xtreamCall = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => d)
  .handler(async ({ data }) => {
    return (await call(data.creds, data.params)) as Json;
  });


export const xtreamLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { creds: Creds }) => d)
  .handler(async ({ data }) => {
    const info = (await call(data.creds, {})) as {
      user_info?: { auth?: number; status?: string; exp_date?: string; username?: string };
      server_info?: unknown;
    };
    if (!info?.user_info || info.user_info.auth !== 1) {
      throw new Error("بيانات الدخول غير صحيحة");
    }
    return info.user_info;
  });
