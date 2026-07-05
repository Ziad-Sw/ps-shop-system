"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface AuthenticatedUser {
  login_id: string;
  display_name: string | null;
}

interface AuthenticatedShellProps {
  user: AuthenticatedUser | null;
  shopName: string;
  children: React.ReactNode;
}

export default function AuthenticatedShell({
  user,
  shopName,
  children,
}: AuthenticatedShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.display_name || user?.login_id || "المستخدم";
  const userLabel = user?.login_id ? `معرّف: ${user.login_id}` : "مستخدم مسجّل الدخول";

  return (
    <div className="min-h-screen bg-surface-page text-foreground">
      <header className="sticky top-0 z-20 border-b border-foreground-muted/10 bg-surface-page/95 backdrop-blur supports-[backdrop-filter]:bg-surface-page/80">
        <div className="mx-auto flex min-h-[64px] max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold text-foreground">PS-System</div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg border border-foreground-muted/20 bg-surface-card px-3 py-2 text-sm text-foreground transition-colors duration-150 hover:border-primary/50 hover:bg-surface-card/90 focus:outline-none focus:ring-2 focus:ring-primary/60"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              <span className="hidden sm:inline text-right">{shopName}</span>
              <span className="text-primary">▾</span>
            </button>

            {isMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 min-w-[240px] rounded-xl border border-foreground-muted/20 bg-surface-card p-2 shadow-xl"
              >
                <div className="rounded-lg px-3 py-3 text-right">
                  <p className="font-semibold text-foreground">{displayName}</p>
                  <p className="mt-1 text-sm text-foreground-muted">{userLabel}</p>
                </div>

                <div className="mt-1 flex flex-col gap-1">
                  <Link
                    href="/settings"
                    className="flex min-h-[44px] items-center justify-end rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    الإعدادات
                  </Link>

                  <form action="/api/auth/logout" method="post">
                    <button
                      type="submit"
                      className="flex min-h-[44px] w-full items-center justify-end rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/10"
                    >
                      تسجيل الخروج
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
