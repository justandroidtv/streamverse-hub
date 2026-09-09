import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import {
  asArray,
  posterOf,
  useXtream,
  type Category,
  type Movie,
  type Series,
} from "@/lib/xtream-client";
import { EmptyState, ErrorState, PosterCard, ShimmerGrid } from "./media";

type Kind = "movie" | "series";

export function Catalog({ kind }: { kind: Kind }) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"recent" | "rating" | "alpha">("recent");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [term, setTerm] = useState("");

  const cats = useXtream<Category[]>({
    action: kind === "movie" ? "get_vod_categories" : "get_series_categories",
  });
  const items = useXtream<(Movie | Series)[]>({
    action: kind === "movie" ? "get_vod_streams" : "get_series",
    ...(category !== "all" ? { category_id: category } : {}),
  });

  const list = useMemo(() => {
    let data = asArray<Movie & Series>(items.data);
    if (term.trim()) {
      const t = term.trim().toLowerCase();
      data = data.filter((i) => i.name?.toLowerCase().includes(t));
    }
    const sorted = [...data];
    if (sort === "rating") sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    else if (sort === "alpha") sorted.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
    else
      sorted.sort(
        (a, b) => Number(b.added || b.last_modified || 0) - Number(a.added || a.last_modified || 0),
      );
    return sorted.slice(0, 600);
  }, [items.data, term, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="بحث فوري داخل القائمة"
          className="w-full max-w-xs rounded-xl border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="all">كل التصنيفات</option>
          {asArray<Category>(cats.data).map((c) => (
            <option key={c.category_id} value={c.category_id}>
              {c.category_name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-xl border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="recent">الأحدث</option>
          <option value="rating">الأعلى تقييماً</option>
          <option value="alpha">أبجدي</option>
        </select>
        <div className="ms-auto flex rounded-xl border border-input bg-surface p-1">
          <button
            onClick={() => setView("grid")}
            className={`grid size-8 place-items-center rounded-lg ${view === "grid" ? "bg-accent" : ""}`}
            aria-label="عرض شبكي"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`grid size-8 place-items-center rounded-lg ${view === "list" ? "bg-accent" : ""}`}
            aria-label="عرض قائمة"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {items.isLoading ? (
        <ShimmerGrid />
      ) : items.isError ? (
        <ErrorState message={(items.error as Error)?.message} onRetry={() => void items.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState title="لا توجد نتائج" hint="جرّب تصنيفاً آخر أو كلمة بحث مختلفة." />
      ) : view === "grid" ? (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {list.map((item) => (
            <ItemLink key={itemId(kind, item)} kind={kind} id={itemId(kind, item)}>
              <PosterCard title={item.name} poster={posterOf(item)} rating={item.rating} />
            </ItemLink>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((item) => (
            <ItemLink key={itemId(kind, item)} kind={kind} id={itemId(kind, item)}>
              <div className="flex items-center gap-4 rounded-xl bg-surface p-3 transition hover:bg-surface-elevated">
                <img
                  src={posterOf(item)}
                  alt={item.name}
                  loading="lazy"
                  className="h-24 w-16 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {kind === "movie" ? "فيلم" : "مسلسل"} · تقييم {Number(item.rating || 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </ItemLink>
          ))}
        </div>
      )}
    </div>
  );
}

function itemId(kind: Kind, item: Movie & Series) {
  return String(kind === "movie" ? item.stream_id : item.series_id);
}

function ItemLink({
  kind,
  id,
  children,
}: {
  kind: Kind;
  id: string;
  children: React.ReactNode;
}) {
  return kind === "movie" ? (
    <Link to="/movie/$id" params={{ id }} className="focus-card block rounded-xl">
      {children}
    </Link>
  ) : (
    <Link to="/series/$id" params={{ id }} className="focus-card block rounded-xl">
      {children}
    </Link>
  );
}
