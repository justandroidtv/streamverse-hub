import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PosterCard } from "@/components/media";
import { useFavorites } from "@/lib/history";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "المفضلة — IPTV سمارت" },
      { name: "description", content: "كل ما حفظته من قنوات وأفلام ومسلسلات في مكان واحد." },
      { property: "og:title", content: "المفضلة — IPTV سمارت" },
      { property: "og:description", content: "قائمتك المحفوظة من القنوات والأفلام والمسلسلات." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const favorites = useFavorites();

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-black md:text-3xl">المفضلة</h1>
      {favorites.length === 0 ? (
        <EmptyState title="القائمة فارغة" hint="أضف عناصر بالضغط على أيقونة القلب." />
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {favorites.map((f) =>
            f.kind === "live" ? (
              <Link key={f.key} to="/live" className="focus-card block rounded-xl">
                <PosterCard title={f.title} poster={f.poster} badge="مباشر" square />
              </Link>
            ) : f.kind === "movie" ? (
              <Link
                key={f.key}
                to="/movie/$id"
                params={{ id: f.id }}
                className="focus-card block rounded-xl"
              >
                <PosterCard title={f.title} poster={f.poster} />
              </Link>
            ) : (
              <Link
                key={f.key}
                to="/series/$id"
                params={{ id: f.id }}
                className="focus-card block rounded-xl"
              >
                <PosterCard title={f.title} poster={f.poster} />
              </Link>
            ),
          )}
        </div>
      )}
    </AppShell>
  );
}
