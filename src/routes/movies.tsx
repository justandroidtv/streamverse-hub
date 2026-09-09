import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RequireAccount } from "@/components/require-account";
import { Catalog } from "@/components/catalog";

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "الأفلام — IPTV سمارت" },
      { name: "description", content: "تصفح مكتبة الأفلام حسب التصنيف والتقييم والأحدث." },
      { property: "og:title", content: "الأفلام — IPTV سمارت" },
      { property: "og:description", content: "مكتبة أفلام كاملة من اشتراكك مع فلاتر وبحث فوري." },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireAccount>
        <h1 className="mb-6 text-2xl font-black md:text-3xl">الأفلام</h1>
        <Catalog kind="movie" />
      </RequireAccount>
    </AppShell>
  ),
});
