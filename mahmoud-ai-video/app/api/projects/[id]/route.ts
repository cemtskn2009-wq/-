import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Scene = { number: number; narration: string; visual_prompt: string; duration_seconds: number };
type ScriptDraft = { title: string; hook: string; introduction: string; scenes: Scene[]; conclusion: string; description: string; tags: string[] };

function isScriptDraft(value: unknown): value is ScriptDraft {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.title !== "string" || typeof v.hook !== "string" ||
      typeof v.introduction !== "string" || typeof v.conclusion !== "string" ||
      typeof v.description !== "string" || !Array.isArray(v.tags) ||
      !v.tags.every((tag) => typeof tag === "string") ||
      !Array.isArray(v.scenes) || v.scenes.length < 1 || v.scenes.length > 60) return false;
  return v.scenes.every((scene) => {
    if (!scene || typeof scene !== "object") return false;
    const s = scene as Record<string, unknown>;
    return typeof s.narration === "string" && typeof s.visual_prompt === "string" &&
      typeof s.duration_seconds === "number" && Number.isFinite(s.duration_seconds) &&
      s.duration_seconds > 0 && s.duration_seconds <= 3600;
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if ("script" in input) {
    if (!isScriptDraft(input.script)) return NextResponse.json({ error: "Invalid script structure" }, { status: 400 });
    const script = input.script;
    updates.script = { ...script, scenes: script.scenes.map((scene, index) => ({ ...scene, number: index + 1 })) };
    updates.scenes = updates.script && (updates.script as ScriptDraft).scenes;
    updates.updated_at = new Date().toISOString();
  }

  if ("status" in input) {
    if (input.status !== "script_review") return NextResponse.json({ error: "Only script review status can be set here" }, { status: 400 });
    updates.status = "script_review";
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data, error } = await supabase.from("projects").update(updates)
    .eq("id", id).select("id,title,status,script,scenes").single();
  if (error || !data) return NextResponse.json({ error: "Project update failed" }, { status: 403 });
  return NextResponse.json({ data });
}
