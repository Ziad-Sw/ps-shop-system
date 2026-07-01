import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="w-full max-w-lg">
        <div className="rounded-xl bg-surface-card p-8 shadow-none">
          <p className="text-sm text-foreground-muted">نظام إدارة المحل</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            مرحبًا — الخطوة 1 جاهزة
          </h1>
          <p className="mt-4 text-foreground-muted">
            تم تجهيز المشروع وربطه بـ Supabase. الجداول تُنشأ عبر migrations،
            وصف المحل الأول يُزرع في قاعدة البيانات.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-surface-page"
            >
              تسجيل الدخول
            </Link>
            <span className="inline-flex h-11 items-center justify-center rounded-lg border border-foreground-muted/30 px-6 text-sm text-foreground-muted">
              Dark mode فقط
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
