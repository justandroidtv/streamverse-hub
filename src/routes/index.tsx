import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Play, History, Info } from "lucide-react";
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

type Card = {
  key: string;
  kind: "movie" | "series";
  id: string;
  title: string;
  poster: string;
  rating?: string | number | undefined;
  added: number;
};

function Home() {
  const history = useHistory();
  const movies = useXtream<Movie[]>({ action: "get_vod_streams" });
  const series = useXtream<Series[]>({ action: "get_series" });
  const loading = movies.isLoading || series.isLoading;

  const all = useMemo<Card[]>(() => {
    const m = asArray<Movie>(movies.data).map<Card>((x) => ({
      key: `movie:${x.stream_id}`,
      kind: "movie",
      id: String(x.stream_id),
      title: x.name,
      poster: posterOf(x),
      rating: x.rating,
      added: Number(x.added || 0),
    }));
    const s = asArray<Series>(series.data).map<Card>((x) => ({
      key: `series:${x.series_id}`,
      kind: "series",
      id: String(x.series_id),
      title: x.name,
      poster: posterOf(x),
      rating: x.rating,
      added: Number(x.last_modified || 0),
    }));
    return [...m, ...s];
  }, [movies.data, series.data]);

  const latest = useMemo(() => [...all].sort((a, b) => b.added - a.added).slice(0, 24), [all]);
  const topRated = useMemo(
    () => [...all].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 24),
    [all],
  );
  // "الأكثر رواجاً": الأعلى تقييماً بين أحدث ما أُضيف
  const trending = useMemo(
    () =>
      [...all]
        .sort((a, b) => b.added - a.added)
        .slice(0, 300)
        .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
        .slice(0, 24),
    [all],
  );
  const hero = latest.find((x) => x.poster) ?? latest[0];

  return (
    <div className="space-y-10">
      {hero ? (
        <section className="relative overflow-hidden rounded-3xl bg-surface">
          {hero.poster ? (
            <img
              src={hero.poster}
              alt={hero.title}
              className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-sm"
            />
          ) : null}
          <div className="absolute inset-0" style={{ background: "var(--scrim)" }} />
          <div className="relative grid gap-6 p-8 md:grid-cols-[180px_1fr] md:p-14">
            {hero.poster ? (
              <img
                src={hero.poster}
                alt={hero.title}
                className="hidden w-44 rounded-2xl object-cover shadow-2xl md:block"
              />
            ) : null}
            <div className="max-w-xl">
              <span className="rounded-full bg-background/60 px-3 py-1 text-xs font-bold">
                مضاف حديثاً
              </span>
              <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">{hero.title}</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                ابدأ المشاهدة فوراً من أحدث ما وصل إلى مكتبتك.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {hero.kind === "movie" ? (
                  <Link
                    to="/movie/$id"
                    params={{ id: hero.id }}
                    search={{ play: true }}
                    className="inline-flex items-center gap-2 rounded-xl gradient-accent px-6 py-3 font-bold text-primary-foreground"
                  >
                    <Play className="size-4" /> تشغيل الآن
                  </Link>
                ) : (
                  <Link
                    to="/series/$id"
                    params={{ id: hero.id }}
                    className="inline-flex items-center gap-2 rounded-xl gradient-accent px-6 py-3 font-bold text-primary-foreground"
                  >
                    <Play className="size-4" /> تشغيل الآن
                  </Link>
                )}
                <Link
                  to={hero.kind === "movie" ? "/movie/$id" : "/series/$id"}
                  params={{ id: hero.id }}
                  className="inline-flex items-center gap-2 rounded-xl bg-surface-elevated px-5 py-3 font-semibold"
                >
                  <Info className="size-4" /> التفاصيل
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {history.length ? (
        <section>
          <SectionHeader
            title="استمر في المشاهدة"
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

      <CardRow title="أحدث الإضافات" items={latest} loading={loading} seeAll="latest" />
      <CardRow title="الأكثر رواجاً هذا الأسبوع" items={trending} loading={loading} seeAll="latest" />
      <CardRow title="الأعلى تقييماً" items={topRated} loading={loading} seeAll="top_rated" />
    </div>
  );
}

function CardRow({
  title,
  items,
  loading,
  seeAll,
}: {
  title: string;
  items: Card[];
  loading: boolean;
  seeAll: "latest" | "top_rated";
}) {
  return (
    <section>
      <SectionHeader
        title={title}
        action={
          <span className="flex gap-3 text-sm text-primary">
            <Link to="/movies" search={{ filter: seeAll }}>
              كل الأفلام
            </Link>
            <Link to="/series" search={{ filter: seeAll }}>
              كل المسلسلات
            </Link>
          </span>
        }
      />
      {loading ? (
        <ShimmerGrid count={8} />
      ) : items.length === 0 ? (
        <EmptyState title="لا يوجد محتوى" />
      ) : (
        <Row>
          {items.map((c) => (
            <CardLink key={c.key} card={c}>
              <PosterCard title={c.title} poster={c.poster} rating={c.rating} />
            </CardLink>
          ))}
        </Row>
      )}
    </section>
  );
}

function CardLink({ card, children }: { card: Card; children: React.ReactNode }) {
  return card.kind === "movie" ? (
    <Link
      to="/movie/$id"
      params={{ id: card.id }}
      className="focus-card w-32 shrink-0 rounded-xl md:w-40"
    >
      {children}
    </Link>
  ) : (
    <Link
      to="/series/$id"
      params={{ id: card.id }}
      className="focus-card w-32 shrink-0 rounded-xl md:w-40"
    >
      {children}
    </Link>
  );
}
