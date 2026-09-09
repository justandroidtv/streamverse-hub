import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAccount } from "@/components/require-account";
import { EmptyState, ErrorState } from "@/components/media";
import { VideoPlayer } from "@/components/player";
import {
  asArray,
  liveUrl,
  useXtream,
  type Category,
  type LiveChannel,
} from "@/lib/xtream-client";
import { useActiveAccount } from "@/lib/account";
import { isFavorite, recordWatch, toggleFavorite, useFavorites } from "@/lib/history";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "البث المباشر — IPTV سمارت" },
      { name: "description", content: "شاهد القنوات المباشرة من اشتراكك مع تصنيفات وبحث سريع." },
      { property: "og:title", content: "البث المباشر — IPTV سمارت" },
      { property: "og:description", content: "قنوات مباشرة بجودة عالية داخل المتصفح." },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAccount>
        <LivePage />
      </RequireAccount>
    </AppShell>
  ),
});

function LivePage() {
  const account = useActiveAccount();
  const favorites = useFavorites();
  const [category, setCategory] = useState("all");
  const [term, setTerm] = useState("");
  const [current, setCurrent] = useState<LiveChannel | null>(null);

  const cats = useXtream<Category[]>({ action: "get_live_categories" });
  const channels = useXtream<LiveChannel[]>({
    action: "get_live_streams",
    ...(category !== "all" ? { category_id: category } : {}),
  });

  const list = useMemo(() => {
    const data = asArray<LiveChannel>(channels.data);
    const t = term.trim().toLowerCase();
    return (t ? data.filter((c) => c.name?.toLowerCase().includes(t)) : data).slice(0, 800);
  }, [channels.data, term]);

  const favKey = current ? `live:${current.stream_id}` : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {current && account ? (
          <>
            <VideoPlayer src={liveUrl(account, current.stream_id)} live />
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-bold">{current.name}</h1>
              <button
                onClick={() =>
                  toggleFavorite({
                    key: favKey,
                    kind: "live",
                    id: String(current.stream_id),
                    title: current.name,
                    ...(current.stream_icon ? { poster: current.stream_icon } : {}),
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2 text-sm font-semibold"
              >
                <Heart
                  className={`size-4 ${isFavorite(favorites, favKey) ? "fill-primary text-primary" : ""}`}
                />
                المفضلة
              </button>
            </div>
          </>
        ) : (
          <div className="grid aspect-video place-items-center rounded-2xl bg-surface text-muted-foreground">
            اختر قناة من القائمة لبدء المشاهدة
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث عن قناة"
          className="w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="all">كل التصنيفات</option>
          {asArray<Category>(cats.data).map((c) => (
            <option key={c.category_id} value={c.category_id}>
              {c.category_name}
            </option>
          ))}
        </select>

        <div className="max-h-[70vh] space-y-1 overflow-y-auto pe-1">
          {channels.isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="shimmer h-14 rounded-xl" />
            ))
          ) : channels.isError ? (
            <ErrorState
              message={(channels.error as Error)?.message}
              onRetry={() => void channels.refetch()}
            />
          ) : list.length === 0 ? (
            <EmptyState title="لا توجد قنوات" />
          ) : (
            list.map((c) => (
              <button
                key={c.stream_id}
                onClick={() => {
                  setCurrent(c);
                  recordWatch({
                    key: `live:${c.stream_id}`,
                    kind: "live",
                    id: String(c.stream_id),
                    title: c.name,
                    ...(c.stream_icon ? { poster: c.stream_icon } : {}),
                  });
                }}
                className={`flex w-full items-center gap-3 rounded-xl p-2 text-start transition hover:bg-surface-elevated ${
                  current?.stream_id === c.stream_id ? "bg-surface-elevated" : "bg-surface"
                }`}
              >
                {c.stream_icon ? (
                  <img
                    src={c.stream_icon}
                    alt=""
                    loading="lazy"
                    className="size-10 rounded-lg bg-background object-contain p-1"
                  />
                ) : (
                  <span className="size-10 rounded-lg bg-background" />
                )}
                <span className="truncate text-sm font-medium">{c.name}</span>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
