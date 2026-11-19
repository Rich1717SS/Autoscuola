-- ============================================================
-- AUTOSCUOLA "BRUTIA" — SCHEMA FINALE DI PRODUZIONE
-- Esegui questo script nel SQL Editor del tuo progetto Supabase "Brutia"
-- (Dashboard → SQL Editor → New query → incolla tutto → Run)
-- ============================================================

-- Helper: is_admin() — riconosce l'admin tramite email
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') = 'r8104198@gmail.com';
$$;

-- 1. students
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  fiscal_code text,
  license_category text NOT NULL DEFAULT 'B',
  registry_number text,
  total_fee numeric(10,2),
  status text NOT NULL DEFAULT 'teoria' CHECK (status IN ('teoria','pratica')),
  foglio_rosa_date date,
  foglio_rosa_expiry date,
  theory_attempts_used integer NOT NULL DEFAULT 0,
  theory_passed boolean NOT NULL DEFAULT false,
  missing_documents text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_select" ON students;
CREATE POLICY "students_select" ON students FOR SELECT TO authenticated USING (public.is_admin() OR user_id = auth.uid());
DROP POLICY IF EXISTS "students_insert" ON students;
CREATE POLICY "students_insert" ON students FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR user_id = auth.uid());
DROP POLICY IF EXISTS "students_update" ON students;
CREATE POLICY "students_update" ON students FOR UPDATE TO authenticated USING (public.is_admin() OR user_id = auth.uid()) WITH CHECK (public.is_admin() OR user_id = auth.uid());
DROP POLICY IF EXISTS "students_delete" ON students;
CREATE POLICY "students_delete" ON students FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON students TO authenticated;

-- 2. chapters
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  visible_to_students boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chapters_select" ON chapters;
CREATE POLICY "chapters_select" ON chapters FOR SELECT TO authenticated USING (public.is_admin() OR visible_to_students = true);
DROP POLICY IF EXISTS "chapters_insert" ON chapters;
CREATE POLICY "chapters_insert" ON chapters FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "chapters_update" ON chapters;
CREATE POLICY "chapters_update" ON chapters FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "chapters_delete" ON chapters;
CREATE POLICY "chapters_delete" ON chapters FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON chapters TO authenticated;

-- 3. chapter_materials
CREATE TABLE IF NOT EXISTS chapter_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE chapter_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "materials_select" ON chapter_materials;
CREATE POLICY "materials_select" ON chapter_materials FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_materials.chapter_id AND c.visible_to_students = true));
DROP POLICY IF EXISTS "materials_insert" ON chapter_materials;
CREATE POLICY "materials_insert" ON chapter_materials FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "materials_update" ON chapter_materials;
CREATE POLICY "materials_update" ON chapter_materials FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "materials_delete" ON chapter_materials;
CREATE POLICY "materials_delete" ON chapter_materials FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON chapter_materials TO authenticated;

-- 4. student_chapters
CREATE TABLE IF NOT EXISTS student_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, chapter_id)
);
ALTER TABLE student_chapters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sc_select" ON student_chapters;
CREATE POLICY "sc_select" ON student_chapters FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM students s WHERE s.id = student_chapters.student_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS "sc_insert" ON student_chapters;
CREATE POLICY "sc_insert" ON student_chapters FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "sc_update" ON student_chapters;
CREATE POLICY "sc_update" ON student_chapters FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "sc_delete" ON student_chapters;
CREATE POLICY "sc_delete" ON student_chapters FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON student_chapters TO authenticated;

-- 5. theory_exams
CREATE TABLE IF NOT EXISTS theory_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number IN (1,2)),
  exam_date date NOT NULL DEFAULT CURRENT_DATE,
  passed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE theory_exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "te_select" ON theory_exams;
CREATE POLICY "te_select" ON theory_exams FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM students s WHERE s.id = theory_exams.student_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS "te_insert" ON theory_exams;
CREATE POLICY "te_insert" ON theory_exams FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "te_update" ON theory_exams;
CREATE POLICY "te_update" ON theory_exams FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "te_delete" ON theory_exams;
CREATE POLICY "te_delete" ON theory_exams FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON theory_exams TO authenticated;

-- 6. driving_lessons
CREATE TABLE IF NOT EXISTS driving_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_date date NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes integer NOT NULL DEFAULT 60,
  lesson_type text NOT NULL DEFAULT 'normale' CHECK (lesson_type IN ('autostrada','extraurbana','notturna','normale')),
  notes text,
  is_extra_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE driving_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dl_select" ON driving_lessons;
CREATE POLICY "dl_select" ON driving_lessons FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM students s WHERE s.id = driving_lessons.student_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS "dl_insert" ON driving_lessons;
CREATE POLICY "dl_insert" ON driving_lessons FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "dl_update" ON driving_lessons;
CREATE POLICY "dl_update" ON driving_lessons FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "dl_delete" ON driving_lessons;
CREATE POLICY "dl_delete" ON driving_lessons FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON driving_lessons TO authenticated;

-- 7. payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  kind text NOT NULL DEFAULT 'acconto' CHECK (kind IN ('acconto','saldo','extra')),
  description text,
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pay_select" ON payments;
CREATE POLICY "pay_select" ON payments FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM students s WHERE s.id = payments.student_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS "pay_insert" ON payments;
CREATE POLICY "pay_insert" ON payments FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "pay_update" ON payments;
CREATE POLICY "pay_update" ON payments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "pay_delete" ON payments;
CREATE POLICY "pay_delete" ON payments FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO authenticated;

-- 8. attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  present boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, student_id, session_date)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "att_select" ON attendance;
CREATE POLICY "att_select" ON attendance FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM students s WHERE s.id = attendance.student_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS "att_insert" ON attendance;
CREATE POLICY "att_insert" ON attendance FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "att_update" ON attendance;
CREATE POLICY "att_update" ON attendance FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "att_delete" ON attendance;
CREATE POLICY "att_delete" ON attendance FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO authenticated;

-- 9. school_settings
CREATE TABLE IF NOT EXISTS school_settings (
  id integer PRIMARY KEY DEFAULT 1,
  school_name text NOT NULL DEFAULT 'Autoscuola',
  logo_url text,
  classroom_pin text NOT NULL DEFAULT '0000',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_select" ON school_settings;
CREATE POLICY "settings_select" ON school_settings FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "settings_insert" ON school_settings;
CREATE POLICY "settings_insert" ON school_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "settings_update" ON school_settings;
CREATE POLICY "settings_update" ON school_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "settings_delete" ON school_settings;
CREATE POLICY "settings_delete" ON school_settings FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON school_settings TO authenticated;

-- 10. exams
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_type text NOT NULL CHECK (exam_type IN ('teoria','pratica')),
  exam_date date NOT NULL,
  exam_time text,
  location text,
  notes text,
  outcome text NOT NULL DEFAULT 'in_programma' CHECK (outcome IN ('in_programma','superato','non_superato')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exams_select" ON exams;
CREATE POLICY "exams_select" ON exams FOR SELECT TO authenticated USING (public.is_admin() OR EXISTS (SELECT 1 FROM students s WHERE s.id = exams.student_id AND s.user_id = auth.uid()));
DROP POLICY IF EXISTS "exams_insert" ON exams;
CREATE POLICY "exams_insert" ON exams FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "exams_update" ON exams;
CREATE POLICY "exams_update" ON exams FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "exams_delete" ON exams;
CREATE POLICY "exams_delete" ON exams FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON exams TO authenticated;

-- 11. license_renewals
CREATE TABLE IF NOT EXISTS license_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  license_category text,
  documents_complete boolean NOT NULL DEFAULT false,
  doc_patente_scaduta boolean NOT NULL DEFAULT false,
  doc_carta_identita boolean NOT NULL DEFAULT false,
  doc_codice_fiscale boolean NOT NULL DEFAULT false,
  doc_fototessera boolean NOT NULL DEFAULT false,
  doc_pagopa boolean NOT NULL DEFAULT false,
  missing_docs_notes text,
  total_amount numeric(10,2),
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  medical_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE license_renewals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "renewals_select" ON license_renewals;
CREATE POLICY "renewals_select" ON license_renewals FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "renewals_insert" ON license_renewals;
CREATE POLICY "renewals_insert" ON license_renewals FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "renewals_update" ON license_renewals;
CREATE POLICY "renewals_update" ON license_renewals FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "renewals_delete" ON license_renewals;
CREATE POLICY "renewals_delete" ON license_renewals FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON license_renewals TO authenticated;

-- RPC: get_school_info() — pubblico (nome + logo, senza PIN)
CREATE OR REPLACE FUNCTION public.get_school_info()
RETURNS TABLE (school_name text, logo_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_name, logo_url FROM school_settings WHERE id = 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_school_info() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_school_info() TO anon, authenticated;

-- RPC: verify_classroom_pin(pin)
CREATE OR REPLACE FUNCTION public.verify_classroom_pin(pin text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM school_settings WHERE id = 1 AND classroom_pin = pin);
$$;
REVOKE EXECUTE ON FUNCTION public.verify_classroom_pin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_classroom_pin(text) TO anon, authenticated;

-- STORAGE: bucket school-assets (pubblico per lettura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "school_assets_read" ON storage.objects;
CREATE POLICY "school_assets_read" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'school-assets');

DROP POLICY IF EXISTS "school_assets_admin_write" ON storage.objects;
CREATE POLICY "school_assets_admin_write" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'school-assets' AND public.is_admin());

DROP POLICY IF EXISTS "school_assets_admin_update" ON storage.objects;
CREATE POLICY "school_assets_admin_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'school-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'school-assets' AND public.is_admin());

DROP POLICY IF EXISTS "school_assets_admin_delete" ON storage.objects;
CREATE POLICY "school_assets_admin_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'school-assets' AND public.is_admin());

-- SEED: 25 chapters
INSERT INTO chapters (number, title, visible_to_students) VALUES
(1, 'Norme sulla circolazione stradale', true),
(2, 'Segnaletica stradale — definizioni generali', true),
(3, 'Segnali verticali di pericolo', true),
(4, 'Segnali verticali di precedenza', true),
(5, 'Segnali verticali di divieto', true),
(6, 'Segnali verticali di obbligo', true),
(7, 'Segnali verticali di indicazione', true),
(8, 'Segnali orizzontali e segnali luminosi', true),
(9, 'Segnali complementari e di cantiere', true),
(10, 'Limiti di velocita e distanze di sicurezza', true),
(11, 'Sorpasso e relative manovre', false),
(12, 'Incroci, precedenze e right of way', false),
(13, 'Semafari e intersezioni regolate da segnaletica', false),
(14, 'Rotatorie e roundabout', false),
(15, 'Strade extraurbane principali e secondarie', false),
(16, 'Strade urbane e aree pedonali', false),
(17, 'Autostrade: norme e comportamenti', false),
(18, 'Infrazioni e sanzioni al codice della strada', false),
(19, 'Patenti: tipologie, revisioni e punteggio', false),
(20, 'Documenti di guida e obblighi amministrativi', false),
(21, 'Assicurazione RCA e responsabilita civile', false),
(22, 'Sicurezza: dispositivi di protezione e cinture', false),
(23, 'Primo soccorso e comportamento in caso di sinistro', false),
(24, 'Manutenzione del veicolo e controlli pre-partenza', false),
(25, 'Guida ecologica, emissioni e ambiente', false)
ON CONFLICT (number) DO NOTHING;

-- SEED: default settings
INSERT INTO school_settings (id, school_name, classroom_pin)
VALUES (1, 'Autoscuola Brutia', '1234')
ON CONFLICT (id) DO NOTHING;
