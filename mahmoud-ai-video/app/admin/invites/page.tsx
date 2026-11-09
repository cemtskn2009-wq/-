import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InviteForm from "@/components/invite-form";
export default async function InvitesPage(){
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single();
  if(profile?.role!=="admin") redirect("/dashboard");
  return <main className="min-h-screen p-6" dir="rtl"><div className="max-w-xl mx-auto"><a href="/dashboard" className="text-violet-300">← العودة لمساحة العمل</a><h1 className="text-3xl font-black mt-6 mb-2">دعوة مستخدم جديد</h1><p className="text-slate-400 mb-6">الدعوات فقط — لا يوجد تسجيل عام.</p><InviteForm/></div></main>;
}
