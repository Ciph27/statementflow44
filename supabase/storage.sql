-- Create private storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('statements', 'statements', false, 15728640, ARRAY['application/pdf']),
  ('templates', 'templates', false, 10485760, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
  ('exports', 'exports', false, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for statements bucket
CREATE POLICY "Users can upload own statements" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own statements" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own statements" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'statements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS Policies for templates bucket
CREATE POLICY "Users can upload own templates" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'templates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own templates" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'templates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own templates" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'templates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS Policies for exports bucket
CREATE POLICY "Users can upload own exports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own exports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own exports" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );