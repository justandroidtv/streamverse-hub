import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Play } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAccount } from "@/components/require-account";
import { ErrorState } from "@/components/media";
import { VideoPlayer } from "@/components/player";
import { movieUrl, useXtream } from "@/lib/xtream-client";
import { useActiveAccount } from "@/lib/account";
import { isFavorite, recordWatch, toggleFavorite, useFavorites } from "@/lib/history";

export const Route = createFileRoute("/movie/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الفيلم — IPTV سمارت" },
      { name: "description", content: "شاهد الفيلم وتعرّف على قصته وتقييمه ومدته." },
      { property: "og:title", content: "تفاصيل الفيلم — IPTV سمارت" },
      { property: "og:description", content: "تشغيل مباشر للفيلم مع كل التفاصيل." },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAccount>
        <MovieDetail />
      </RequireAccount>
    </AppShell>
  ),
});

type VodInfo = {
  info?: { movie_image?: string; plot?: string; genre?: string; releasedate?: string; rating?: string; duration?: string };
  movie_data?: { name?: string; container_extension?: string; stream_id?: number };
};

function MovieDetail() {
  const { id } = Route.useParams();
  const account = useActiveAccount();
  const favorites = useFavorites();
  const [playing, setPlaying] = useState(false);

  const q = useXtream<VodInfo>({ action: "get_vod_info", vod_id: id });
  const info = q.data?.info;
  const data = q.data?.movie_data;
  const title = data?.name || "فيلم";
  const poster = info?.movie_image || "";
  const key = `movie:${id}`;

  if (q.isError)
    return <ErrorState message={(q.error as Error)?.message} onRetry={() => void q.refetch()} />;

  return (
    <div className="space-y-6">
      {playing && account ? (
        <VideoPlayer
          src={movieUrl(account, id, data?.container_extension || "mp4")}
          onProgress={(c, d) =>
            recordWatch({
              key,
              kind: "movie",
              id,
              title,
              poster,
              ext: data?.container_extension || "mp4",
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
          <p className="mt-2 text-sm text-muted-foreground">
            {[info?.releasedate, info?.genre, info?.duration].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            {info?.plot || "لا يوجد وصف متاح لهذا الفيلم."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setPlaying(true)}
              className="inline-flex items-center gap-2 rounded-xl gradient-accent px-6 py-3 font-bold text-primary-foreground"
            >
              <Play className="size-4" /> تشغيل
            </button>
            <button
              onClick={() => toggleFavorite({ key, kind: "movie", id, title, poster })}
              className="inline-flex items-center gap-2 rounded-xl bg-surface px-5 py-3 font-semibold"
            >
              <Heart
                className={`size-4 ${isFavorite(favorites, key) ? "fill-primary text-primary" : ""}`}
              />
              المفضلة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
