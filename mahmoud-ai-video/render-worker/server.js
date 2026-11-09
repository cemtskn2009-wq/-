import express from "express";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const app=express();
app.use(express.json({limit:"1mb"}));
const token=process.env.RENDER_WORKER_TOKEN;
app.get("/health",(_req,res)=>res.json({ok:true}));
app.post("/render",async(req,res)=>{
  if(!token||req.headers.authorization!==`Bearer ${token}`)return res.status(401).json({error:"Unauthorized"});
  const scenes=req.body?.scenes;
  if(!Array.isArray(scenes)||!scenes.length||scenes.length>30||scenes.some(s=>typeof s.videoUrl!=="string"||typeof s.audioUrl!=="string"))return res.status(400).json({error:"Expected 1-30 scenes with videoUrl and audioUrl"});
  const dir=await mkdtemp(path.join(tmpdir(),"mahmoud-render-"));
  const run=(args)=>new Promise((resolve,reject)=>{
    const child=spawn("ffmpeg",args,{stdio:["ignore","ignore","pipe"]});
    let error="";
    child.stderr.on("data",d=>{error+=d.toString();if(error.length>12000)error=error.slice(-12000);});
    child.on("error",reject);
    child.on("close",code=>code===0?resolve():reject(new Error(error||"ffmpeg failed")));
  });
  try{
    const files=[];
    for(let i=0;i<scenes.length;i++){
      const [v,a]=await Promise.all([fetch(scenes[i].videoUrl),fetch(scenes[i].audioUrl)]);
      if(!v.ok||!a.ok)throw new Error(`Could not download media for scene ${i+1}`);
      const video=path.join(dir,`v${i}.mp4`),audio=path.join(dir,`a${i}.mp3`);
      await Promise.all([writeFile(video,Buffer.from(await v.arrayBuffer())),writeFile(audio,Buffer.from(await a.arrayBuffer()))]);
      files.push({video,audio});
    }
    const videoList=files.map((f)=>`file '${f.video}'`).join("\n");
    const audioInputs=files.flatMap(f=>["-i",f.audio]);
    await writeFile(path.join(dir,"videos.txt"),videoList);
    await run(["-y","-f","concat","-safe","0","-i",path.join(dir,"videos.txt"),...audioInputs,"-filter_complex",`amix=inputs=${files.length}:duration=longest:dropout_transition=2[a]`,"-map","0:v:0","-map","[a]","-c:v","libx264","-preset","veryfast","-crf","23","-c:a","aac","-b:a","192k","-shortest","-movflags","+faststart",path.join(dir,"output.mp4")]);
    const output=await readFile(path.join(dir,"output.mp4"));
    res.setHeader("Content-Type","video/mp4");
    res.setHeader("Content-Length",output.length);
    res.send(output);
  }catch(error){console.error("Render failed",error);if(!res.headersSent)res.status(500).json({error:"Render failed. Check worker logs."});}
  finally{await rm(dir,{recursive:true,force:true}).catch(()=>{});}
});
const port=Number(process.env.PORT||8080);
app.listen(port,()=>console.log(`Render worker listening on ${port}`));
