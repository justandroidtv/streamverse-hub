import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Trash2, Download, Upload, RotateCcw, Play } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { removeAccount, setActiveAccount, useAccounts } from "@/lib/account";
import { clearHistory, useHistory, useFavorites } from "@/lib/history";
import {
  DEFAULTS,
  resetSettings,
  updateSettings,
  useSettings,
  buildMpvCommand,
  type Settings,
} from "@/lib/settings";
import { xtreamCall } from "@/lib/xtream.functions";
import { useActiveAccount } from "@/lib/account";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — IPTV سمارت" },
      {
        name: "description",
        content: "تحكم كامل بالمشغل الداخلي و mpv والشبكة والواجهة وأدوات المطور.",
      },
      { property: "og:title", content: "الإعدادات — IPTV سمارت" },
      { property: "og:description", content: "إعدادات شاملة للتشغيل والمشغلات الخارجية والمطور." },
    ],
  }),
  component: SettingsPage,
});

const TABS = [
  { id: "accounts", label: "الاشتراكات" },
  { id: "playback", label: "التشغيل" },
  { id: "external", label: "المشغلات الخارجية" },
  { id: "network", label: "الشبكة" },
  { id: "interface", label: "الواجهة" },
  { id: "data", label: "البيانات" },
  { id: "developer", label: "المطور" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 rounded-xl bg-surface p-4">
      <span className="block text-sm font-semibold">{label}</span>
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center gap-3 rounded-xl bg-surface p-4 text-start"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${value ? "bg-primary" : "bg-background"}`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-foreground transition-all ${value ? "start-6" : "start-1"}`}
        />
      </span>
    </button>
  );
}

function SettingsPage() {
  const [tab, setTab] = useState<TabId>("accounts");

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-black md:text-3xl">الإعدادات</h1>
      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? "gradient-accent text-primary-foreground" : "bg-surface text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "accounts" ? <AccountsTab /> : null}
      {tab === "playback" ? <PlaybackTab /> : null}
      {tab === "external" ? <ExternalTab /> : null}
      {tab === "network" ? <NetworkTab /> : null}
      {tab === "interface" ? <InterfaceTab /> : null}
      {tab === "data" ? <DataTab /> : null}
      {tab === "developer" ? <DeveloperTab /> : null}
    </AppShell>
  );
}

function AccountsTab() {
  const { accounts, activeId } = useAccounts();
  return (
    <section className="space-y-3">
      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد اشتراكات مضافة.</p>
      ) : (
        accounts.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl bg-surface p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{a.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {a.server} · {a.username}
              </p>
            </div>
            {a.id === activeId ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                <Check className="size-3" /> نشط
              </span>
            ) : (
              <button
                onClick={() => setActiveAccount(a.id)}
                className="rounded-lg bg-background px-3 py-1.5 text-xs font-semibold"
              >
                تفعيل
              </button>
            )}
            <button
              onClick={() => removeAccount(a.id)}
              className="grid size-9 place-items-center rounded-lg bg-background text-destructive"
              aria-label="حذف"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))
      )}
      <Link
        to="/login"
        className="inline-block rounded-xl gradient-accent px-5 py-3 font-bold text-primary-foreground"
      >
        إضافة اشتراك جديد
      </Link>
    </section>
  );
}

function PlaybackTab() {
  const s = useSettings();
  return (
    <section className="grid gap-3 md:grid-cols-2">
      <Field label="محرك التشغيل الافتراضي" hint="اختر المشغل الذي يفتح عند الضغط على تشغيل.">
        <select
          className={inputCls}
          value={s.engine}
          onChange={(e) => updateSettings({ engine: e.target.value as Settings["engine"] })}
        >
          <option value="internal">المشغل الداخلي (المتصفح)</option>
          <option value="mpv">mpv</option>
          <option value="vlc">VLC</option>
          <option value="potplayer">PotPlayer</option>
        </select>
      </Field>
      <Field label="صيغة البث المباشر">
        <select
          className={inputCls}
          value={s.preferredStreamFormat}
          onChange={(e) =>
            updateSettings({ preferredStreamFormat: e.target.value as Settings["preferredStreamFormat"] })
          }
        >
          <option value="m3u8">HLS (m3u8)</option>
          <option value="ts">MPEG-TS (ts) — أفضل مع mpv</option>
        </select>
      </Field>
      <Field label="صيغة الأفلام والحلقات">
        <select
          className={inputCls}
          value={s.preferredVodExt}
          onChange={(e) => updateSettings({ preferredVodExt: e.target.value as Settings["preferredVodExt"] })}
        >
          <option value="auto">تلقائي (حسب الخادم)</option>
          <option value="mp4">mp4</option>
          <option value="mkv">mkv</option>
        </select>
      </Field>
      <Field label={`مستوى الصوت الافتراضي: ${s.defaultVolume}%`}>
        <input
          type="range"
          min={0}
          max={100}
          value={s.defaultVolume}
          onChange={(e) => updateSettings({ defaultVolume: Number(e.target.value) })}
          className="w-full accent-[var(--color-primary)]"
        />
      </Field>
      <Toggle
        label="التشغيل التلقائي"
        value={s.autoplay}
        onChange={(v) => updateSettings({ autoplay: v })}
      />
      <Toggle
        label="بدء التشغيل صامتاً"
        value={s.muteOnStart}
        onChange={(v) => updateSettings({ muteOnStart: v })}
      />
      <Toggle
        label="استئناف من آخر موضع"
        hint="يتابع الفيلم أو الحلقة من حيث توقفت."
        value={s.resumePlayback}
        onChange={(v) => updateSettings({ resumePlayback: v })}
      />
      <Field label={`حجم الذاكرة المؤقتة للبث: ${s.hlsMaxBufferLength} ثانية`}>
        <input
          type="range"
          min={5}
          max={120}
          step={5}
          value={s.hlsMaxBufferLength}
          onChange={(e) => updateSettings({ hlsMaxBufferLength: Number(e.target.value) })}
          className="w-full accent-[var(--color-primary)]"
        />
      </Field>
      <Field label="جودة البدء" hint="-1 يعني اختيار تلقائي حسب سرعة الاتصال.">
        <input
          type="number"
          min={-1}
          max={10}
          className={inputCls}
          value={s.hlsStartLevel}
          onChange={(e) => updateSettings({ hlsStartLevel: Number(e.target.value) })}
        />
      </Field>
      <Toggle
        label="وضع زمن التأخير المنخفض"
        value={s.hlsLowLatency}
        onChange={(v) => updateSettings({ hlsLowLatency: v })}
      />
      <Toggle
        label="فك الترميز في خيط منفصل"
        hint="يحسّن الأداء على الأجهزة الضعيفة."
        value={s.hlsWorker}
        onChange={(v) => updateSettings({ hlsWorker: v })}
      />
    </section>
  );
}

function ExternalTab() {
  const s = useSettings();
  const sample = "http://example.com/live/user/pass/1234.m3u8";
  return (
    <section className="grid gap-3 md:grid-cols-2">
      <Field
        label="صيغة رابط mpv"
        hint="المتغيرات المدعومة: {url} و {url_enc} و {url_b64} و {args}."
      >
        <input
          className={inputCls}
          value={s.mpvScheme}
          onChange={(e) => updateSettings({ mpvScheme: e.target.value })}
          dir="ltr"
        />
      </Field>
      <Field label="خيارات mpv" hint="تُستخدم في الأمر الجاهز للنسخ وفي المتغير {args}.">
        <input
          className={inputCls}
          value={s.mpvArgs}
          onChange={(e) => updateSettings({ mpvArgs: e.target.value })}
          dir="ltr"
        />
      </Field>
      <Field label="User-Agent للمشغل الخارجي">
        <input
          className={inputCls}
          value={s.externalUserAgent}
          onChange={(e) => updateSettings({ externalUserAgent: e.target.value })}
          dir="ltr"
        />
      </Field>
      <Field label="Referer (اختياري)">
        <input
          className={inputCls}
          value={s.externalReferer}
          onChange={(e) => updateSettings({ externalReferer: e.target.value })}
          dir="ltr"
        />
      </Field>
      <Toggle
        label="إظهار شريط المشغلات الخارجية"
        hint="أزرار mpv و VLC ونسخ الرابط أسفل المشغل."
        value={s.showExternalBar}
        onChange={(v) => updateSettings({ showExternalBar: v })}
      />
      <div className="rounded-xl bg-surface p-4 md:col-span-2">
        <p className="text-sm font-semibold">معاينة الأمر</p>
        <code dir="ltr" className="mt-2 block overflow-x-auto rounded-lg bg-background p-3 text-xs">
          {buildMpvCommand(sample, s)}
        </code>
        <p className="mt-2 text-xs text-muted-foreground">
          لفتح روابط mpv من المتصفح مباشرة يلزم تسجيل بروتوكول mpv:// على جهازك؛ وإلا انسخ الأمر أعلاه.
        </p>
      </div>
    </section>
  );
}

function NetworkTab() {
  const s = useSettings();
  return (
    <section className="grid gap-3 md:grid-cols-2">
      <Field label="مهلة الطلب (ميلي ثانية)">
        <input
          type="number"
          min={2000}
          step={1000}
          className={inputCls}
          value={s.requestTimeout}
          onChange={(e) => updateSettings({ requestTimeout: Number(e.target.value) })}
        />
      </Field>
      <Field label="عدد إعادة المحاولات">
        <input
          type="number"
          min={0}
          max={10}
          className={inputCls}
          value={s.retryCount}
          onChange={(e) => updateSettings({ retryCount: Number(e.target.value) })}
        />
      </Field>
      <Toggle
        label="تمرير الطلبات عبر الخادم"
        hint="يتجاوز حظر CORS ويخفي بيانات الاشتراك عن المتصفح."
        value={s.proxyThroughServer}
        onChange={(v) => updateSettings({ proxyThroughServer: v })}
      />
    </section>
  );
}

function InterfaceTab() {
  const s = useSettings();
  return (
    <section className="grid gap-3 md:grid-cols-2">
      <Field label="كثافة العرض">
        <select
          className={inputCls}
          value={s.density}
          onChange={(e) => updateSettings({ density: e.target.value as Settings["density"] })}
        >
          <option value="comfortable">مريحة</option>
          <option value="compact">مضغوطة</option>
        </select>
      </Field>
      <Field label={`عدد البطاقات في الصف: ${s.gridSize}`}>
        <input
          type="range"
          min={2}
          max={10}
          value={s.gridSize}
          onChange={(e) => updateSettings({ gridSize: Number(e.target.value) })}
          className="w-full accent-[var(--color-primary)]"
        />
      </Field>
      <Field label="عدد العناصر في الصفحة">
        <input
          type="number"
          min={20}
          max={500}
          step={20}
          className={inputCls}
          value={s.pageSize}
          onChange={(e) => updateSettings({ pageSize: Number(e.target.value) })}
        />
      </Field>
      <Toggle
        label="إظهار التقييمات"
        value={s.showRatings}
        onChange={(v) => updateSettings({ showRatings: v })}
      />
      <Toggle
        label="إظهار تصنيفات الكبار"
        value={s.showAdultCategories}
        onChange={(v) => updateSettings({ showAdultCategories: v })}
      />
    </section>
  );
}

function DataTab() {
  const history = useHistory();
  const favorites = useFavorites();
  const { accounts } = useAccounts();
  const s = useSettings();
  const [msg, setMsg] = useState("");

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ accounts, settings: s, history, favorites }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "iptv-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importAll = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Record<string, unknown>;
      if (data["accounts"]) localStorage.setItem("iptv.accounts.v1", JSON.stringify({ accounts: data["accounts"], activeId: (data["accounts"] as { id: string }[])[0]?.id ?? null }));
      if (data["settings"]) localStorage.setItem("iptv.settings.v1", JSON.stringify(data["settings"]));
      if (data["history"]) localStorage.setItem("iptv.history.v1", JSON.stringify(data["history"]));
      if (data["favorites"]) localStorage.setItem("iptv.favorites.v1", JSON.stringify(data["favorites"]));
      setMsg("تم الاستيراد. سيتم تحديث الصفحة…");
      window.setTimeout(() => window.location.reload(), 800);
    } catch {
      setMsg("الملف غير صالح.");
    }
  };

  return (
    <section className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-surface p-4">
          <p className="text-2xl font-black">{accounts.length}</p>
          <p className="text-xs text-muted-foreground">اشتراك</p>
        </div>
        <div className="rounded-xl bg-surface p-4">
          <p className="text-2xl font-black">{history.length}</p>
          <p className="text-xs text-muted-foreground">عنصر في السجل</p>
        </div>
        <div className="rounded-xl bg-surface p-4">
          <p className="text-2xl font-black">{favorites.length}</p>
          <p className="text-xs text-muted-foreground">مفضلة</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={exportAll}
          className="inline-flex items-center gap-2 rounded-xl bg-surface px-5 py-3 text-sm font-semibold"
        >
          <Download className="size-4" /> تصدير نسخة احتياطية
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-surface px-5 py-3 text-sm font-semibold">
          <Upload className="size-4" /> استيراد
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importAll(f);
            }}
          />
        </label>
        <button
          onClick={() => clearHistory()}
          className="rounded-xl bg-surface px-5 py-3 text-sm font-semibold text-destructive"
        >
          مسح سجل المشاهدة
        </button>
        <button
          onClick={() => resetSettings()}
          className="inline-flex items-center gap-2 rounded-xl bg-surface px-5 py-3 text-sm font-semibold"
        >
          <RotateCcw className="size-4" /> استعادة الإعدادات الافتراضية
        </button>
      </div>
      {msg ? <p className="text-sm text-primary">{msg}</p> : null}
      <p className="text-xs text-muted-foreground">
        كل البيانات محفوظة على هذا الجهاز فقط ({Object.keys(DEFAULTS).length} خيار قابل للتخصيص).
      </p>
    </section>
  );
}

function DeveloperTab() {
  const s = useSettings();
  const account = useActiveAccount();
  const call = useServerFn(xtreamCall);
  const [action, setAction] = useState("get_live_categories");
  const [extra, setExtra] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!account) {
      setOut("لا يوجد اشتراك نشط.");
      return;
    }
    setBusy(true);
    try {
      const params: Record<string, string> = { action };
      for (const pair of extra.split("&").filter(Boolean)) {
        const [k, v] = pair.split("=");
        if (k) params[k] = v ?? "";
      }
      const res = await call({
        data: {
          creds: { server: account.server, username: account.username, password: account.password },
          params,
        },
      });
      setOut(JSON.stringify(res, null, 2).slice(0, 20000));
    } catch (e) {
      setOut(`خطأ: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3">
      <Toggle
        label="وضع المطور"
        hint="يعرض تفاصيل تقنية إضافية داخل التطبيق."
        value={s.devMode}
        onChange={(v) => updateSettings({ devMode: v })}
      />
      <Toggle
        label="تسجيل الطلبات في وحدة التحكم"
        value={s.logRequests}
        onChange={(v) => updateSettings({ logRequests: v })}
      />

      <div className="rounded-xl bg-surface p-4">
        <p className="mb-3 text-sm font-semibold">وحدة اختبار Xtream API</p>
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <select className={inputCls} value={action} onChange={(e) => setAction(e.target.value)}>
            {[
              "get_live_categories",
              "get_live_streams",
              "get_vod_categories",
              "get_vod_streams",
              "get_vod_info",
              "get_series_categories",
              "get_series",
              "get_series_info",
              "get_short_epg",
              "get_simple_data_table",
            ].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            dir="ltr"
            placeholder="category_id=5&vod_id=12"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
          <button
            onClick={() => void run()}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg gradient-accent px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Play className="size-4" /> {busy ? "…" : "تنفيذ"}
          </button>
        </div>
        {out ? (
          <pre
            dir="ltr"
            className="mt-3 max-h-96 overflow-auto rounded-lg bg-background p-3 text-xs leading-relaxed"
          >
            {out}
          </pre>
        ) : null}
      </div>

      {account ? (
        <div className="rounded-xl bg-surface p-4 text-xs" dir="ltr">
          <p className="mb-2 font-semibold" dir="rtl">
            نقاط النهاية للحساب النشط
          </p>
          <p className="break-all text-muted-foreground">
            {account.server}/player_api.php?username={account.username}&password=***
          </p>
          <p className="break-all text-muted-foreground">
            {account.server}/get.php?username={account.username}&password=***&type=m3u_plus
          </p>
        </div>
      ) : null}
    </section>
  );
}
