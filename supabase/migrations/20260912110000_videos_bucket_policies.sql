-- Text-to-video feature: users can only read/write their own folder inside
-- the "videos" bucket, same ownership pattern as story-media. The bucket
-- itself still needs to be created once in the Supabase dashboard (private
-- is fine — the app reads it via signed URLs, same as story images/audio).
CREATE POLICY "videos_own_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "videos_own_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "videos_own_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "videos_own_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
