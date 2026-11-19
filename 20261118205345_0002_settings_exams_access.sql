/*
# Migrazione: Impostazioni, Esami Fissati, Credenziali Allievi

Aggiunge tabelle per personalizzazione autoscuola, calendario esami e accesso con credenziali.

## Nuove tabelle

1. `settings` — singola riga di configurazione autoscuola
   - id (int PK, default 1 — riga unica)
   - school_name (text, default 'Autoscuola')
   - logo_data_url (text, nullable — logo come data URL base64)
   - admin_email (text, default 'admin@autoscuola.it')
   - admin_password (text, default 'admin123')
   - created_at

2. `scheduled_exams` — esami fissati (teoria o pratica)
   - id (uuid PK)
   - student_id (FK students)
   - exam_type ('teoria' | 'pratica')
   - exam_date (date)
   - exam_time (text, nullable — formato HH:MM)
   - location (text, nullable — sede/luogo)
   - notes (text, nullable)
   - status ('fissato' | 'completato' | 'fallito' | 'rimandato', default 'fissato')
   - created_at

## Modifiche tabelle esistenti

- `students`: aggiunge `access_code` (text, nullable) e `access_pin` (text, nullable)
  per login allievo con credenziali reali.

## Sicurezza

- RLS abilitata su tutte le nuove tabelle.
- Politiche `TO anon, authenticated` con USING(true) / WITH CHECK(true) — demo single-tenant.
- Grant CRUD a `anon, authenticated`.

## Dati seed

- Riga settings di default.
- Codici allievo e PIN per tutti gli allievi demo esistenti.
- Alcuni esami fissati per demo.
*/

-- ============ settings ============
CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1,
  school_name text NOT NULL DEFAULT 'Autoscuola',
  logo_data_url text,
  admin_email text NOT NULL DEFAULT 'admin@autoscuola.it',
  admin_password text NOT NULL DEFAULT 'admin123',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON settings TO anon, authenticated;
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE TO anon, authenticated USING (true);

-- Seed default settings row
INSERT INTO settings (id, school_name) VALUES (1, 'Autoscuola La Mezza')
ON CONFLICT (id) DO NOTHING;

-- ============ scheduled_exams ============
CREATE TABLE IF NOT EXISTS scheduled_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_type text NOT NULL CHECK (exam_type IN ('teoria','pratica')),
  exam_date date NOT NULL,
  exam_time text,
  location text,
  notes text,
  status text NOT NULL DEFAULT 'fissato' CHECK (status IN ('fissato','completato','fallito','rimandato')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE scheduled_exams ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_exams TO anon, authenticated;
DROP POLICY IF EXISTS "anon_select_scheduled_exams" ON scheduled_exams;
CREATE POLICY "anon_select_scheduled_exams" ON scheduled_exams FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_scheduled_exams" ON scheduled_exams;
CREATE POLICY "anon_insert_scheduled_exams" ON scheduled_exams FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_scheduled_exams" ON scheduled_exams;
CREATE POLICY "anon_update_scheduled_exams" ON scheduled_exams FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_scheduled_exams" ON scheduled_exams;
CREATE POLICY "anon_delete_scheduled_exams" ON scheduled_exams FOR DELETE TO anon, authenticated USING (true);

-- ============ students: add access columns ============
ALTER TABLE students ADD COLUMN IF NOT EXISTS access_code text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS access_pin text;

-- ============ SEED: access codes for demo students ============
UPDATE students SET access_code = 'AR001', access_pin = '1234' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE students SET access_code = 'AR002', access_pin = '5678' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE students SET access_code = 'AR003', access_pin = '2468' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE students SET access_code = 'AR004', access_pin = '1357' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE students SET access_code = 'AR005', access_pin = '9876' WHERE id = '55555555-5555-5555-5555-555555555555';

-- ============ SEED: scheduled exams ============
-- Marco Rossi: esame teoria fissato tra 5 giorni
INSERT INTO scheduled_exams (student_id, exam_type, exam_date, exam_time, location, notes)
SELECT '11111111-1111-1111-1111-111111111111', 'teoria', CURRENT_DATE + 5, '09:00', 'Sede Centrale — Sala Esami', 'Secondo tentativo'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_exams WHERE student_id = '11111111-1111-1111-1111-111111111111' AND exam_type = 'teoria' AND status = 'fissato');

-- Giulia Bianchi: esame pratica fissato tra 10 giorni
INSERT INTO scheduled_exams (student_id, exam_type, exam_date, exam_time, location, notes)
SELECT '22222222-2222-2222-2222-222222222222', 'pratica', CURRENT_DATE + 10, '14:30', 'Sede Centrale — Ufficio Motorizzazione', 'Esame di guida'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_exams WHERE student_id = '22222222-2222-2222-2222-222222222222' AND exam_type = 'pratica' AND status = 'fissato');

-- Andrea Ferrari: esame pratica fissato tra 3 giorni
INSERT INTO scheduled_exams (student_id, exam_type, exam_date, exam_time, location, notes)
SELECT '55555555-5555-5555-5555-555555555555', 'pratica', CURRENT_DATE + 3, '10:00', 'Sede Centrale — Ufficio Motorizzazione', 'Esame di guida'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_exams WHERE student_id = '55555555-5555-5555-5555-555555555555' AND exam_type = 'pratica' AND status = 'fissato');

-- Luca Verdi: esame teoria fissato oggi
INSERT INTO scheduled_exams (student_id, exam_type, exam_date, exam_time, location, notes)
SELECT '33333333-3333-3333-3333-333333333333', 'teoria', CURRENT_DATE, '11:00', 'Sede Centrale — Sala Esami', 'Primo tentativo'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_exams WHERE student_id = '33333333-3333-3333-3333-333333333333' AND exam_type = 'teoria' AND status = 'fissato');
