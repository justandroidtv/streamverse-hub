import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RequireAccount } from "@/components/require-account";
import { Catalog, type CatalogFilter } from "@/components/catalog";

type SeriesSearch = { filter?: CatalogFilter };

const ALLOWED: CatalogFilter[] = ["all", "latest", "top_rated", "genre"];

export const Route = createFileRoute("/series/")({
  validateSearch: (search: Record<string, unknown>): SeriesSearch => {
    const f = String(search["filter"] ?? "");
    return ALLOWED.includes(f as CatalogFilter) ? { filter: f as CatalogFilter } : {};
  },
  head: () => ({
    meta: [
      { title: "المسلسلات — IPTV سمارت" },
      { name: "description", content: "تصفح المسلسلات بالمواسم والحلقات مع فلاتر التصنيف والتقييم." },
      { property: "og:title", content: "المسلسلات — IPTV سمارت" },
      { property: "og:description", content: "كل مسلسلات اشتراكك مرتبة بالمواسم والحلقات." },
    ],
  }),
  component: SeriesPage,
});

function SeriesPage() {
  const { filter } = Route.useSearch();
  return (
    <AppShell>
      <RequireAccount>
        <h1 className="mb-6 text-2xl font-black md:text-3xl">المسلسلات</h1>
        <Catalog kind="series" initialFilter={filter ?? "all"} />
      </RequireAccount>
    </AppShell>
  );
}
