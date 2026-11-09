"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
export default function LoginForm() {
  const [email,setEmail] = useState(""); const [password,setPassword] = useState("");
  const [error,setError] = useState(""); const [busy,setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("تعذر تسجيل الدخول. تأكد من الدعوة وبيانات الحساب."); setBusy(false); return; }
    window.location.href = "/dashboard";
  }
  return <main className="min-h-screen grid place-items-center p-5" dir="rtl">
    <form onSubmit={submit} className="card w-full max-w-md p-8 space-y-5">
      <div><div className="text-3xl font-black tracking-tight">MAHMOUD <span className="text-violet-400">AI</span></div><p className="text-slate-400 mt-2">استوديو محمود الخاص لإنشاء الفيديو بالذكاء الاصطناعي</p></div>
      <div className="rounded-xl bg-violet-500/10 border border-violet-400/20 p-3 text-sm text-violet-200">🔒 الدخول بالدعوة فقط — التسجيل العام مغلق.</div>
      <label className="block text-sm">البريد الإلكتروني<input className="field mt-2" type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label className="block text-sm">كلمة المرور<input className="field mt-2" type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
      {error && <p className="text-red-300 text-sm">{error}</p>}
      <button disabled={busy} className="btn btn-primary w-full">{busy?"جارٍ الدخول...":"تسجيل الدخول"}</button>
    </form>
  </main>;
}
