"use client";
import { useState } from "react";
export default function InviteForm(){
 const [email,setEmail]=useState("");const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg("");const res=await fetch("/api/admin/invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});const data=await res.json();setMsg(data.message??(res.ok?"تم إرسال الدعوة":"تعذر إرسال الدعوة"));setBusy(false);}
 return <form onSubmit={submit} className="card p-6 space-y-4"><label className="block text-sm">البريد الإلكتروني<input className="field mt-2" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>{msg&&<p className="text-sm text-violet-200">{msg}</p>}<button disabled={busy} className="btn btn-primary w-full">{busy?"جارٍ الإرسال...":"إرسال الدعوة"}</button></form>;
}
