# PROGRESS — PS Shop System

آخر تحديث: 2026-07-04

## ما تم بناؤه (الخطوة 1)

### مشروع Next.js
- مشروع `ps-shop-system` على Next.js 16 + React 19 + TypeScript + Tailwind CSS v4.
- هيكل المجلدات الأساسي: `app/`, `components/`, `lib/`, `types/`, `supabase/migrations/`.
- صفحة رئيسية placeholder + صفحة `/login` placeholder (بدون auth فعلي بعد).
- واجهة RTL بالعربية، Dark mode فقط.

### Design System (Tailwind tokens)
- الألوان معرّفة في `tailwind.config.ts` (ليست hex مكررة في المكوّنات):
  - `surface.page` → `#1A1C23`
  - `surface.card` → `#252830`
  - `primary` → `#00AEFF` (solid فقط — لا gradients)
  - `foreground` → `#FFFFFF`
  - `foreground.muted` → `#A0A3AC`
- لا يوجد وضع فاتح ولا `prefers-color-scheme`.

### Supabase
- `lib/supabase/client.ts` — عميل المتصفح (`@supabase/ssr`).
- `lib/supabase/server.ts` — عميل السيرفر (cookies).
- `lib/supabase/admin.ts` — عميل service role للعمليات الإدارية.
- `.env.local.example` — قالب متغيرات البيئة.

### قاعدة البيانات
- Migration: `supabase/migrations/001_initial_schema.sql`
- الجداول: `shops`, `users`, `stations`, `pricing_rules`, `shifts`, `sessions`, `products`, `sale_items`, `expenses`.
- كل جدول (ما عدا `shops`) يحمل `shop_id`.
- `start_time` / `end_time` / `opened_at` / `closed_at` من نوع `TIMESTAMPTZ` (مصدر الحقيقة = السيرفر/DB).
- Seed: صف واحد في `shops` باسم «محل البلايستيشن».
- RLS مفعّل بسياسات MVP مفتوحة مؤقتًا (تُشدَّد عند تنفيذ Auth).

### الأنواع
- `types/database.ts` — تعريفات TypeScript لكل الجداول والـ enums.

---

## قرارات برمجية

| القرار | السبب |
|---|---|
| Tailwind v4 + `@config` يشير إلى `tailwind.config.ts` | احترام طلب تعريف tokens في config وليس داخل كل component |
| `login_id` في جدول `users` بدون كلمة سر في الـ schema | توافق BRD (دخول بالمعرّف) — آلية Auth الفعلية تُحسم قبل خطوة الفريق |
| `permissions` كـ JSONB | مرونة لصلاحيات Staff دون جداول إضافية |
| `pricing_rules` على مستوى `station_type` + `mode` | يغطي تسعير PS (ساعة) وبلياردو (جيم) فردي/مالتي |
| RLS policies مفتوحة مؤقتًا | يسمح بالتطوير قبل Auth؛ يُستبدل بسياسات shop-scoped |
| لا seed لـ `users` في هذه الخطوة | المطلوب كان صف واحد فقط في `shops` |

---

## كيفية التجربة محليًا

1. انسخ `.env.local.example` إلى `.env.local` واملأ مفاتيح Supabase.
2. نفّذ migration على مشروع Supabase:
   - عبر Supabase CLI: `supabase db push`
   - أو الصق محتوى `001_initial_schema.sql` في SQL Editor.
3. `npm install` ثم `npm run dev`.
4. افتح `http://localhost:3000` — يجب أن ترى الواجهة الداكنة مع card ترحيب.

---

## الخطوة التالية (بانتظار الموافقة)

**الخطوة 2 — صفحة الإعدادات:** الأسعار، المكوّنات (PS/بلياردو)، المشروبات، عدد الورديات اليومية.

ملفات متوقعة: `app/settings/`, `app/api/products/`, `app/api/stations/`, `components/settings/`.

**ملاحظة:** تحتاج login Owner minimal أو bypass مؤقت للاختبار — يُناقش قبل البدء.

---

## ميزة تسجيل الدخول الحقيقي — مرحلة أ: القرار المعماري

تم اعتماد أن النظام لا يستخدم Supabase Auth التقليدي في تسجيل الدخول، لأن متطلب الـ MVP هو الدخول بـ `login_id` فقط بدون كلمة سر وبدون تدفق بريد/كلمة مرور.

القرار المعماري:
- إنشاء Session مخصصة داخل تطبيق Next.js.
- تمثيل الـ Session بكوكي موقّع `HttpOnly` يحمل الحد الأدنى من بيانات المستخدم:
  - `user_id`
  - `shop_id`
  - `role`
- الكوكي يجب أن يكون `HttpOnly` حتى لا يقرأه JavaScript من المتصفح، و`SameSite=Lax`، و`Secure` في بيئة الإنتاج.
- التوقيع يتم بسيرفر سيكرت من متغير بيئة خاص، حتى لا يمكن تزوير محتوى الكوكي من العميل.
- التحقق من الصلاحيات سيكون داخل API Routes والـ server-side code بناءً على محتوى الـ Session بعد التحقق من توقيعه.
- لا نعتمد على RLS مباشرة كآلية الصلاحيات الأساسية في هذه المرحلة، لأن الدخول ليس مبنيًا على مستخدم Supabase Auth. تبقى RLS الحالية مؤقتة كما هي، ويتم تضييقها لاحقًا عندما تتضح استراتيجية الأمان النهائية.

بيانات تجربة:
- يوجد مستخدم Owner تجريبي في جدول `users` بقيمة `login_id = OWNER1`.

الخطوة التالية بعد موافقة المستخدم:
- مرحلة ب: إنشاء `POST /api/auth/login` ليستقبل `login_id`، يبحث في جدول `users`، وعند التطابق ينشئ كوكي الـ Session الموقّع.
