import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RequireAccount } from "@/components/require-account";
import { Catalog, type CatalogFilter } from "@/components/catalog";

type MoviesSearch = { filter?: CatalogFilter };

const ALLOWED: CatalogFilter[] = ["all", "latest", "top_rated", "genre"];

export const Route = createFileRoute("/movies")({
  validateSearch: (search: Record<string, unknown>): MoviesSearch => {
    const f = String(search["filter"] ?? "");
    return ALLOWED.includes(f as CatalogFilter) ? { filter: f as CatalogFilter } : {};
  },
  head: () => ({
    meta: [
      { title: "الأفلام — IPTV سمارت" },
      { name: "description", content: "تصفح مكتبة الأفلام حسب التصنيف والتقييم والأحدث." },
      { property: "og:title", content: "الأفلام — IPTV سمارت" },
      { property: "og:description", content: "مكتبة أفلام كاملة من اشتراكك مع فلاتر وبحث فوري." },
    ],
  }),
  component: MoviesPage,
});

function MoviesPage() {
  const { filter } = Route.useSearch();
  return (
    <AppShell>
      <RequireAccount>
        <h1 className="mb-6 text-2xl font-black md:text-3xl">الأفلام</h1>
        <Catalog kind="movie" initialFilter={filter ?? "all"} />
      </RequireAccount>
    </AppShell>
  );
}
