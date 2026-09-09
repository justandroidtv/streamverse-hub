import { useEffect, useRef, useState } from "react";
import { ExternalPlayerBar } from "@/components/external-player";
import { buildExternalUrl, useSettings } from "@/lib/settings";

export function VideoPlayer({
  src,
  live,
  title,
  startAt,
  onProgress,
}: {
  src: string;
  live?: boolean | undefined;
  title?: string | undefined;
  startAt?: number | undefined;
  onProgress?: ((current: number, duration: number) => void) | undefined;
}) {
  const settings = useSettings();
  const ref = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const external = settings.engine !== "internal" && settings.engine !== "ask";

  // تشغيل خارجي: افتح المشغل المفضّل مباشرة عند تغيّر المصدر
  useEffect(() => {
    if (!external || typeof window === "undefined") return;
    window.location.href = buildExternalUrl(
      settings.engine as "mpv" | "vlc" | "potplayer",
      src,
      settings,
    );
  }, [external, src, settings]);

  useEffect(() => {
    if (external) return;
    const video = ref.current;
    if (!video) return;
    setError(null);
    let destroy = () => {};
    let cancelled = false;

    video.volume = Math.min(1, Math.max(0, settings.defaultVolume / 100));
    video.muted = settings.muteOnStart;

    const isHls = src.includes(".m3u8");
    if (isHls && !video.canPlayType("application/vnd.apple.mpegurl")) {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setError("متصفحك لا يدعم هذا النوع من البث.");
          return;
        }
        const hls = new Hls({
          lowLatencyMode: settings.hlsLowLatency,
          enableWorker: settings.hlsWorker,
          maxBufferLength: settings.hlsMaxBufferLength,
          startLevel: settings.hlsStartLevel,
          manifestLoadingTimeOut: settings.requestTimeout,
          manifestLoadingMaxRetry: settings.retryCount,
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) setError("انقطع البث أو أن القناة غير متاحة حالياً.");
        });
        destroy = () => hls.destroy();
      });
    } else {
      video.src = src;
    }
    if (!live && settings.resumePlayback && startAt && startAt > 5) {
      const seek = () => {
        video.currentTime = startAt;
        video.removeEventListener("loadedmetadata", seek);
      };
      video.addEventListener("loadedmetadata", seek);
    }
    if (settings.autoplay) video.play().catch(() => {});
    return () => {
      cancelled = true;
      destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, attempt, external]);

  return (
    <div className="space-y-3">
      {external ? (
        <div className="grid aspect-video place-items-center rounded-2xl bg-surface p-6 text-center text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">التشغيل الخارجي مفعّل</p>
            <p className="mt-2 text-sm">
              تم إرسال الرابط إلى المشغل المختار. إن لم يفتح تلقائياً استخدم الأزرار بالأسفل.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video
            ref={ref}
            controls
            playsInline
            className="aspect-video w-full bg-black"
            onError={() => setError("تعذّر تشغيل هذا المصدر.")}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (!live && v.duration) onProgress?.(v.currentTime, v.duration);
            }}
          />
          {live ? (
            <span className="pointer-events-none absolute top-3 start-3 flex items-center gap-2 rounded-md bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
              <span className="live-dot size-2 rounded-full bg-destructive-foreground" /> مباشر
            </span>
          ) : null}
          {error ? (
            <div className="absolute inset-0 grid place-items-center bg-background/90 p-6 text-center">
              <div>
                <p className="font-semibold">{error}</p>
                <button
                  onClick={() => setAttempt((a) => a + 1)}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
      <ExternalPlayerBar src={src} title={title} />
    </div>
  );
}
