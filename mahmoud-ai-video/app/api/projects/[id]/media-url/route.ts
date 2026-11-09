import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const path = body.path;
  if (typeof path !== "string" || !path.startsWith(`${user.id}/${id}/`) || path.includes("..")) {
    return NextResponse.json({ error: "Invalid media path" }, { status: 400 });
  }
  const { data, error } = await supabase.storage.from("private-videos").createSignedUrl(path, 300);
  if (error || !data) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  return NextResponse.json({ url: data.signedUrl, expiresIn: 300 });
}
