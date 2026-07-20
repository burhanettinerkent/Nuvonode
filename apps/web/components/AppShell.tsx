"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { me } from "@/lib/api";
import { clearToken, getToken, type User } from "@/lib/session";
import { ErrorMessage, Loading } from "./State";

type ShellMode = "dashboard" | "admin";

type NavItem = {
  label: string;
  href: string;
  matches?: string[];
  note?: string;
};

const dashboardLinks: NavItem[] = [
  { label: "Başlangıç", href: "/dashboard", note: "İlk başarı" },
  { label: "API", href: "/dashboard/api-keys", matches: ["/dashboard/projects", "/dashboard/api-keys", "/dashboard/models"], note: "Anahtar ve istek" },
  { label: "İstekler", href: "/dashboard/usage", note: "Geçmiş" },
  { label: "Bakiye", href: "/dashboard/credits", note: "Kredi" },
  { label: "Node", href: "/dashboard/providers", note: "Kurulum" },
];

const adminLinks: NavItem[] = [
  { label: "İnceleme", href: "/admin/providers", matches: ["/admin", "/admin/providers", "/admin/provider-models"], note: "Bekleyen işler" },
  { label: "Modeller", href: "/admin/models", note: "Katalog" },
  { label: "İstekler", href: "/admin/jobs", matches: ["/admin/jobs", "/admin/usage"], note: "Sinyaller" },
  { label: "Krediler", href: "/admin/wallets", note: "Düzeltme" },
  { label: "Denetim", href: "/admin/audit-log", note: "Kayıt" },
];

function isActive(pathname: string, href: string, matches: string[] = []) {
  return pathname === href || matches.some((match) => pathname === match || pathname.startsWith(`${match}/`));
}

function NavLink({ item, pathname, mobile = false }: { item: NavItem; pathname: string; mobile?: boolean }) {
  const active = isActive(pathname, item.href, item.matches);
  const className = mobile ? `app-mobile-link ${active ? "active" : ""}`.trim() : `app-nav-link ${active ? "active" : ""}`.trim();

  return (
    <Link className={className} href={item.href}>
      <span>{item.label}</span>
      {!mobile && item.note ? <small>{item.note}</small> : null}
    </Link>
  );
}

export function AppShell({ children, mode }: { children: React.ReactNode; mode: ShellMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    if (!getToken()) {
      router.replace("/login");
      return;
    }

    me()
      .then((res) => {
        if (cancelled) return;
        setUser(res.user);
        if (mode === "admin" && res.user.role !== "admin") {
          router.replace("/dashboard");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        clearToken();
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [mode, router]);

  const navItems = mode === "admin" ? adminLinks : dashboardLinks;
  const sectionLabel = mode === "admin" ? "Yönetim" : "Ürün";
  const sectionNote = mode === "admin" ? "Bekleyen işleri kapat. Sonra kayıtları kontrol et." : "Önce API. Node sonra.";

  if (error) {
    return (
      <main className="page app-loading-shell">
        <ErrorMessage error={error} hint="Oturum yenilenemedi. Tekrar giriş yapıp devam et." />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page app-loading-shell">
        <Loading label="Panel hazırlanıyor..." hint="Hesap bilgilerin yükleniyor." />
      </main>
    );
  }

  const displayName = user.display_name && user.display_name !== "User"
    ? user.display_name
    : user.email.split("@")[0];

  return (
    <div className={`app-shell ${mode}-shell`}>
      <aside className="app-sidebar desktop-only">
        <div className="app-sidebar-inner">
          <Link href={mode === "admin" ? "/admin" : "/dashboard"} className="app-brand">
            <span className="app-brand-mark">N</span>
            <span className="app-brand-copy">
              <strong>Nuvonode</strong>
              <small>{sectionNote}</small>
            </span>
          </Link>

          <div className="app-nav-section">
            <span className="app-nav-label">{sectionLabel}</span>
            <nav className="app-nav" aria-label="Ana gezinme">
              {navItems.map((item) => <NavLink key={item.href} item={item} pathname={pathname} />)}
            </nav>
          </div>
        </div>
      </aside>

      <div className="app-main-shell">
        <header className="app-topbar">
          <div className="app-topbar-inner">
            <div className="app-topbar-left">
              <Link href={mode === "admin" ? "/admin" : "/dashboard"} className="app-brand mobile-only">
                <span className="app-brand-mark">N</span>
                <span className="app-brand-copy">
                  <strong>Nuvonode</strong>
                  <small>{sectionNote}</small>
                </span>
              </Link>
              <div className="app-topbar-copy desktop-only">
                <span className="eyebrow">{sectionLabel}</span>
                <p className="muted">{sectionNote}</p>
              </div>
            </div>

            <div className="app-user-card">
              <div className="app-user-copy">
                <strong>{displayName}</strong>
                <small>{user.email}</small>
              </div>
              <span className={mode === "admin" ? "pill ok" : "pill"}>{mode === "admin" ? "Admin" : "Hesap"}</span>
              <button
                className="button secondary app-logout"
                type="button"
                onClick={() => {
                  clearToken();
                  router.replace("/login");
                }}
              >
                Çıkış yap
              </button>
            </div>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>

      <nav className="app-mobile-nav mobile-only" aria-label="Mobil gezinme">
        {navItems.map((item) => <NavLink key={item.href} item={item} pathname={pathname} mobile />)}
      </nav>
    </div>
  );
}
