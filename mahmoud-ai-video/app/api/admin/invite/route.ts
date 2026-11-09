import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({message:"Unauthorized"},{status:401});
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single();
  if(profile?.role!=="admin") return NextResponse.json({message:"Forbidden"},{status:403});
  const body=await request.json().catch(()=>({}));
  const email=String(body.email??"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({message:"بريد إلكتروني غير صالح"},{status:400});
  const admin=createAdminClient();
  const {error:pendingError}=await admin.from("invitations").upsert({email,invited_by:user.id,status:"pending"},{onConflict:"email"});
  if(pendingError) return NextResponse.json({message:"تعذر تجهيز الدعوة"},{status:500});
  const {error}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:`${new URL(request.url).origin}/auth/callback`});
  if(error) return NextResponse.json({message:error.message},{status:400});
  return NextResponse.json({message:"تم إرسال رابط الدعوة إلى البريد الإلكتروني."});
}
