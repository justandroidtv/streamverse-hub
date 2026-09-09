import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, Play, Check, Hourglass, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAccount } from "@/components/require-account";
import { ErrorState } from "@/components/media";
import { VideoPlayer } from "@/components/player";
import { episodeUrl, useXtream } from "@/lib/xtream-client";
import { useActiveAccount } from "@/lib/account";
import {
  episodeState,
  isFavorite,
  markEpisodeWatched,
  recordEpisodeProgress,
  recordWatch,
  toggleFavorite,
  useEpisodeProgress,
  useFavorites,
} from "@/lib/history";

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
  info?: {
    name?: string;
    cover?: string;
    plot?: string;
    genre?: string;
    rating?: string;
    releaseDate?: string;
    backdrop_path?: string[];
  };
  episodes?: Record<string, Episode[]>;
};

function SeriesDetail() {
  const { id } = Route.useParams();
  const account = useActiveAccount();
  const favorites = useFavorites();
  const progress = useEpisodeProgress();
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
  const backdrop = info?.backdrop_path?.[0] || poster;
  const key = `series:${id}`;

  if (q.isError)
    return <ErrorState message={(q.error as Error)?.message} onRetry={() => void q.refetch()} />;

  return (
    <div className="space-y-6">
      {current && account ? (
        <VideoPlayer
          src={episodeUrl(account, current.id, current.container_extension || "mp4")}
          title={`${title} — ح${current.episode_num}`}
          startAt={progress[current.id]?.p}
          onProgress={(c, d) => {
            recordEpisodeProgress(current.id, c, d);
            recordWatch({
              key,
              kind: "series",
              id,
              title: `${title} — ح${current.episode_num}`,
              poster,
              progress: c,
              duration: d,
            });
          }}
        />
      ) : null}

      {/* رأس الصفحة */}
      <section className="relative overflow-hidden rounded-3xl bg-surface">
        {backdrop ? (
          <img
            src={backdrop}
            alt={title}
            className="absolute inset-0 size-full scale-110 object-cover opacity-30 blur-sm"
          />
        ) : null}
        <div className="absolute inset-0" style={{ background: "var(--scrim)" }} />
        <div className="relative grid gap-6 p-6 md:grid-cols-[200px_1fr] md:p-10">
          <div className="overflow-hidden rounded-2xl bg-surface-elevated">
            {poster ? (
              <img src={poster} alt={title} className="w-full object-cover" />
            ) : (
              <div className="aspect-[2/3]" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black md:text-4xl">{title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {info?.rating ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="size-4 fill-primary-glow text-primary-glow" />
                  {Number(info.rating).toFixed(1)}
                </span>
              ) : null}
              {info?.releaseDate ? <span>{info.releaseDate}</span> : null}
              {info?.genre ? <span>{info.genre}</span> : null}
              <span>{seasons.length} موسم</span>
            </p>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              {info?.plot || "لا يوجد وصف متاح."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {list[0] ? (
                <button
                  onClick={() => setCurrent(list[0] ?? null)}
                  className="inline-flex items-center gap-2 rounded-xl gradient-accent px-6 py-3 font-bold text-primary-foreground"
                >
                  <Play className="size-4" /> تشغيل الحلقة الأولى
                </button>
              ) : null}
              <button
                onClick={() => toggleFavorite({ key, kind: "series", id, title, poster })}
                className="inline-flex items-center gap-2 rounded-xl bg-surface-elevated px-5 py-3 font-semibold"
              >
                <Heart
                  className={`size-4 ${isFavorite(favorites, key) ? "fill-primary text-primary" : ""}`}
                />
                المفضلة
              </button>
            </div>
          </div>
        </div>
      </section>

      {seasons.length ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold ${
                activeSeason === s ? "gradient-accent text-primary-foreground" : "bg-surface"
              }`}
            >
              الموسم {s}
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {list.map((ep) => {
          const state = episodeState(progress, ep.id);
          return (
            <div
              key={ep.id}
              className={`flex items-center gap-4 rounded-xl p-3 transition ${
                current?.id === ep.id ? "bg-surface-elevated" : "bg-surface"
              }`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-background font-bold">
                {ep.episode_num}
              </span>
              {ep.info?.movie_image ? (
                <img
                  src={ep.info.movie_image}
                  alt={ep.title}
                  loading="lazy"
                  className="hidden h-14 w-24 rounded-lg object-cover sm:block"
                />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{ep.title}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {ep.info?.duration ? <span>{ep.info.duration}</span> : null}
                  {state === "watched" ? (
                    <span className="inline-flex items-center gap-1 text-[color:var(--color-success)]">
                      <Check className="size-3.5" /> شوهدت
                    </span>
                  ) : state === "partial" ? (
                    <span className="inline-flex items-center gap-1">
                      <Hourglass className="size-3.5" />
                      {Math.round(((progress[ep.id]?.p ?? 0) / (progress[ep.id]?.d || 1)) * 100)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Hourglass className="size-3.5" /> لم تُشاهد
                    </span>
                  )}
                </span>
              </span>
              <button
                onClick={() => markEpisodeWatched(ep.id, state !== "watched")}
                className="rounded-lg bg-background px-3 py-1.5 text-xs font-semibold"
              >
                {state === "watched" ? "إلغاء" : "تمّت المشاهدة"}
              </button>
              <button
                onClick={() => setCurrent(ep)}
                className="inline-flex items-center gap-1.5 rounded-lg gradient-accent px-3 py-2 text-xs font-bold text-primary-foreground"
              >
                <Play className="size-3.5" /> تشغيل
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
