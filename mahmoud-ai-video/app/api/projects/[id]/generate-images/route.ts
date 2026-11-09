import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Scene = { number?: number; visual_prompt?: string; image_path?: string; [key: string]: unknown };

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = process.env.IMAGE_PROVIDER_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "Add IMAGE_PROVIDER_API_KEY on the server." }, { status: 503 });

  const { data: project, error } = await supabase.from("projects").select("id,scenes,status").eq("id", id).single();
  if (error || !project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!Array.isArray(project.scenes) || project.scenes.length === 0) return NextResponse.json({ error: "Generate and save a script first." }, { status: 409 });

  const scenes = [...project.scenes] as Scene[];
  try {
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (scene.image_path) continue;
      if (typeof scene.visual_prompt !== "string" || !scene.visual_prompt.trim()) throw new Error(`Scene ${i + 1} has no visual prompt`);
      const response = await fetch(process.env.IMAGE_PROVIDER_URL || "https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.IMAGE_MODEL || "gpt-image-1", prompt: scene.visual_prompt, size: "1024x1024", quality: "medium", n: 1 }),
        signal: AbortSignal.timeout(120000)
      });
      if (!response.ok) throw new Error(`Image provider failed for scene ${i + 1} (${response.status})`);
      const payload = await response.json();
      const encoded = payload?.data?.[0]?.b64_json;
      if (typeof encoded !== "string") throw new Error("Image provider returned no image data");
      const bytes = Buffer.from(encoded, "base64");
      const path = `${user.id}/${id}/scene-${i + 1}.png`;
      const { error: uploadError } = await supabase.storage.from("private-videos").upload(path, bytes, { contentType: "image/png", upsert: true });
      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
      scenes[i] = { ...scene, image_path: path };
      const { error: saveError } = await supabase.from("projects").update({ scenes, status: "image_review", updated_at: new Date().toISOString() }).eq("id", id);
      if (saveError) throw new Error("Could not save generated scene images");
    }
    return NextResponse.json({ ok: true, scenes });
  } catch (error) {
    console.error("Image generation failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Image generation failed" }, { status: 502 });
  }
}
