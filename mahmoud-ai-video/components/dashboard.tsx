"use client";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { messages, type Locale } from "@/lib/i18n";
import { Film, Plus, ShieldCheck, LogOut, Languages, Users, WandSparkles, Clapperboard } from "lucide-react";

type Project = { id:string; title:string; format:string; content_language:string; status:string; created_at:string };
export default function Dashboard({email,role,initialProjects}:{email:string;role:string;initialProjects:Project[]}) {
  const [locale,setLocale] = useState<Locale>("ar");
  const [projects,setProjects] = useState(initialProjects);
  const [showForm,setShowForm] = useState(false);
  const [title,setTitle] = useState(""); const [idea,setIdea] = useState("");
  const [format,setFormat] = useState("long"); const [language,setLanguage] = useState("ar");
  const [duration,setDuration] = useState("8"); const [busy,setBusy] = useState(false); const [notice,setNotice] = useState("");
  const t = messages[locale]; const rtl = locale==="ar";
  const isAdmin = role==="admin";
  async function createProject(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    const supabase=createClient();
    const {data,error}=await supabase.from("projects").insert({
      title:title.trim() || idea.slice(0,48), idea, format, content_language:language,
      target_duration_minutes:Number(duration), status:"script_draft"
    }).select("id,title,format,content_language,status,created_at").single();
    if(error){setNotice(t.error);setBusy(false);return;}
    setProjects([data,...projects]);setShowForm(false);setTitle("");setIdea("");setNotice(t.saved);setBusy(false);
  }
  async function signOut(){const supabase=createClient();await supabase.auth.signOut();window.location.href="/login";}
  const statusLabel=(s:string)=>s==="script_draft"?t.statusDraft:s==="script_review"?t.statusReview:s==="image_review"?t.statusImages:t.statusReady;
  return <main className="min-h-screen" dir={rtl?"rtl":"ltr"}>
    <header className="border-b border-white/10 bg-[#101725]">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
        <div><div className="text-xl font-black tracking-tight">MAHMOUD <span className="text-violet-400">AI</span></div><div className="text-xs text-slate-400">{t.subtitle}</div></div>
        <div className="flex items-center gap-2">
          <button className="btn btn-muted flex items-center gap-2 text-sm" onClick={()=>setLocale(locale==="ar"?"en":"ar")}><Languages size={16}/>{locale==="ar"?"EN":"عربي"}</button>
          {isAdmin && <a href="/admin/invites" className="btn btn-muted flex items-center gap-2 text-sm"><Users size={16}/><span>{t.invite}</span></a>}<button className="btn btn-muted flex items-center gap-2 text-sm" onClick={signOut}><LogOut size={16}/><span className="hidden sm:inline">{t.signOut}</span></button>
        </div>
      </div>
    </header>
    <div className="max-w-6xl mx-auto px-5 py-9">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div><div className="flex items-center gap-2 text-sm text-emerald-300 mb-2"><ShieldCheck size={16}/>{t.private} · {isAdmin?t.admin:t.member}</div><h1 className="text-3xl font-black">{t.headline}</h1><p className="text-slate-400 mt-2">{t.intro}</p><p className="text-xs text-slate-500 mt-2">{email}</p></div>
        <button className="btn btn-primary flex items-center gap-2" onClick={()=>setShowForm(!showForm)}><Plus size={18}/>{t.newProject}</button>
      </div>
      {notice && <div className="mb-5 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-sm">{notice}</div>}
      {showForm && <form onSubmit={createProject} className="card p-5 md:p-7 mb-8 space-y-5">
        <div className="flex items-center gap-2 text-xl font-bold"><WandSparkles className="text-violet-300"/>{t.newProject}</div>
        <label className="block text-sm">{t.idea}<textarea required minLength={12} rows={4} className="field mt-2" placeholder={t.ideaHint} value={idea} onChange={e=>setIdea(e.target.value)}/></label>
        <div className="grid md:grid-cols-3 gap-4">
          <label className="block text-sm">{t.format}<select className="field mt-2" value={format} onChange={e=>setFormat(e.target.value)}><option value="long">{t.long}</option><option value="shorts">{t.shorts}</option></select></label>
          <label className="block text-sm">{t.language}<select className="field mt-2" value={language} onChange={e=>setLanguage(e.target.value)}><option value="ar">{t.arabic}</option><option value="en">{t.english}</option></select></label>
          <label className="block text-sm">{t.duration}<select className="field mt-2" value={duration} onChange={e=>setDuration(e.target.value)}>{["1","3","5","8","10","15","20"].map(v=><option key={v} value={v}>{v} {locale==="ar"?"دقيقة":"minutes"}</option>)}</select></label>
        </div>
        <label className="block text-sm">{locale==="ar"?"اسم المشروع (اختياري)":"Project title (optional)"}<input className="field mt-2" value={title} onChange={e=>setTitle(e.target.value)} /></label>
        <div className="rounded-xl border border-amber-300/20 bg-amber-400/5 p-3 text-sm text-amber-100">{t.coming}</div>
        <div className="flex gap-3"><button disabled={busy} className="btn btn-primary">{busy?t.loading:t.create}</button><button type="button" className="btn btn-muted" onClick={()=>setShowForm(false)}>{locale==="ar"?"إلغاء":"Cancel"}</button></div>
      </form>}
      <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><Film size={19}/>{t.projects}</h2><span className="text-xs text-slate-500">{projects.length}</span></div>
      {projects.length===0?<div className="card p-10 text-center text-slate-400"><Clapperboard size={32} className="mx-auto mb-3 opacity-60"/>{t.noProjects}</div>:
        <div className="grid md:grid-cols-2 gap-4">{projects.map(p=><article key={p.id} className="card p-5"><div className="flex justify-between gap-3"><h3 className="font-bold">{p.title}</h3><span className="text-xs text-violet-200 bg-violet-500/15 rounded-full px-3 py-1 h-fit">{statusLabel(p.status)}</span></div><p className="text-sm text-slate-400 mt-3">{p.format==="shorts"?t.shorts:t.long} · {p.content_language==="ar"?t.arabic:t.english}</p><p className="text-xs text-slate-500 mt-3">{new Date(p.created_at).toLocaleDateString(locale==="ar"?"ar-EG":"en-US")}</p></article>)}</div>}
      <div className="mt-10 border-t border-white/10 pt-5 flex flex-wrap justify-between gap-3 text-xs text-slate-500"><span>🔒 {t.private}</span><span>{email}</span></div>
    </div>
  </main>;
}
