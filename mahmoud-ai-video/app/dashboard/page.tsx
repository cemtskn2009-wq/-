import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/dashboard";
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role,email").eq("id",user.id).single();
  const { data: projects } = await supabase.from("projects").select("id,title,format,content_language,status,created_at").order("created_at",{ascending:false});
  return <Dashboard email={user.email ?? ""} role={profile?.role ?? "member"} initialProjects={projects ?? []} />;
}
