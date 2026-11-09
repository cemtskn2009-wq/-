import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Scene = { visual_prompt?: string; image_path?: string; video_path?: string; video_task_id?: string; video_status?: string; [key:string]: unknown };

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const key=process.env.RUNWAYML_API_SECRET;
  if(!key)return NextResponse.json({error:"Add RUNWAYML_API_SECRET on the server."},{status:503});
  const body=await request.json().catch(()=>({}));
  const sceneIndex=Number(body.sceneIndex);
  if(!Number.isInteger(sceneIndex)||sceneIndex<0)return NextResponse.json({error:"Invalid sceneIndex"},{status:400});
  const {data:project,error}=await supabase.from("projects").select("id,format,scenes").eq("id",id).single();
  if(error||!project||!Array.isArray(project.scenes)||!project.scenes[sceneIndex])return NextResponse.json({error:"Project or scene not found"},{status:404});
  const scenes=[...project.scenes] as Scene[];
  const scene=scenes[sceneIndex];
  if(!scene.image_path)return NextResponse.json({error:"Generate the scene image first."},{status:409});
  if(scene.video_path)return NextResponse.json({ok:true,video_path:scene.video_path,status:"completed"});
  try {
    const {data:signed,error:signedError}=await supabase.storage.from("private-videos").createSignedUrl(scene.image_path,600);
    if(signedError||!signed)return NextResponse.json({error:"Could not create image URL for video provider."},{status:500});
    const response=await fetch("https://api.dev.runwayml.com/v1/image_to_video",{
      method:"POST",
      headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json","X-Runway-Version":"2024-11-06"},
      body:JSON.stringify({
        model:process.env.RUNWAY_VIDEO_MODEL||"gen4_turbo",
        promptImage:signed.signedUrl,
        promptText:scene.visual_prompt||"Cinematic subtle camera movement, natural motion",
        ratio:project.format==="shorts"?"720:1280":"1280:720",
        duration:5
      }),
      signal:AbortSignal.timeout(60000)
    });
    if(!response.ok){console.error("Runway create task",response.status,(await response.text()).slice(0,500));return NextResponse.json({error:"Video provider rejected the request. Check API key, credits and model access."},{status:502});}
    const task=await response.json();
    if(typeof task.id!=="string")throw new Error("Video provider returned no task ID");
    scenes[sceneIndex]={...scene,video_task_id:task.id,video_status:"processing"};
    const {error:saveError}=await supabase.from("projects").update({scenes,updated_at:new Date().toISOString()}).eq("id",id);
    if(saveError)throw new Error("Could not save video task");
    return NextResponse.json({ok:true,taskId:task.id,status:"processing",sceneIndex});
  } catch(error) {
    console.error("Video generation start failed",error);
    return NextResponse.json({error:error instanceof Error?error.message:"Could not start video generation"},{status:502});
  }
}

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const sceneIndex=Number(new URL(request.url).searchParams.get("sceneIndex"));
  if(!Number.isInteger(sceneIndex)||sceneIndex<0)return NextResponse.json({error:"Invalid sceneIndex"},{status:400});
  const {data:project,error}=await supabase.from("projects").select("id,scenes").eq("id",id).single();
  if(error||!project||!Array.isArray(project.scenes)||!project.scenes[sceneIndex])return NextResponse.json({error:"Project or scene not found"},{status:404});
  const scenes=[...project.scenes] as Scene[];
  const scene=scenes[sceneIndex];
  if(scene.video_path)return NextResponse.json({status:"completed",video_path:scene.video_path});
  if(!scene.video_task_id)return NextResponse.json({status:"not_started"});
  const key=process.env.RUNWAYML_API_SECRET;
  if(!key)return NextResponse.json({error:"Video provider is not configured."},{status:503});
  try {
    const response=await fetch(`https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(scene.video_task_id)}`,{
      headers:{"Authorization":`Bearer ${key}`,"X-Runway-Version":"2024-11-06"},
      cache:"no-store",signal:AbortSignal.timeout(30000)
    });
    if(!response.ok)return NextResponse.json({error:"Could not retrieve video task status."},{status:502});
    const task=await response.json();
    const status=task.status==="SUCCEEDED"||task.status==="completed"?"completed":task.status==="FAILED"||task.status==="failed"?"failed":"processing";
    if(status==="failed"){
      scenes[sceneIndex]={...scene,video_status:"failed"};
      await supabase.from("projects").update({scenes,updated_at:new Date().toISOString()}).eq("id",id);
      return NextResponse.json({status,error:"Video generation failed at provider."});
    }
    if(status!=="completed"){
      scenes[sceneIndex]={...scene,video_status:"processing"};
      await supabase.from("projects").update({scenes,updated_at:new Date().toISOString()}).eq("id",id);
      return NextResponse.json({status});
    }
    const outputUrl=Array.isArray(task.output)?task.output[0]:task.output?.url||task.output?.video_url;
    if(typeof outputUrl!=="string")return NextResponse.json({status:"processing"});
    const videoResponse=await fetch(outputUrl,{signal:AbortSignal.timeout(120000)});
    if(!videoResponse.ok)throw new Error("Could not download generated video");
    const bytes=Buffer.from(await videoResponse.arrayBuffer());
    const path=`${user.id}/${id}/scene-${sceneIndex+1}.mp4`;
    const {error:uploadError}=await supabase.storage.from("private-videos").upload(path,bytes,{contentType:"video/mp4",upsert:true});
    if(uploadError)throw new Error("Could not save generated video");
    scenes[sceneIndex]={...scene,video_path:path,video_status:"completed"};
    const {error:saveError}=await supabase.from("projects").update({scenes,updated_at:new Date().toISOString()}).eq("id",id);
    if(saveError)throw new Error("Could not save video output metadata");
    return NextResponse.json({status:"completed",video_path:path});
  } catch(error) {
    console.error("Video task polling failed",error);
    return NextResponse.json({error:error instanceof Error?error.message:"Could not check video task"},{status:502});
  }
}
