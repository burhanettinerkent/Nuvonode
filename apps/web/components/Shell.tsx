"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { me } from "@/lib/api";
import { clearToken, getToken, type User } from "@/lib/session";
import { ErrorMessage, Loading } from "./State";

type NavItem = {
  label: string;
  href: string;
  matches?: string[];
};

const userLinks: NavItem[] = [
  { label: "Ana Sayfa", href: "/dashboard" },
  { label: "API", href: "/dashboard/api-keys", matches: ["/dashboard/projects", "/dashboard/api-keys", "/dashboard/models"] },
  { label: "Kullanım", href: "/dashboard/usage" },
  { label: "Bakiye", href: "/dashboard/credits" },
  { label: "Node'larım", href: "/dashboard/providers" },
];

const adminLinks: NavItem[] = [
  { label: "İnceleme", href: "/admin/providers", matches: ["/admin", "/admin/providers", "/admin/provider-models"] },
  { label: "Modeller", href: "/admin/models" },
  { label: "İstekler", href: "/admin/jobs", matches: ["/admin/jobs", "/admin/usage"] },
  { label: "Kredi", href: "/admin/wallets" },
  { label: "Denetim", href: "/admin/audit-log" },
];

function isActive(pathname: string, href: string, matches: string[] = []) {
  return pathname === href || matches.some((match) => pathname === match || pathname.startsWith(`${match}/`));
}

function NavLink({ label, href, matches = [], pathname }: NavItem & { pathname: string }) {
  const active = isActive(pathname, href, matches);
  return <Link className={active ? "active" : ""} href={href}>{label}</Link>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    me()
      .then((res) => setUser(res.user))
      .catch((err) => {
        setError(err);
        clearToken();
      });
  }, [router]);

  if (error) return <main className="page"><ErrorMessage error={error} /></main>;
  if (!user) return <main className="page"><Loading label="Panel hazırlanıyor..." /></main>;

  const displayName = user.display_name && user.display_name !== "User"
    ? user.display_name
    : user.email.split("@")[0];

  const mobileLinks = pathname.startsWith("/admin") && user.role === "admin" ? adminLinks : userLinks;

  return (
    <div className="shell">
      <aside className="sidebar stack">
        <div className="brand-mark">
          <div className="brand-icon" />
          <div>
            <strong>Nuvonode</strong>
            <div className="muted">Açık model API</div>
          </div>
        </div>
        <div className="nav-section">
          <div className="nav-title">Uygulama</div>
          {userLinks.map((link) => <NavLink key={link.href} pathname={pathname} {...link} />)}
        </div>
        {user.role === "admin" ? (
          <div className="nav-section">
            <div className="nav-title">Yönetim</div>
            {adminLinks.map((link) => <NavLink key={link.href} pathname={pathname} {...link} />)}
          </div>
        ) : null}
      </aside>
      <main className="main">
        <header className="header">
          <div>
            <div className="eyebrow">Oturum açık</div>
            <strong>{displayName}</strong>
            <div className="muted">{user.email}</div>
          </div>
          <div className="header-actions">
            {user.role === "admin" ? <span className="pill ok">Admin</span> : <span className="pill">Kullanıcı</span>}
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                clearToken();
                router.replace("/login");
              }}
            >
              Çıkış yap
            </button>
          </div>
        </header>
        {children}
      </main>
      <nav className="mobile-nav" aria-label="Mobil gezinme">
        {mobileLinks.map((link) => (
          <NavLink key={link.href} pathname={pathname} {...link} />
        ))}
      </nav>
    </div>
  );
}
