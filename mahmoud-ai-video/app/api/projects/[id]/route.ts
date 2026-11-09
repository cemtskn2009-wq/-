import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await request.json().catch(()=>({}));
 const allowed=["script_review","image_review","ready_to_render"];
 if(!allowed.includes(body.status))return NextResponse.json({error:"Invalid status"},{status:400});
 const {data,error}=await supabase.from("projects").update({status:body.status}).eq("id",id).select("id,status").single();
 if(error)return NextResponse.json({error:"Project update failed"},{status:403});
 return NextResponse.json({data});
}
