import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Scene={video_path?:string;audio_path?:string};
export const maxDuration=300;

export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const worker=process.env.RENDER_WORKER_URL;
  const token=process.env.RENDER_WORKER_TOKEN;
  if(!worker||!token)return NextResponse.json({error:"Configure the private FFmpeg render worker first."},{status:503});
  const {data:project,error}=await supabase.from("projects").select("id,scenes").eq("id",id).single();
  if(error||!project||!Array.isArray(project.scenes)||!project.scenes.length)return NextResponse.json({error:"Project or scenes not found"},{status:404});
  const scenes=project.scenes as Scene[];
  if(scenes.some(s=>!s.video_path||!s.audio_path))return NextResponse.json({error:"Generate video and voice for every scene before rendering."},{status:409});
  try{
    const media=await Promise.all(scenes.map(async(scene)=>{
      const [v,a]=await Promise.all([
        supabase.storage.from("private-videos").createSignedUrl(scene.video_path!,1800),
        supabase.storage.from("private-videos").createSignedUrl(scene.audio_path!,1800)
      ]);
      if(v.error||a.error||!v.data||!a.data)throw new Error("Could not prepare private media URLs");
      return {videoUrl:v.data.signedUrl,audioUrl:a.data.signedUrl};
    }));
    await supabase.from("projects").update({status:"rendering",updated_at:new Date().toISOString()}).eq("id",id);
    const response=await fetch(worker.replace(/\/$/,"")+"/render",{
      method:"POST",headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},
      body:JSON.stringify({scenes:media}),signal:AbortSignal.timeout(240000)
    });
    if(!response.ok){await supabase.from("projects").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",id);return NextResponse.json({error:"Render worker failed. Check its logs and configuration."},{status:502});}
    const bytes=Buffer.from(await response.arrayBuffer());
    const outputPath=`${user.id}/${id}/final-video.mp4`;
    const {error:uploadError}=await supabase.storage.from("private-videos").upload(outputPath,bytes,{contentType:"video/mp4",upsert:true});
    if(uploadError)throw new Error("Could not save final MP4 to private storage");
    const {error:saveError}=await supabase.from("projects").update({output_path:outputPath,status:"completed",updated_at:new Date().toISOString()}).eq("id",id);
    if(saveError)throw new Error("Could not save final video metadata");
    const {data:signed,error:signedError}=await supabase.storage.from("private-videos").createSignedUrl(outputPath,300);
    if(signedError||!signed)throw new Error("Video rendered but download link could not be created");
    return NextResponse.json({ok:true,status:"completed",output_path:outputPath,downloadUrl:signed.signedUrl});
  }catch(error){
    console.error("Final render failed",error);
    await supabase.from("projects").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",id);
    return NextResponse.json({error:error instanceof Error?error.message:"Final render failed"},{status:502});
  }
}
