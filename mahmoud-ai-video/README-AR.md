# MAHMOUD AI — منصة إنشاء الفيديو الخاصة

المستودع عام، لكن الموقع نفسه غير منشور. هذه نسخة تطويرية؛ تشغيل جميع مراحل التوليد يتطلب إعداد الخدمات المذكورة أدناه.

## ما تم توصيله في الكود
- تسجيل دخول Supabase ومشاريع مع عزل المستخدمين عبر RLS.
- عند إنشاء مشروع من لوحة التحكم يبدأ توليد السيناريو تلقائيًا عبر LLM API.
- توليد صور المشاهد وحفظها في bucket خاص.
- توليد تعليق صوتي MP3 لكل مشهد.
- تحريك صور المشاهد إلى مقاطع MP4 عبر Runway Dev مع متابعة حالة المهمة.
- معاينة الصور والصوت والفيديو بروابط مؤقتة.
- عامل FFmpeg مستقل لتجميع مقاطع الفيديو والتعليق الصوتي في MP4 نهائي.
- API يستدعي العامل ويحفظ الناتج النهائي في Supabase Storage.

## ما يحتاج إعدادًا خارجيًا قبل التشغيل
1. مشروع Supabase وتشغيل `supabase/schema.sql`.
2. تشغيل `supabase/media-storage.sql` في SQL Editor لإنشاء bucket خاص وسياسات الملفات.
3. إضافة مفاتيح الخادم في `.env.local` أو إعدادات الاستضافة: `LLM_API_KEY`, `IMAGE_PROVIDER_API_KEY` (أو `OPENAI_API_KEY`), `TTS_API_KEY` (أو `OPENAI_API_KEY`), و`RUNWAYML_API_SECRET`.
4. تشغيل عامل FFmpeg بشكل منفصل باستخدام `render-worker/Dockerfile`، ثم ضبط `RENDER_WORKER_URL` و`RENDER_WORKER_TOKEN` في خادم Next.js. استخدم رمزًا عشوائيًا قويًا واحفظه في الطرفين فقط.
5. إعداد حساب المسؤول وتعطيل التسجيل العام في Supabase Auth.

## التشغيل المحلي
- Node.js 20 أو أحدث.
- انسخ `.env.example` إلى `.env.local` وأدخل القيم المطلوبة.
- شغّل `supabase/schema.sql` ثم `supabase/media-storage.sql`.
- شغّل `npm install` ثم `npm run dev` من مجلد المشروع.
- لتشغيل عامل الرندر: من مجلد `render-worker` ابنِ الصورة بـ `docker build -t mahmoud-ai-render .` ثم شغّلها مع `RENDER_WORKER_TOKEN` وفتح المنفذ 8080. اضبط `RENDER_WORKER_URL` على عنوان الخادم الداخلي/الخاص المناسب.

## API
- `POST /api/projects/:id/generate-script`
- `POST /api/projects/:id/generate-images`
- `POST /api/projects/:id/generate-voice` مع `{ "sceneIndex": 0 }`
- `POST /api/projects/:id/generate-video` مع `{ "sceneIndex": 0 }` ثم `GET /api/projects/:id/generate-video?sceneIndex=0` لمتابعة المهمة
- `POST /api/projects/:id/media-url` مع مسار الملف لإصدار رابط مؤقت
- `POST /api/projects/:id/render` لتجميع كل المشاهد والصوت في MP4

## حدود معروفة
- التكامل مع مزودي الذكاء الاصطناعي لا يمكن اختباره دون مفاتيح صالحة ورصيد في الحسابات.
- عامل FFmpeg خدمة منفصلة يجب استضافتها؛ لم يتم نشرها أو تشغيلها من هذا المستودع.
- الرندر الحالي طلب متزامن؛ فيديوهات طويلة جدًا قد تتجاوز مهلة خادم الويب، ويجب حينها تحويله إلى طابور مهام دائم.
- لا يوجد نشر تلقائي للموقع.
- لا تضع مفاتيح الخدمات أو `SUPABASE_SERVICE_ROLE_KEY` في متغيرات `NEXT_PUBLIC_` أو في GitHub.
