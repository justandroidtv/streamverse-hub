import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RequireAccount } from "@/components/require-account";
import { EmptyState, PosterCard, SectionHeader, ShimmerGrid } from "@/components/media";
import {
  asArray,
  posterOf,
  useXtream,
  type LiveChannel,
  type Movie,
  type Series,
} from "@/lib/xtream-client";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : "" }),
  head: () => ({
    meta: [
      { title: "البحث — IPTV سمارت" },
      { name: "description", content: "ابحث في القنوات والأفلام والمسلسلات المتاحة في اشتراكك." },
      { property: "og:title", content: "البحث — IPTV سمارت" },
      { property: "og:description", content: "نتائج بحث فورية عبر كل المكتبة." },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAccount>
        <SearchPage />
      </RequireAccount>
    </AppShell>
  ),
});

function SearchPage() {
  const { q } = Route.useSearch();
  const term = q.trim().toLowerCase();

  const movies = useXtream<Movie[]>({ action: "get_vod_streams" });
  const series = useXtream<Series[]>({ action: "get_series" });
  const live = useXtream<LiveChannel[]>({ action: "get_live_streams" });

  const match = <T extends { name?: string }>(arr: T[]) =>
    term ? arr.filter((i) => i.name?.toLowerCase().includes(term)).slice(0, 40) : [];

  const m = match(asArray<Movie>(movies.data));
  const s = match(asArray<Series>(series.data));
  const l = match(asArray<LiveChannel>(live.data));
  const loading = movies.isLoading || series.isLoading || live.isLoading;
  const total = m.length + s.length + l.length;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black md:text-3xl">نتائج البحث عن «{q}»</h1>
      {loading ? (
        <ShimmerGrid count={8} />
      ) : total === 0 ? (
        <EmptyState title="لا توجد نتائج" hint="جرّب كلمات مختلفة." />
      ) : (
        <>
          {m.length ? (
            <section>
              <SectionHeader title="أفلام" />
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {m.map((i) => (
                  <Link
                    key={i.stream_id}
                    to="/movie/$id"
                    params={{ id: String(i.stream_id) }}
                    className="focus-card block rounded-xl"
                  >
                    <PosterCard title={i.name} poster={posterOf(i)} rating={i.rating} />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {s.length ? (
            <section>
              <SectionHeader title="مسلسلات" />
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {s.map((i) => (
                  <Link
                    key={i.series_id}
                    to="/series/$id"
                    params={{ id: String(i.series_id) }}
                    className="focus-card block rounded-xl"
                  >
                    <PosterCard title={i.name} poster={posterOf(i)} rating={i.rating} />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {l.length ? (
            <section>
              <SectionHeader title="قنوات مباشرة" />
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {l.map((i) => (
                  <Link key={i.stream_id} to="/live" className="focus-card block rounded-xl">
                    <PosterCard title={i.name} poster={posterOf(i)} badge="مباشر" square />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
