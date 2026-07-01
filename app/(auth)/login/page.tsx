export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-xl bg-surface-card p-8">
        <h1 className="text-xl font-semibold text-foreground">تسجيل الدخول</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          صفحة الدخول بالمعرّف — ستُفعَّل في خطوة لاحقة.
        </p>
        <div className="mt-6 rounded-lg border border-foreground-muted/30 px-4 py-3 text-sm text-foreground-muted">
          Placeholder — لا يوجد تسجيل دخول فعلي بعد.
        </div>
      </div>
    </div>
  );
}
