export default function Home() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#080d18] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="text-2xl font-black tracking-tight">MAHMOUD <span className="text-violet-400">AI</span></div>
          <span className="rounded-full border border-emerald-400/30 px-3 py-1 text-xs text-emerald-300">موقع عام · بدون كلمة مرور</span>
        </header>
        <section className="flex flex-1 flex-col justify-center py-20">
          <p className="mb-5 text-sm font-semibold text-violet-300">استوديو صناعة الفيديو بالذكاء الاصطناعي</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">حوّل فكرتك إلى مشروع فيديو من مكان واحد</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">اكتب فكرتك وحدد اللغة والمدة المستهدفة، وجهّز مشروعك لمراحل كتابة السكريبت والصور والصوت وتجميع الفيديو.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01","الفكرة والسكريبت","تحويل الفكرة إلى مشاهد وخطة إنتاج"],
              ["02","الصور والمشاهد","إعداد المشاهد البصرية"],
              ["03","الصوت والتعليق","تجهيز مسار التعليق الصوتي"],
              ["04","تجميع الفيديو","تصدير نهائي بصيغة MP4 بعد ربط المحركات"]
            ].map(([n,title,desc]) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="text-sm font-bold text-violet-300">{n}</div>
                <h2 className="mt-3 text-lg font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 text-sm leading-7 text-amber-100">
            الموقع يفتح مباشرة بدون كلمة مرور. تشغيل توليد الصور والصوت والفيديو وحفظ المشاريع يحتاج إضافة مفاتيح خدمات الإنتاج وقاعدة البيانات؛ المحركات لم تُفعّل بعد.
          </div>
        </section>
        <footer className="border-t border-white/10 pt-5 text-xs text-slate-500">MAHMOUD AI · واجهة عامة</footer>
      </div>
    </main>
  );
}
