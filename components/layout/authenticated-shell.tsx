"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ToastProvider } from "@/components/ui/toast";

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

  const handleLogout = () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      window.location.href = "/api/auth/logout";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.display_name || "صاحب المحل";
  const shopLabel = shopName;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-page text-foreground">
        <header className="sticky top-0 z-20 border-b border-foreground-muted/10 bg-surface-page/95 backdrop-blur supports-[backdrop-filter]:bg-surface-page/80">
          <div className="mx-auto flex min-h-[64px] max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-foreground-muted/20 bg-surface-card px-3 py-2 text-foreground transition-colors duration-150 hover:border-primary/50 hover:bg-surface-card/90 focus:outline-none focus:ring-2 focus:ring-primary/60"
                title="الرئيسية"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </Link>

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
                      <p className="mt-1 text-sm text-foreground-muted">{shopLabel}</p>
                    </div>

                    <div className="mt-1 flex flex-col gap-1 text-right">
                      <Link
                        href="/settings"
                        className="min-h-[44px] rounded-lg px-3 py-3 text-sm text-foreground transition-colors hover:bg-primary/10"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        الإعدادات
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="min-h-[44px] w-full rounded-lg px-3 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="text-lg font-semibold text-foreground">PS-System</div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
