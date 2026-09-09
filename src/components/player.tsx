import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Subtitles,
  Gauge,
  Keyboard,
} from "lucide-react";
import { ExternalPlayerBar } from "@/components/external-player";
import { buildExternalUrl, useSettings } from "@/lib/settings";

/** المشغل الداخلي بواجهة واختصارات على طريقة mpv. */
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
  const boxRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(settings.muteOnStart);
  const [volume, setVolume] = useState(settings.defaultVolume / 100);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [subs, setSubs] = useState(settings.subtitlesEnabled);
  const [osd, setOsd] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState(false);
  const external = settings.engine !== "internal" && settings.engine !== "ask";

  const flash = useCallback((text: string) => {
    setOsd(text);
    window.setTimeout(() => setOsd((v) => (v === text ? null : v)), 1200);
  }, []);

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

  /* ---------- أوامر المشغل ---------- */
  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      flash("تشغيل");
    } else {
      v.pause();
      flash("إيقاف مؤقت");
    }
  }, [flash]);

  const seekBy = useCallback(
    (delta: number) => {
      const v = ref.current;
      if (!v) return;
      v.currentTime = Math.max(0, v.currentTime + delta);
      flash(`${delta > 0 ? "+" : ""}${delta} ثانية`);
    },
    [flash],
  );

  const bumpVolume = useCallback(
    (delta: number) => {
      const v = ref.current;
      if (!v) return;
      const next = Math.min(1, Math.max(0, v.volume + delta));
      v.volume = next;
      setVolume(next);
      flash(`الصوت ${Math.round(next * 100)}%`);
    },
    [flash],
  );

  const setRate = useCallback(
    (rate: number) => {
      const v = ref.current;
      if (!v) return;
      const next = Math.min(4, Math.max(0.25, Number(rate.toFixed(2))));
      v.playbackRate = next;
      setSpeed(next);
      flash(`السرعة ×${next}`);
    },
    [flash],
  );

  const toggleMute = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    flash(v.muted ? "كتم الصوت" : "إلغاء الكتم");
  }, [flash]);

  const toggleFullscreen = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void box.requestFullscreen?.();
  }, []);

  const toggleSubs = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    const next = !subs;
    setSubs(next);
    const tracks = v.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      if (t) t.mode = next ? "showing" : "disabled";
    }
    flash(next ? "الترجمة مفعّلة" : "الترجمة متوقفة");
  }, [subs, flash]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /* ---------- اختصارات لوحة المفاتيح على طريقة mpv ---------- */
  useEffect(() => {
    if (external) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      switch (e.key) {
        case " ":
        case "p":
          e.preventDefault();
          toggle();
          break;
        case "ArrowRight":
          seekBy(5);
          break;
        case "ArrowLeft":
          seekBy(-5);
          break;
        case "PageUp":
          seekBy(60);
          break;
        case "PageDown":
          seekBy(-60);
          break;
        case "ArrowUp":
          e.preventDefault();
          bumpVolume(0.05);
          break;
        case "ArrowDown":
          e.preventDefault();
          bumpVolume(-0.05);
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "v":
          toggleSubs();
          break;
        case "[":
          setRate(speed - 0.25);
          break;
        case "]":
          setRate(speed + 0.25);
          break;
        case "BracketLeft":
          setRate(speed - 0.25);
          break;
        case "Backspace":
          setRate(1);
          break;
        case "?":
          setShowKeys((s) => !s);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [external, toggle, seekBy, bumpVolume, toggleMute, toggleFullscreen, toggleSubs, setRate, speed]);

  if (external) {
    return (
      <div className="space-y-3">
        <div className="grid aspect-video place-items-center rounded-2xl bg-surface p-6 text-center text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">التشغيل الخارجي مفعّل</p>
            <p className="mt-2 text-sm">
              تم إرسال الرابط إلى المشغل المختار. إن لم يفتح تلقائياً استخدم الأزرار بالأسفل.
            </p>
          </div>
        </div>
        <ExternalPlayerBar src={src} title={title} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={boxRef} className="relative overflow-hidden rounded-2xl bg-black">
        <video
          ref={ref}
          playsInline
          className="aspect-video w-full bg-black"
          onClick={toggle}
          onDoubleClick={toggleFullscreen}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onError={() => setError("تعذّر تشغيل هذا المصدر.")}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setTime(v.currentTime);
            if (!live && v.duration) {
              setDuration(v.duration);
              onProgress?.(v.currentTime, v.duration);
            }
          }}
        />

        {live ? (
          <span className="pointer-events-none absolute top-3 start-3 flex items-center gap-2 rounded-md bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
            <span className="live-dot size-2 rounded-full bg-destructive-foreground" /> مباشر
          </span>
        ) : null}

        {osd ? (
          <span
            dir="ltr"
            className="pointer-events-none absolute top-3 end-3 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-bold text-white"
          >
            {osd}
          </span>
        ) : null}

        {/* شريط تحكم بنمط mpv */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8">
          {!live ? (
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(time, duration || 0)}
              onChange={(e) => {
                const v = ref.current;
                if (v) v.currentTime = Number(e.target.value);
              }}
              className="w-full accent-[var(--color-primary)]"
              aria-label="شريط التقدم"
            />
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-white">
            <button onClick={toggle} className="grid size-9 place-items-center rounded-lg bg-white/10" aria-label="تشغيل/إيقاف">
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            {!live ? (
              <>
                <button onClick={() => seekBy(-5)} className="grid size-9 place-items-center rounded-lg bg-white/10" aria-label="رجوع 5 ثوانٍ">
                  <RotateCcw className="size-4" />
                </button>
                <button onClick={() => seekBy(5)} className="grid size-9 place-items-center rounded-lg bg-white/10" aria-label="تقديم 5 ثوانٍ">
                  <RotateCw className="size-4" />
                </button>
              </>
            ) : null}
            <button onClick={toggleMute} className="grid size-9 place-items-center rounded-lg bg-white/10" aria-label="كتم">
              {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                const v = ref.current;
                const next = Number(e.target.value);
                if (v) {
                  v.volume = next;
                  v.muted = next === 0;
                  setMuted(next === 0);
                }
                setVolume(next);
              }}
              className="w-20 accent-[var(--color-primary)]"
              aria-label="مستوى الصوت"
            />
            <span dir="ltr" className="font-mono text-xs tabular-nums">
              {fmt(time)} / {live ? "live" : fmt(duration)}
            </span>
            <div className="ms-auto flex items-center gap-2">
              <button
                onClick={() => setRate(speed >= 2 ? 1 : speed + 0.25)}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs font-bold"
                aria-label="سرعة التشغيل"
              >
                <Gauge className="size-3.5" /> ×{speed}
              </button>
              <button
                onClick={toggleSubs}
                className={`grid size-9 place-items-center rounded-lg ${subs ? "bg-primary" : "bg-white/10"}`}
                aria-label="الترجمة"
              >
                <Subtitles className="size-4" />
              </button>
              <button
                onClick={() => setShowKeys((s) => !s)}
                className="grid size-9 place-items-center rounded-lg bg-white/10"
                aria-label="الاختصارات"
              >
                <Keyboard className="size-4" />
              </button>
              <button onClick={toggleFullscreen} className="grid size-9 place-items-center rounded-lg bg-white/10" aria-label="ملء الشاشة">
                {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        {showKeys ? (
          <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-white">
            <div className="max-w-md text-sm">
              <p className="mb-3 text-base font-bold">اختصارات mpv</p>
              <ul className="grid grid-cols-2 gap-2">
                <li>مسافة / p — تشغيل وإيقاف</li>
                <li>→ ← — ٥ ثوانٍ</li>
                <li>PgUp/PgDn — دقيقة</li>
                <li>↑ ↓ — الصوت</li>
                <li>m — كتم</li>
                <li>f — ملء الشاشة</li>
                <li>v — الترجمة</li>
                <li>[ ] — السرعة</li>
                <li>Backspace — سرعة عادية</li>
                <li>? — هذه القائمة</li>
              </ul>
              <button
                onClick={() => setShowKeys(false)}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                إغلاق
              </button>
            </div>
          </div>
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
      <ExternalPlayerBar src={src} title={title} />
    </div>
  );
}

function fmt(seconds: number) {
  if (!seconds || !Number.isFinite(seconds)) return "00:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
