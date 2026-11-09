"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { messages, type Locale } from "@/lib/i18n";
import { Film, Plus, ShieldCheck, LogOut, Languages, Users, WandSparkles, Clapperboard, Image as ImageIcon, Volume2, RefreshCw } from "lucide-react";

type Scene = { number?: number; narration?: string; visual_prompt?: string; duration_seconds?: number; image_path?: string; audio_path?: string };
type Project = { id:string; title:string; format:string; content_language:string; status:string; created_at:string };
type MediaUrls = Record<string,string>;

export default function Dashboard({email,role,initialProjects}:{email:string;role:string;initialProjects:Project[]}) {
  const [locale,setLocale] = useState<Locale>("ar");
  const [projects,setProjects] = useState(initialProjects);
  const [showForm,setShowForm] = useState(false);
  const [title,setTitle] = useState(""); const [idea,setIdea] = useState("");
  const [format,setFormat] = useState("long"); const [language,setLanguage] = useState("ar");
  const [duration,setDuration] = useState("8"); const [busy,setBusy] = useState(false); const [notice,setNotice] = useState("");
  const [active,setActive] = useState<string|null>(null);
  const [scenes,setScenes] = useState<Scene[]>([]);
  const [mediaUrls,setMediaUrls] = useState<MediaUrls>({});
  const t = messages[locale]; const rtl = locale==="ar"; const isAdmin = role==="admin";
  const tr = (ar:string,en:string)=>locale==="ar"?ar:en;

  async function api(projectId:string,path:string,body?:unknown) {
    const response=await fetch("/api/projects/"+projectId+"/"+path,{method:"POST",headers:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error||"Request failed");
    return result;
  }
  async function refreshProject(projectId:string) {
    const supabase=createClient();
    const {data,error}=await supabase.from("projects").select("id,title,format,content_language,status,created_at,scenes").eq("id",projectId).single();
    if(error) throw error;
    setProjects(current=>current.map(p=>p.id===projectId?{...p,...data}:p));
    setScenes(Array.isArray(data.scenes)?data.scenes:[]);
    return data;
  }
  async function createProject(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    try {
      const supabase=createClient();
      const {data,error}=await supabase.from("projects").insert({title:title.trim()||idea.slice(0,48),idea,format,content_language:language,target_duration_minutes:Number(duration),status:"script_draft"}).select("id,title,format,content_language,status,created_at").single();
      if(error) throw error;
      setProjects(current=>[data,...current]);setShowForm(false);setTitle("");setIdea("");setActive(data.id);
      setNotice(tr("تم إنشاء المشروع. جاري كتابة السيناريو...","Project created. Generating the script..."));
      await api(data.id,"generate-script");
      await refreshProject(data.id);
      setNotice(tr("تم إنشاء السيناريو. راجعه ثم أنشئ الصور والصوت.","Script generated. Review it, then generate images and voice."));
    } catch(error) {setNotice(error instanceof Error?error.message:t.error);}
    finally {setBusy(false);}
  }
  async function generateImages(projectId:string) {
    setBusy(true);setNotice("");
    try {await api(projectId,"generate-images");const data=await refreshProject(projectId);await loadMedia(data.scenes||[] ,projectId);setNotice(tr("تم توليد الصور وحفظها.","Images generated and saved."));}
    catch(error){setNotice(error instanceof Error?error.message:"Image generation failed");}
    finally{setBusy(false);}
  }
  async function generateVoices(projectId:string) {
    setBusy(true);setNotice("");
    try {
      const data=await refreshProject(projectId);
      for(let i=0;i<(data.scenes||[]).length;i++) await api(projectId,"generate-voice",{sceneIndex:i});
      const updated=await refreshProject(projectId);await loadMedia(updated.scenes||[],projectId);
      setNotice(tr("تم إنشاء التعليق الصوتي لكل المشاهد.","Voice-over generated for all scenes."));
    } catch(error){setNotice(error instanceof Error?error.message:"Voice generation failed");}
    finally{setBusy(false);}
  }
  async function loadMedia(list:Scene[],projectId:string) {
    const entries=await Promise.all(list.flatMap((scene,i)=>[
      scene.image_path?api(projectId,"media-url",{path:scene.image_path}).then((r:any)=>["image-"+i,r.url] as const):null,
      scene.audio_path?api(projectId,"media-url",{path:scene.audio_path}).then((r:any)=>["audio-"+i,r.url] as const):null
    ].filter(Boolean) as Promise<readonly [string,string]>[]));
    setMediaUrls(Object.fromEntries(entries));
  }
  async function openProject(p:Project) {
    setActive(p.id);setBusy(true);setNotice("");
    try {const data=await refreshProject(p.id);await loadMedia(data.scenes||[],p.id);}
    catch(error){setNotice(error instanceof Error?error.message:"Could not load project");}
    finally{setBusy(false);}
  }
  async function signOut(){const supabase=createClient();await supabase.auth.signOut();window.location.href="/login";}
  const statusLabel=(s:string)=>s==="script_draft"?t.statusDraft:s==="script_review"?t.statusReview:s==="image_review"?t.statusImages:s==="completed"?tr("مكتمل","Completed"):s==="failed"?tr("فشل","Failed"):t.statusReady;
  return <main className="min-h-screen" dir={rtl?"rtl":"ltr"}>
    <header className="border-b border-white/10 bg-[#101725]"><div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
      <div><div className="text-xl font-black tracking-tight">MAHMOUD <span className="text-violet-400">AI</span></div><div className="text-xs text-slate-400">{t.subtitle}</div></div>
      <div className="flex items-center gap-2"><button className="btn btn-muted flex items-center gap-2 text-sm" onClick={()=>setLocale(locale==="ar"?"en":"ar")}><Languages size={16}/>{locale==="ar"?"EN":"عربي"}</button>
      {isAdmin&&<a href="/admin/invites" className="btn btn-muted flex items-center gap-2 text-sm"><Users size={16}/><span>{t.invite}</span></a>}<button className="btn btn-muted flex items-center gap-2 text-sm" onClick={signOut}><LogOut size={16}/><span className="hidden sm:inline">{t.signOut}</span></button></div>
    </div></header>
    <div className="max-w-6xl mx-auto px-5 py-9">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8"><div><div className="flex items-center gap-2 text-sm text-emerald-300 mb-2"><ShieldCheck size={16}/>{t.private} · {isAdmin?t.admin:t.member}</div><h1 className="text-3xl font-black">{t.headline}</h1><p className="text-slate-400 mt-2">{t.intro}</p><p className="text-xs text-slate-500 mt-2">{email}</p></div>
      <button className="btn btn-primary flex items-center gap-2" onClick={()=>setShowForm(!showForm)}><Plus size={18}/>{t.newProject}</button></div>
      {notice&&<div className="mb-5 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-sm">{notice}</div>}
      {showForm&&<form onSubmit={createProject} className="card p-5 md:p-7 mb-8 space-y-5">
        <div className="flex items-center gap-2 text-xl font-bold"><WandSparkles className="text-violet-300"/>{tr("اكتب وصف الفيديو","Describe your video")}</div>
        <label className="block text-sm">{t.idea}<textarea required minLength={12} rows={4} className="field mt-2" placeholder={t.ideaHint} value={idea} onChange={e=>setIdea(e.target.value)}/></label>
        <div className="grid md:grid-cols-3 gap-4">
          <label className="block text-sm">{t.format}<select className="field mt-2" value={format} onChange={e=>setFormat(e.target.value)}><option value="long">{t.long}</option><option value="shorts">{t.shorts}</option></select></label>
          <label className="block text-sm">{t.language}<select className="field mt-2" value={language} onChange={e=>setLanguage(e.target.value)}><option value="ar">{t.arabic}</option><option value="en">{t.english}</option></select></label>
          <label className="block text-sm">{t.duration}<select className="field mt-2" value={duration} onChange={e=>setDuration(e.target.value)}>{["1","3","5","8","10","15","20"].map(v=><option key={v} value={v}>{v} {locale==="ar"?"دقيقة":"minutes"}</option>)}</select></label>
        </div>
        <label className="block text-sm">{tr("اسم المشروع (اختياري)","Project title (optional)")}<input className="field mt-2" value={title} onChange={e=>setTitle(e.target.value)}/></label>
        <div className="flex gap-3"><button disabled={busy} className="btn btn-primary">{busy?t.loading:tr("إنشاء السيناريو","Generate script")}</button><button type="button" className="btn btn-muted" onClick={()=>setShowForm(false)}>{tr("إلغاء","Cancel")}</button></div>
      </form>}
      <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><Film size={19}/>{t.projects}</h2><span className="text-xs text-slate-500">{projects.length}</span></div>
      {projects.length===0?<div className="card p-10 text-center text-slate-400"><Clapperboard size={32} className="mx-auto mb-3 opacity-60"/>{t.noProjects}</div>:
      <div className="grid md:grid-cols-2 gap-4">{projects.map(p=><article key={p.id} className="card p-5"><div className="flex justify-between gap-3"><h3 className="font-bold">{p.title}</h3><span className="text-xs text-violet-200 bg-violet-500/15 rounded-full px-3 py-1 h-fit">{statusLabel(p.status)}</span></div>
        <p className="text-sm text-slate-400 mt-3">{p.format==="shorts"?t.shorts:t.long} · {p.content_language==="ar"?t.arabic:t.english}</p><p className="text-xs text-slate-500 mt-3">{new Date(p.created_at).toLocaleDateString(locale==="ar"?"ar-EG":"en-US")}</p>
        <button className="btn btn-muted mt-4 w-full" onClick={()=>openProject(p)}>{tr("فتح المشروع","Open project")}</button></article>)}</div>}
      {active&&<section className="card p-5 md:p-7 mt-8"><div className="flex items-center justify-between gap-3 flex-wrap"><h2 className="text-xl font-bold">{tr("مراحل إنتاج الفيديو","Video production")}</h2><button className="btn btn-muted text-sm" onClick={()=>{setActive(null);setScenes([]);setMediaUrls({});}}>{tr("إغلاق","Close")}</button></div>
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <button disabled={busy} className="btn btn-primary flex items-center justify-center gap-2" onClick={()=>generateImages(active)}><ImageIcon size={17}/>{tr("توليد صور المشاهد","Generate scene images")}</button>
          <button disabled={busy||scenes.length===0} className="btn btn-primary flex items-center justify-center gap-2" onClick={()=>generateVoices(active)}><Volume2 size={17}/>{tr("توليد التعليق الصوتي","Generate voice-over")}</button>
        </div>
        {busy&&<p className="text-sm text-slate-400 mt-4 flex items-center gap-2"><RefreshCw size={15} className="animate-spin"/>{tr("جاري التنفيذ...","Working...")}</p>}
        {scenes.length===0?<p className="text-sm text-slate-400 mt-5">{tr("افتح مشروعًا لمعاينة المشاهد بعد إنشاء السيناريو.","Open a project to review its scenes after script generation.")}</p>:
          <div className="space-y-5 mt-6">{scenes.map((scene,i)=><article key={i} className="border border-white/10 rounded-xl p-4">
            <div className="font-bold mb-2">{tr("المشهد","Scene")} {i+1} · {scene.duration_seconds||0} {tr("ثانية","seconds")}</div>
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{scene.narration}</p><p className="text-xs text-slate-400 mt-2">{scene.visual_prompt}</p>
            {mediaUrls["image-"+i]&&<img src={mediaUrls["image-"+i]} alt={"Scene "+(i+1)} className="rounded-lg mt-3 max-h-72 object-contain"/>}
            {mediaUrls["audio-"+i]&&<audio controls src={mediaUrls["audio-"+i]} className="w-full mt-3"/>}
          </article>)}</div>}
        <p className="text-xs text-amber-200/80 mt-5">{tr("تحويل الصور إلى فيديو وتجميع ملف MP4 لم يتم توصيلهما بعد.","Image-to-video animation and final MP4 rendering are not connected yet.")}</p>
      </section>}
      <div className="mt-10 border-t border-white/10 pt-5 flex flex-wrap justify-between gap-3 text-xs text-slate-500"><span>🔒 {t.private}</span><span>{email}</span></div>
    </div>
  </main>;
}
