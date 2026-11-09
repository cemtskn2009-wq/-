-- Run after supabase/schema.sql. The bucket remains private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-videos', 'private-videos', false, 52428800, array['image/png','image/jpeg','audio/mpeg','video/mp4'])
on conflict (id) do update set public = false;

drop policy if exists "Project media owner read" on storage.objects;
create policy "Project media owner read" on storage.objects for select to authenticated
using (bucket_id = 'private-videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Project media owner insert" on storage.objects;
create policy "Project media owner insert" on storage.objects for insert to authenticated
with check (bucket_id = 'private-videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Project media owner update" on storage.objects;
create policy "Project media owner update" on storage.objects for update to authenticated
using (bucket_id = 'private-videos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'private-videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Project media owner delete" on storage.objects;
create policy "Project media owner delete" on storage.objects for delete to authenticated
using (bucket_id = 'private-videos' and (storage.foldername(name))[1] = auth.uid()::text);
