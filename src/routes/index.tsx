import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, History } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAccount } from "@/components/require-account";
import { EmptyState, PosterCard, Row, SectionHeader, ShimmerGrid } from "@/components/media";
import { asArray, posterOf, useXtream, type Movie, type Series } from "@/lib/xtream-client";
import { useHistory } from "@/lib/history";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IPTV سمارت — أفلام ومسلسلات وقنوات مباشرة" },
      {
        name: "description",
        content: "شغّل اشتراك Xtream Codes الخاص بك: قنوات مباشرة وأفلام ومسلسلات بواجهة عربية سريعة.",
      },
      { property: "og:title", content: "IPTV سمارت — مشغّل اشتراكك" },
      {
        property: "og:description",
        content: "قنوات مباشرة وأفلام ومسلسلات من اشتراك Xtream Codes في مكان واحد.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAccount>
        <Home />
      </RequireAccount>
    </AppShell>
  ),
});

function Home() {
  const history = useHistory();
  const movies = useXtream<Movie[]>({ action: "get_vod_streams" });
  const series = useXtream<Series[]>({ action: "get_series" });

  const latestMovies = [...asArray<Movie>(movies.data)]
    .sort((a, b) => Number(b.added || 0) - Number(a.added || 0))
    .slice(0, 24);
  const topSeries = [...asArray<Series>(series.data)]
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 24);
  const hero = latestMovies[0];

  return (
    <div className="space-y-10">
      {hero ? (
        <section className="relative overflow-hidden rounded-3xl bg-surface p-8 md:p-14">
          <div className="absolute inset-0 opacity-30 blur-2xl gradient-accent" />
          <div className="relative max-w-xl">
            <span className="rounded-full bg-background/60 px-3 py-1 text-xs font-bold">
              مضاف حديثاً
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">{hero.name}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              ابدأ المشاهدة فوراً من أحدث ما وصل إلى مكتبتك.
            </p>
            <Link
              to="/movie/$id"
              params={{ id: String(hero.stream_id) }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl gradient-accent px-6 py-3 font-bold text-primary-foreground"
            >
              <Play className="size-4" /> شاهد الآن
            </Link>
          </div>
        </section>
      ) : null}

      {history.length ? (
        <section>
          <SectionHeader
            title="متابعة المشاهدة"
            action={
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <History className="size-4" /> {history.length}
              </span>
            }
          />
          <Row>
            {history.map((h) => (
              <Link
                key={h.key}
                to={h.kind === "series" ? "/series/$id" : h.kind === "movie" ? "/movie/$id" : "/live"}
                params={{ id: h.id }}
                className="focus-card w-32 shrink-0 rounded-xl md:w-40"
              >
                <PosterCard
                  title={h.title}
                  poster={h.poster}
                  progress={h.progress && h.duration ? h.progress / h.duration : undefined}
                />
              </Link>
            ))}
          </Row>
        </section>
      ) : null}

      <section>
        <SectionHeader
          title="أحدث الأفلام"
          action={
            <Link to="/movies" className="text-sm text-primary">
              عرض الكل
            </Link>
          }
        />
        {movies.isLoading ? (
          <ShimmerGrid count={8} />
        ) : latestMovies.length === 0 ? (
          <EmptyState title="لا توجد أفلام" />
        ) : (
          <Row>
            {latestMovies.map((m) => (
              <Link
                key={m.stream_id}
                to="/movie/$id"
                params={{ id: String(m.stream_id) }}
                className="focus-card w-32 shrink-0 rounded-xl md:w-40"
              >
                <PosterCard title={m.name} poster={posterOf(m)} rating={m.rating} />
              </Link>
            ))}
          </Row>
        )}
      </section>

      <section>
        <SectionHeader
          title="مسلسلات مميزة"
          action={
            <Link to="/series" className="text-sm text-primary">
              عرض الكل
            </Link>
          }
        />
        {series.isLoading ? (
          <ShimmerGrid count={8} />
        ) : topSeries.length === 0 ? (
          <EmptyState title="لا توجد مسلسلات" />
        ) : (
          <Row>
            {topSeries.map((s) => (
              <Link
                key={s.series_id}
                to="/series/$id"
                params={{ id: String(s.series_id) }}
                className="focus-card w-32 shrink-0 rounded-xl md:w-40"
              >
                <PosterCard title={s.name} poster={posterOf(s)} rating={s.rating} />
              </Link>
            ))}
          </Row>
        )}
      </section>
    </div>
  );
}
