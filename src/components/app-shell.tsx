import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Search, Settings, Tv, Film, Clapperboard, Home, Heart } from "lucide-react";
import { useActiveAccount } from "@/lib/account";
import { useSettings } from "@/lib/settings";

const NAV = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/live", label: "البث المباشر", icon: Tv },
  { to: "/movies", label: "أفلام", icon: Film },
  { to: "/series", label: "مسلسلات", icon: Clapperboard },
  { to: "/favorites", label: "المفضلة", icon: Heart },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { theme, fontSize } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.dataset["fs"] = fontSize;
  }, [theme, fontSize]);


  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-elevated/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 md:px-10">
          <Link to="/" className="flex items-center gap-2 text-lg font-black">
            <span className="grid size-9 place-items-center rounded-xl gradient-accent text-primary-foreground">
              <Tv className="size-5" />
            </span>
            IPTV
          </Link>

          <nav className="no-scrollbar order-3 -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:mx-0 md:w-auto">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <form
            className="relative ms-auto w-full max-w-xs"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) navigate({ to: "/search", search: { q: q.trim() } });
            }}
          >
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن فيلم أو مسلسل أو قناة"
              className="w-full rounded-xl border border-input bg-surface py-2 ps-9 pe-3 text-sm outline-none transition focus:border-primary"
            />
          </form>

          <Link
            to="/settings"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-muted-foreground transition hover:text-foreground"
            title={account ? account.name : "الإعدادات"}
          >
            <Settings className="size-5" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 pb-20 pt-6 md:px-10">{children}</main>
    </div>
  );
}
