import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, Play } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAccount } from "@/components/require-account";
import { ErrorState } from "@/components/media";
import { VideoPlayer } from "@/components/player";
import { episodeUrl, useXtream } from "@/lib/xtream-client";
import { useActiveAccount } from "@/lib/account";
import { isFavorite, recordWatch, toggleFavorite, useFavorites } from "@/lib/history";

export const Route = createFileRoute("/series/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل المسلسل — IPTV سمارت" },
      { name: "description", content: "استعرض مواسم المسلسل وحلقاته وشغّل أي حلقة مباشرة." },
      { property: "og:title", content: "تفاصيل المسلسل — IPTV سمارت" },
      { property: "og:description", content: "كل المواسم والحلقات في صفحة واحدة." },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAccount>
        <SeriesDetail />
      </RequireAccount>
    </AppShell>
  ),
});

type Episode = {
  id: string;
  episode_num: number;
  title: string;
  container_extension?: string;
  info?: { movie_image?: string; plot?: string; duration?: string };
};

type SeriesInfo = {
  info?: { name?: string; cover?: string; plot?: string; genre?: string; rating?: string };
  episodes?: Record<string, Episode[]>;
};

function SeriesDetail() {
  const { id } = Route.useParams();
  const account = useActiveAccount();
  const favorites = useFavorites();
  const [season, setSeason] = useState<string | null>(null);
  const [current, setCurrent] = useState<Episode | null>(null);

  const q = useXtream<SeriesInfo>({ action: "get_series_info", series_id: id });
  const info = q.data?.info;
  const episodes = q.data?.episodes || {};
  const seasons = useMemo(() => Object.keys(episodes).sort((a, b) => Number(a) - Number(b)), [episodes]);
  const activeSeason = season ?? seasons[0] ?? null;
  const list = activeSeason ? (episodes[activeSeason] ?? []) : [];

  const title = info?.name || "مسلسل";
  const poster = info?.cover || "";
  const key = `series:${id}`;

  if (q.isError)
    return <ErrorState message={(q.error as Error)?.message} onRetry={() => void q.refetch()} />;

  return (
    <div className="space-y-6">
      {current && account ? (
        <VideoPlayer
          src={episodeUrl(account, current.id, current.container_extension || "mp4")}
          onProgress={(c, d) =>
            recordWatch({
              key,
              kind: "series",
              id,
              title: `${title} — ح${current.episode_num}`,
              poster,
              progress: c,
              duration: d,
            })
          }
        />
      ) : null}

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="overflow-hidden rounded-2xl bg-surface">
          {poster ? (
            <img src={poster} alt={title} className="w-full object-cover" />
          ) : (
            <div className="aspect-[2/3]" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-black md:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{info?.genre}</p>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            {info?.plot || "لا يوجد وصف متاح."}
          </p>
          <button
            onClick={() => toggleFavorite({ key, kind: "series", id, title, poster })}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-surface px-5 py-3 font-semibold"
          >
            <Heart
              className={`size-4 ${isFavorite(favorites, key) ? "fill-primary text-primary" : ""}`}
            />
            المفضلة
          </button>
        </div>
      </div>

      {seasons.length ? (
        <div className="flex flex-wrap gap-2">
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                activeSeason === s ? "gradient-accent text-primary-foreground" : "bg-surface"
              }`}
            >
              الموسم {s}
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {list.map((ep) => (
          <button
            key={ep.id}
            onClick={() => setCurrent(ep)}
            className={`flex w-full items-center gap-4 rounded-xl p-3 text-start transition hover:bg-surface-elevated ${
              current?.id === ep.id ? "bg-surface-elevated" : "bg-surface"
            }`}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-background font-bold">
              {ep.episode_num}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{ep.title}</span>
              {ep.info?.duration ? (
                <span className="text-xs text-muted-foreground">{ep.info.duration}</span>
              ) : null}
            </span>
            <Play className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
