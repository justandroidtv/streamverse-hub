import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RequireAccount } from "@/components/require-account";
import { Catalog } from "@/components/catalog";

export const Route = createFileRoute("/series/")({
  head: () => ({
    meta: [
      { title: "المسلسلات — IPTV سمارت" },
      { name: "description", content: "تصفح المسلسلات بالمواسم والحلقات مع فلاتر التصنيف والتقييم." },
      { property: "og:title", content: "المسلسلات — IPTV سمارت" },
      { property: "og:description", content: "كل مسلسلات اشتراكك مرتبة بالمواسم والحلقات." },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAccount>
        <h1 className="mb-6 text-2xl font-black md:text-3xl">المسلسلات</h1>
        <Catalog kind="series" />
      </RequireAccount>
    </AppShell>
  ),
});
