import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Scene = { narration?: string; audio_path?: string; [key: string]: unknown };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = process.env.TTS_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "Add TTS_API_KEY on the server." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const sceneIndex = Number(body.sceneIndex);
  if (!Number.isInteger(sceneIndex) || sceneIndex < 0) return NextResponse.json({ error: "Invalid sceneIndex" }, { status: 400 });

  const { data: project, error } = await supabase.from("projects").select("id,scenes").eq("id", id).single();
  if (error || !project || !Array.isArray(project.scenes) || !project.scenes[sceneIndex]) return NextResponse.json({ error: "Project or scene not found" }, { status: 404 });
  const scenes = [...project.scenes] as Scene[];
  const narration = scenes[sceneIndex].narration;
  if (typeof narration !== "string" || !narration.trim()) return NextResponse.json({ error: "Scene narration is empty" }, { status: 400 });

  try {
    const response = await fetch(process.env.TTS_PROVIDER_URL || "https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.TTS_MODEL || "tts-1", voice: process.env.TTS_VOICE || "alloy", input: narration, response_format: "mp3" }),
      signal: AbortSignal.timeout(120000)
    });
    if (!response.ok) throw new Error(`Speech provider failed (${response.status})`);
    const audio = Buffer.from(await response.arrayBuffer());
    const path = `${user.id}/${id}/scene-${sceneIndex + 1}.mp3`;
    const { error: uploadError } = await supabase.storage.from("private-videos").upload(path, audio, { contentType: "audio/mpeg", upsert: true });
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
    scenes[sceneIndex] = { ...scenes[sceneIndex], audio_path: path };
    const { error: saveError } = await supabase.from("projects").update({ scenes, updated_at: new Date().toISOString() }).eq("id", id);
    if (saveError) throw new Error("Could not save generated voice");
    return NextResponse.json({ ok: true, sceneIndex, audio_path: path });
  } catch (error) {
    console.error("Voice generation failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Voice generation failed" }, { status: 502 });
  }
}
