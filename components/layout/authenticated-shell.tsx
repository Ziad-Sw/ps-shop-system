"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/toast";

interface AuthenticatedUser {
  login_id: string;
  display_name: string | null;
}

interface AuthenticatedShellProps {
  user: AuthenticatedUser | null;
  shopName: string;
  ownerName: string | null;
  children: React.ReactNode;
}

function AuthenticatedShellContent({
  user,
  shopName,
  ownerName,
  children,
}: AuthenticatedShellProps) {
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setIsMenuOpen(false);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    showToast("warning", "جاري تسجيل الخروج...");
    
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      showToast("error", "حدث خطأ أثناء تسجيل الخروج");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
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

  const displayName = ownerName || "صاحب المحل";
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
                        onClick={handleLogoutClick}
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

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface-card rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-foreground-muted/20">
              <h3 className="text-lg font-semibold text-foreground mb-2">تأكيد تسجيل الخروج</h3>
              <p className="text-sm text-foreground-muted mb-6">
                هل أنت متأكد من تسجيل الخروج؟ مع تسجيل الخروج سيتم نقلك إلى صفحة تسجيل الدخول.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleLogoutCancel}
                  className="flex-1 min-h-[44px] rounded-lg border border-foreground-muted/20 bg-surface-page px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-card"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 min-h-[44px] rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}

export default function AuthenticatedShell(props: AuthenticatedShellProps) {
  return (
    <ToastProvider>
      <AuthenticatedShellContent {...props} />
    </ToastProvider>
  );
}
