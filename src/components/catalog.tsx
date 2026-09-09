import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, List, Heart, Info, Search } from "lucide-react";
import {
  asArray,
  posterOf,
  useXtream,
  type Category,
  type Movie,
  type Series,
} from "@/lib/xtream-client";
import { useSettings } from "@/lib/settings";
import { isFavorite, toggleFavorite, useFavorites } from "@/lib/history";
import { EmptyState, ErrorState, PosterCard, ShimmerGrid } from "./media";

type Kind = "movie" | "series";
export type CatalogFilter = "all" | "latest" | "top_rated" | "genre";

const FILTERS: { id: CatalogFilter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "latest", label: "أحدث الإضافات" },
  { id: "top_rated", label: "الأعلى تقييماً" },
  { id: "genre", label: "حسب التصنيف" },
];

export function Catalog({ kind, initialFilter = "all" }: { kind: Kind; initialFilter?: CatalogFilter }) {
  const settings = useSettings();
  const favorites = useFavorites();
  const [filter, setFilter] = useState<CatalogFilter>(initialFilter);
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [term, setTerm] = useState("");
  const [menu, setMenu] = useState<{ id: string; title: string; poster: string } | null>(null);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const cats = useXtream<Category[]>({
    action: kind === "movie" ? "get_vod_categories" : "get_series_categories",
  });
  const items = useXtream<(Movie | Series)[]>({
    action: kind === "movie" ? "get_vod_streams" : "get_series",
    ...(filter === "genre" && category !== "all" ? { category_id: category } : {}),
  });

  const list = useMemo(() => {
    let data = asArray<Movie & Series>(items.data);
    if (term.trim()) {
      const t = term.trim().toLowerCase();
      data = data.filter((i) => i.name?.toLowerCase().includes(t));
    }
    const sorted = [...data];
    if (filter === "top_rated") sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    else
      sorted.sort(
        (a, b) => Number(b.added || b.last_modified || 0) - Number(a.added || a.last_modified || 0),
      );
    return sorted.slice(0, settings.pageSize * 5);
  }, [items.data, term, filter, settings.pageSize]);

  const cols = Math.min(10, Math.max(2, settings.gridSize));

  return (
    <div className="space-y-6">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === f.id ? "gradient-accent text-primary-foreground" : "bg-surface text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="بحث فوري داخل القائمة"
            className="w-full rounded-xl border border-input bg-surface py-2 ps-9 pe-3 text-sm outline-none focus:border-primary"
          />
        </div>
        {filter === "genre" ? (
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
        ) : null}
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
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {list.map((item) => (
            <LongPress
              key={itemId(kind, item)}
              onLongPress={() =>
                setMenu({ id: itemId(kind, item), title: item.name, poster: posterOf(item) })
              }
            >
              <ItemLink kind={kind} id={itemId(kind, item)}>
                <PosterCard
                  title={item.name}
                  poster={posterOf(item)}
                  rating={settings.showRatings ? item.rating : undefined}
                />
              </ItemLink>
            </LongPress>
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

      {menu ? (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-4 sm:place-items-center"
          onClick={() => setMenu(null)}
        >
          <div
            className="w-full max-w-sm space-y-2 rounded-2xl bg-surface-elevated p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="truncate font-bold">{menu.title}</p>
            <button
              onClick={() => {
                toggleFavorite({
                  key: `${kind}:${menu.id}`,
                  kind,
                  id: menu.id,
                  title: menu.title,
                  poster: menu.poster,
                });
                setMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-xl bg-surface p-3 text-sm font-semibold"
            >
              <Heart
                className={`size-4 ${isFavorite(favorites, `${kind}:${menu.id}`) ? "fill-primary text-primary" : ""}`}
              />
              {isFavorite(favorites, `${kind}:${menu.id}`) ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            </button>
            <ItemLink kind={kind} id={menu.id}>
              <span className="flex w-full items-center gap-2 rounded-xl bg-surface p-3 text-sm font-semibold">
                <Info className="size-4" /> عرض التفاصيل
              </span>
            </ItemLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LongPress({ children, onLongPress }: { children: React.ReactNode; onLongPress: () => void }) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);

  const start = () => {
    fired.current = false;
    timer.current = window.setTimeout(() => {
      fired.current = true;
      onLongPress();
    }, 550);
  };
  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
  };

  return (
    <div
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress();
      }}
      onClickCapture={(e) => {
        if (fired.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {children}
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
