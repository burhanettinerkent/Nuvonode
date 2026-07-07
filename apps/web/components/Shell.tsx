"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { me } from "@/lib/api";
import { clearToken, getToken, type User } from "@/lib/session";
import { ErrorMessage, Loading } from "./State";

const userLinks = [
  ["Overview", "/dashboard"],
  ["Projects", "/dashboard/projects"],
  ["API Keys", "/dashboard/api-keys"],
  ["Models", "/dashboard/models"],
  ["Credits", "/dashboard/credits"],
  ["Usage", "/dashboard/usage"],
  ["Providers", "/dashboard/providers"],
];

const adminLinks = [
  ["Overview", "/admin"],
  ["Providers", "/admin/providers"],
  ["Provider Models", "/admin/provider-models"],
  ["Models", "/admin/models"],
  ["Jobs", "/admin/jobs"],
  ["Usage", "/admin/usage"],
  ["Wallets", "/admin/wallets"],
  ["Audit Log", "/admin/audit-log"],
];

function NavLink({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return <Link className={active ? "active" : ""} href={href}>{label}</Link>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
  if (!user) return <main className="page"><Loading label="Loading dashboard..." /></main>;

  return (
    <div className="shell">
      <aside className="sidebar stack">
        <div className="brand-mark">
          <div className="brand-icon" />
          <div>
            <strong>Nuvonode Mesh</strong>
            <div className="muted">Inference control plane</div>
          </div>
        </div>
        <div className="nav-section">
          <div className="nav-title">Workspace</div>
          {userLinks.map(([label, href]) => <NavLink key={href} label={label} href={href} />)}
        </div>
        {user.role === "admin" ? (
          <div className="nav-section">
            <div className="nav-title">Admin operations</div>
            {adminLinks.map(([label, href]) => <NavLink key={href} label={label} href={href} />)}
          </div>
        ) : null}
      </aside>
      <main className="main">
        <header className="header">
          <div>
            <div className="eyebrow">Signed in</div>
            <strong>{user.display_name}</strong>
            <div className="muted">{user.email}</div>
          </div>
          <div className="header-actions">
            {user.role === "admin" ? <span className="pill ok">Admin</span> : <span className="pill">User</span>}
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                clearToken();
                router.replace("/login");
              }}
            >
              Logout
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
