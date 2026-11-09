import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Scene = { number: number; narration: string; visual_prompt: string; duration_seconds: number };
type ScriptDraft = { title: string; hook: string; introduction: string; scenes: Scene[]; conclusion: string; description: string; tags: string[] };

function isScriptDraft(value: unknown): value is ScriptDraft {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.title === "string" && typeof v.hook === "string" &&
    typeof v.introduction === "string" && Array.isArray(v.scenes) &&
    typeof v.conclusion === "string" && typeof v.description === "string" &&
    Array.isArray(v.tags) && v.scenes.length > 0 &&
    v.scenes.every((scene) => {
      if (!scene || typeof scene !== "object") return false;
      const s = scene as Record<string, unknown>;
      return typeof s.narration === "string" && typeof s.visual_prompt === "string" &&
        typeof s.duration_seconds === "number";
    });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,title,idea,format,content_language,target_duration_minutes,status")
    .eq("id", id)
    .single();
  if (projectError || !project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (!process.env.LLM_API_KEY) {
    return NextResponse.json({ error: "AI provider is not configured. Add LLM_API_KEY on the server." }, { status: 503 });
  }

  const language = project.content_language === "ar" ? "Arabic" : "English";
  const isShort = project.format === "shorts";
  const sceneCount = isShort ? 5 : Math.max(6, Math.min(18, project.target_duration_minutes * 2));
  const schema = {
    title: "string",
    hook: "string",
    introduction: "string",
    scenes: [{ number: 1, narration: "string", visual_prompt: "detailed image-generation prompt in English", duration_seconds: 30 }],
    conclusion: "string",
    description: "YouTube description",
    tags: ["string"]
  };
  const prompt = [
    "You are a professional YouTube scriptwriter and visual-story planner.",
    `Write a complete ${isShort ? "vertical YouTube Short" : "long-form YouTube video"} in ${language}.`,
    `Target duration: ${project.target_duration_minutes} minutes. Create approximately ${sceneCount} scenes.`,
    "Make the opening hook compelling, keep narration natural and fact-conscious, and give every scene a specific visual prompt.",
    "Visual prompts must be in English, cinematic, concrete, and must not request text or subtitles inside the image.",
    "Return ONLY valid JSON matching this structure, with no markdown fences:",
    JSON.stringify(schema),
    `Project idea: ${project.idea}`,
    `Working title: ${project.title}`
  ].join("\n\n");

  try {
    const response = await fetch(process.env.LLM_BASE_URL || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.LLM_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "gpt-4.1-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return valid JSON only. Do not include markdown." },
          { role: "user", content: prompt }
        ]
      }),
      signal: AbortSignal.timeout(90000)
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("LLM provider error", response.status, detail.slice(0, 1000));
      return NextResponse.json({ error: "The AI provider could not generate the script. Check provider settings and quota." }, { status: 502 });
    }
    const payload = await response.json();
    const raw = payload?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") throw new Error("Empty AI response");
    const parsed: unknown = JSON.parse(raw);
    if (!isScriptDraft(parsed)) throw new Error("AI response did not match the expected script structure");

    const scenes = parsed.scenes.map((scene, index) => ({ ...scene, number: index + 1 }));
    const { data, error } = await supabase.from("projects")
      .update({ script: { ...parsed, scenes }, scenes, status: "script_review", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id,title,status,script,scenes")
      .single();
    if (error) {
      console.error("Project script save failed", error.message);
      return NextResponse.json({ error: "The script was generated but could not be saved." }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Script generation failed", error);
    return NextResponse.json({ error: "Script generation failed. Please try again." }, { status: 500 });
  }
}
