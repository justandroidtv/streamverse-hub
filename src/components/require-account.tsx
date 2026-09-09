import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useActiveAccount } from "@/lib/account";

export function RequireAccount({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  if (!account) {
    return (
      <div className="grid place-items-center rounded-3xl border border-dashed border-border py-24 text-center">
        <div>
          <h2 className="text-2xl font-bold">لا يوجد اشتراك مضاف</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            أضف بيانات اشتراك Xtream Codes لعرض القنوات والأفلام والمسلسلات.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-xl gradient-accent px-6 py-3 font-bold text-primary-foreground"
          >
            إضافة اشتراك
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
