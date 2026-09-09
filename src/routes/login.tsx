import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Tv, Loader2 } from "lucide-react";
import { xtreamLogin } from "@/lib/xtream.functions";
import { addAccount } from "@/lib/account";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — IPTV Smart Player" },
      { name: "description", content: "أدخل بيانات اشتراك Xtream Codes لتشغيل القنوات والأفلام والمسلسلات." },
      { property: "og:title", content: "تسجيل الدخول — IPTV Smart Player" },
      { property: "og:description", content: "أدخل بيانات اشتراك Xtream Codes لبدء المشاهدة." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", server: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const creds = {
        server: form.server,
        username: form.username,
        password: form.password,
      };
      await xtreamLogin({ data: { creds } });
      addAccount({ ...creds, name: form.name.trim() || form.username });
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl gradient-accent text-primary-foreground">
            <Tv className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-black">IPTV Smart Player</h1>
            <p className="text-sm text-muted-foreground">سجّل الدخول ببيانات اشتراكك</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="اسم الاشتراك (اختياري)" value={form.name} onChange={set("name")} placeholder="اشتراكي" />
          <Field
            label="رابط الخادم"
            value={form.server}
            onChange={set("server")}
            placeholder="http://example.com:8080"
            required
          />
          <Field label="اسم المستخدم" value={form.username} onChange={set("username")} required />
          <Field
            label="كلمة المرور"
            value={form.password}
            onChange={set("password")}
            type="password"
            required
          />

          {error ? (
            <p className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl gradient-accent py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            دخول
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          تُحفظ بيانات الاشتراك على جهازك فقط، ويتم الاتصال بالخادم عبر خادم التطبيق.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted-foreground">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
      />
    </label>
  );
}
