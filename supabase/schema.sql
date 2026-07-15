-- Run in Supabase SQL Editor (safe to re-run)

CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  title TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  location_name TEXT,
  image_paths TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  storage_path TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS edit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('image', 'video')),
  storage_path TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  destination TEXT NOT NULL DEFAULT '',
  date DATE,
  description TEXT NOT NULL DEFAULT '',
  activities JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'dream' CHECK (status IN ('planned', 'completed', 'dream')),
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow browser (anon key) access — app password protects the UI
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_memories" ON memories;
CREATE POLICY "anon_all_memories" ON memories FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_gallery" ON gallery_items;
CREATE POLICY "anon_all_gallery" ON gallery_items FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_edits" ON edit_items;
CREATE POLICY "anon_all_edits" ON edit_items FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_plans" ON travel_plans;
CREATE POLICY "anon_all_plans" ON travel_plans FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_storage_all" ON storage.objects;
CREATE POLICY "anon_storage_all" ON storage.objects FOR ALL TO anon
  USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "public_storage_read" ON storage.objects;
CREATE POLICY "public_storage_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'media');
