import type { ReactNode } from "react";
import { Star, ImageOff, Inbox, WifiOff, RotateCw } from "lucide-react";

export function RatingBadge({ rating }: { rating?: string | number | undefined }) {
  const value = Number(rating);
  if (!rating || Number.isNaN(value) || value <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-background/70 px-1.5 py-0.5 text-xs font-semibold backdrop-blur">
      <Star className="size-3 fill-primary-glow text-primary-glow" />
      {value.toFixed(1)}
    </span>
  );
}

export function PosterCard({
  title,
  poster,
  subtitle,
  rating,
  badge,
  progress,
  square,
}: {
  title: string;
  poster?: string | undefined;
  subtitle?: string | undefined;
  rating?: string | number | undefined;
  badge?: string | undefined;
  progress?: number | undefined;
  square?: boolean | undefined;
}) {
  return (
    <div className="group w-full">
      <div
        className={`relative overflow-hidden rounded-xl bg-surface ${square ? "aspect-square" : "aspect-[2/3]"}`}
      >
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className={`size-full ${square ? "object-contain p-4" : "object-cover"}`}
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-7" />
          </div>
        )}
        {badge ? (
          <span className="absolute top-2 start-2 rounded-md gradient-accent px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
            {badge}
          </span>
        ) : null}
        <div className="absolute bottom-2 end-2">
          <RatingBadge rating={rating} />
        </div>
        {progress && progress > 0 ? (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-background/60">
            <div
              className="h-full gradient-accent"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{title}</p>
      {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode | undefined }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
      {action}
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto py-2 pb-4">
      {children}
    </div>
  );
}

export function ShimmerGrid({ count = 12, square }: { count?: number | undefined; square?: boolean | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`shimmer rounded-xl ${square ? "aspect-square" : "aspect-[2/3]"}`}
        />
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string | undefined }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
      <Inbox className="mb-3 size-10 text-muted-foreground" />
      <p className="font-semibold">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string | undefined; onRetry?: (() => void) | undefined }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/10 py-14 text-center">
      <WifiOff className="mb-3 size-10 text-destructive" />
      <p className="font-semibold">تعذّر تحميل المحتوى</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {message || "تحقق من الاتصال بالإنترنت أو من بيانات الاشتراك."}
      </p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <RotateCw className="size-4" /> إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}
