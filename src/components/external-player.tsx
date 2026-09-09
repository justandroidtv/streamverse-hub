import { useState } from "react";
import { ExternalLink, Copy, Check, Terminal } from "lucide-react";
import { buildExternalUrl, buildMpvCommand, useSettings } from "@/lib/settings";

const TARGETS = [
  { id: "mpv", label: "mpv" },
  { id: "vlc", label: "VLC" },
  { id: "potplayer", label: "PotPlayer" },
] as const;

export function ExternalPlayerBar({ src, title }: { src: string; title?: string | undefined }) {
  const settings = useSettings();
  const [copied, setCopied] = useState<string | null>(null);

  if (!settings.showExternalBar) return null;

  const copy = async (value: string, tag: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(tag);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-3">
      <span className="me-1 text-xs font-semibold text-muted-foreground">فتح في مشغل خارجي:</span>
      {TARGETS.map((t) => (
        <a
          key={t.id}
          href={buildExternalUrl(t.id, src, settings)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-xs font-semibold transition hover:text-primary"
          title={title ? `${title} — ${t.label}` : t.label}
        >
          <ExternalLink className="size-3.5" /> {t.label}
        </a>
      ))}
      <button
        onClick={() => void copy(buildMpvCommand(src, settings), "cmd")}
        className="inline-flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-xs font-semibold transition hover:text-primary"
      >
        {copied === "cmd" ? <Check className="size-3.5" /> : <Terminal className="size-3.5" />}
        نسخ أمر mpv
      </button>
      <button
        onClick={() => void copy(src, "url")}
        className="inline-flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-xs font-semibold transition hover:text-primary"
      >
        {copied === "url" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        نسخ الرابط
      </button>
    </div>
  );
}
