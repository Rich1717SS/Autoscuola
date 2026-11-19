/*
# Autoscuola Gestionale — Schema iniziale

Crea il database completo per la gestione di un'autoscuola (Patente B):
allievi, 25 capitoli ministeriali, prove di teoria (regola delle 2 prove),
guide obbligatorie (6h: 2h autostrada, 2h extraurbana, 2h notturna),
contabilità, didattica e modalità aula.

## Tabelle nuove

1. `students` — anagrafica allievi
   - id (uuid PK)
   - name, phone, fiscal_code (text)
   - total_fee (numeric, nullable — NESSUNA tariffa fissa preimpostata)
   - status ('teoria' | 'pratica', default 'teoria')
   - foglio_rosa_date, foglio_rosa_expiry (date, nullable)
   - theory_attempts_used (int default 0 — contatore 2 prove)
   - theory_passed (bool default false)
   - missing_documents (text[] — elenco documenti mancanti)
   - created_at

2. `chapters` — 25 capitoli ministeriali Patente B
   - id (uuid PK)
   - number (1-25, unique)
   - title (text)
   - summary (text, nullable — riassunto scritto dall'admin)
   - visible_to_students (bool default false — switch visibilità da casa)
   - created_at

3. `chapter_images` — foto/schemi per capitolo (più immagini per capitolo)
   - id, chapter_id (FK), image_url (text), caption (text), created_at

4. `student_chapters` — checklist progresso capitoli per allievo
   - id, student_id (FK), chapter_id (FK), completed (bool), completed_at
   - UNIQUE(student_id, chapter_id)

5. `theory_exams` — registro tentativi esame teoria (max 2)
   - id, student_id (FK), attempt_number (1 o 2), exam_date (date),
     passed (bool), notes (text), created_at

6. `driving_lessons` — registro guide svolte
   - id, student_id (FK), lesson_date (date), duration_minutes (int),
     lesson_type ('autostrada' | 'extraurbana' | 'notturna' | 'normale'),
     notes (text — note istruttore), is_extra_paid (bool default false),
     created_at

7. `transactions` — movimenti contabili
   - id, student_id (FK), amount (numeric), kind ('acconto' | 'saldo' | 'extra'),
     description (text), movement_date (date), created_at

8. `classroom_attendance` — presenza modalità aula (proiettore)
   - id, chapter_id (FK), student_id (FK), session_date (date), present (bool)
   - UNIQUE(chapter_id, student_id, session_date)

## Sicurezza

- App demo senza autenticazione reale (selettore ruolo Demo Admin / Demo Allievo).
- RLS abilitata su tutte le tabelle.
- Politiche `TO anon, authenticated` con `USING (true)` / `WITH CHECK (true)`
  perché i dati sono intenzionalmente condivisi (demo single-tenant).
- Grant CRUD a `anon, authenticated` su ogni tabella.

## Dati seed

- 25 capitoli ministeriali pre-popolati.
- Allievi demo con stato teoria e pratica, progressi, guide, movimenti.
- IDs espliciti (UUID fissi) per riferimenti frontend stabili.
*/

-- ============ students ============
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  fiscal_code text,
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
GRANT SELECT, INSERT, UPDATE, DELETE ON students TO anon, authenticated;
DROP POLICY IF EXISTS "anon_select_students" ON students;
CREATE POLICY "anon_select_students" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE TO anon, authenticated USING (true);

-- ============ chapters ============
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  visible_to_students boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON chapters TO anon, authenticated;
DROP POLICY IF EXISTS "anon_select_chapters" ON chapters;
CREATE POLICY "anon_select_chapters" ON chapters FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_chapters" ON chapters;
CREATE POLICY "anon_insert_chapters" ON chapters FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_chapters" ON chapters;
CREATE POLICY "anon_update_chapters" ON chapters FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_chapters" ON chapters;
CREATE POLICY "anon_delete_chapters" ON chapters FOR DELETE TO anon, authenticated USING (true);

-- ============ chapter_images ============
CREATE TABLE IF NOT EXISTS chapter_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE chapter_images ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON chapter_images TO anon, authenticated;
DROP POLICY IF EXISTS "anon_select_chapter_images" ON chapter_images;
CREATE POLICY "anon_select_chapter_images" ON chapter_images FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_chapter_images" ON chapter_images;
CREATE POLICY "anon_insert_chapter_images" ON chapter_images FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_chapter_images" ON chapter_images;
CREATE POLICY "anon_update_chapter_images" ON chapter_images FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_chapter_images" ON chapter_images;
CREATE POLICY "anon_delete_chapter_images" ON chapter_images FOR DELETE TO anon, authenticated USING (true);

-- ============ student_chapters ============
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
GRANT SELECT, INSERT, UPDATE, DELETE ON student_chapters TO anon, authenticated;
DROP POLICY IF EXISTS "anon_select_student_chapters" ON student_chapters;
CREATE POLICY "anon_select_student_chapters" ON student_chapters FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_student_chapters" ON student_chapters;
CREATE POLICY "anon_insert_student_chapters" ON student_chapters FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_student_chapters" ON student_chapters;
CREATE POLICY "anon_update_student_chapters" ON student_chapters FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_student_chapters" ON student_chapters;
CREATE POLICY "anon_delete_student_chapters" ON student_chapters FOR DELETE TO anon, authenticated USING (true);

-- ============ theory_exams ============
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
GRANT SELECT, INSERT, UPDATE, DELETE ON theory_exams TO anon, authenticated;
DROP POLICY IF EXISTS "anon_select_theory_exams" ON theory_exams;
CREATE POLICY "anon_select_theory_exams" ON theory_exams FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_theory_exams" ON theory_exams;
CREATE POLICY "anon_insert_theory_exams" ON theory_exams FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_theory_exams" ON theory_exams;
CREATE POLICY "anon_update_theory_exams" ON theory_exams FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_theory_exams" ON theory_exams;
CREATE POLICY "anon_delete_theory_exams" ON theory_exams FOR DELETE TO anon, authenticated USING (true);

-- ============ driving_lessons ============
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
GRANT SELECT, INSERT, UPDATE, DELETE ON driving_lessons TO anon, authenticated;
DROP POLICY IF EXISTS "anon_select_driving_lessons" ON driving_lessons;
CREATE POLICY "anon_select_driving_lessons" ON driving_lessons FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_driving_lessons" ON driving_lessons;
CREATE POLICY "anon_insert_driving_lessons" ON driving_lessons FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_driving_lessons" ON driving_lessons;
CREATE POLICY "anon_update_driving_lessons" ON driving_lessons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_driving_lessons" ON driving_lessons;
CREATE POLICY "anon_delete_driving_lessons" ON driving_lessons FOR DELETE TO anon, authenticated USING (true);

-- ============ transactions ============
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  kind text NOT NULL DEFAULT 'acconto' CHECK (kind IN ('acconto','saldo','extra')),
  description text,
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO anon, authenticated;
DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE TO anon, authenticated USING (true);

-- ============ classroom_attendance ============
CREATE TABLE IF NOT EXISTS classroom_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  present boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, student_id, session_date)
);
ALTER TABLE classroom_attendance ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON classroom_attendance TO anon, authenticated;
DROP POLICY IF EXISTS "anon_select_classroom_attendance" ON classroom_attendance;
CREATE POLICY "anon_select_classroom_attendance" ON classroom_attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_classroom_attendance" ON classroom_attendance;
CREATE POLICY "anon_insert_classroom_attendance" ON classroom_attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_classroom_attendance" ON classroom_attendance;
CREATE POLICY "anon_update_classroom_attendance" ON classroom_attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_classroom_attendance" ON classroom_attendance;
CREATE POLICY "anon_delete_classroom_attendance" ON classroom_attendance FOR DELETE TO anon, authenticated USING (true);

-- ============ SEED: 25 capitoli ministeriali Patente B ============
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
(10, 'Limiti di velocità e distanze di sicurezza', true),
(11, 'Sorpasso e_relative manovre', true),
(12, 'Incroci, precedenze e_right of way', false),
(13, 'Semafari e intersezioni regolate da segnaletica', false),
(14, 'Rotatorie e_roundabout', false),
(15, 'Strade extraurbane principali e secondarie', false),
(16, 'Strade urbane e_area pedonali', false),
(17, 'Autostrade: norme e_comportamenti', false),
(18, 'Infrazioni e sanzioni al codice della strada', false),
(19, 'Patenti: tipologie, revisioni e punteggio', false),
(20, 'Documenti di guida e_obblighi amministrativi', false),
(21, 'Assicurazione RCA e responsabilità civile', false),
(22, 'Sicurezza: dispositivi di protezione e cinture', false),
(23, 'Primo soccorso e comportamento in caso di sinistro', false),
(24, 'Manutenzione del veicolo e controlli pre-partenza', false),
(25, 'Guida ecologica, emissioni e ambiente', false)
ON CONFLICT (number) DO NOTHING;

-- ============ SEED: Allievi demo ============
-- Demo Allievo (stato TEORIA): usato dal login "Demo Allievo"
INSERT INTO students (id, name, phone, fiscal_code, total_fee, status, theory_attempts_used, theory_passed, missing_documents, created_at) VALUES
('11111111-1111-1111-1111-111111111111',
 'Marco Rossi',
 '333 1234567',
 'RSSMRC01A01F205X',
 850.00,
 'teoria',
 1,
 false,
 '{"Certificato medico","Foto tessera"}',
 '2026-09-15')
ON CONFLICT (id) DO NOTHING;

-- Allievo in stato PRATICA (per testare scheda Guide)
INSERT INTO students (id, name, phone, fiscal_code, total_fee, status, foglio_rosa_date, foglio_rosa_expiry, theory_attempts_used, theory_passed, missing_documents, created_at) VALUES
('22222222-2222-2222-2222-222222222222',
 'Giulia Bianchi',
 '347 9876543',
 'BNCGLI02B42F839W',
 900.00,
 'pratica',
 '2026-10-01',
 '2027-10-01',
 1,
 true,
 '{}',
 '2026-08-01')
ON CONFLICT (id) DO NOTHING;

-- Altri allievi per la lista Admin
INSERT INTO students (id, name, phone, fiscal_code, total_fee, status, theory_attempts_used, theory_passed, missing_documents, created_at) VALUES
('33333333-3333-3333-3333-333333333333',
 'Luca Verdi',
 '320 5557890',
 'VRDLCA03C10D612Y',
 850.00,
 'teoria',
 0,
 false,
 '{"Certificato medico"}',
 '2026-11-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO students (id, name, phone, fiscal_code, total_fee, status, theory_attempts_used, theory_passed, missing_documents, created_at) VALUES
('44444444-4444-4444-4444-444444444444',
 'Sofia Romano',
 '348 2223344',
 'RMNSFO04D60F205Z',
 880.00,
 'teoria',
 2,
 false,
 '{}',
 '2026-10-10')
ON CONFLICT (id) DO NOTHING;

INSERT INTO students (id, name, phone, fiscal_code, total_fee, status, foglio_rosa_date, foglio_rosa_expiry, theory_attempts_used, theory_passed, missing_documents, created_at) VALUES
('55555555-5555-5555-5555-555555555555',
 'Andrea Ferrari',
 '392 7778899',
 'FRRNDR05E09L219V',
 920.00,
 'pratica',
 '2026-09-20',
 '2027-09-20',
 2,
 true,
 '{}',
 '2026-07-15')
ON CONFLICT (id) DO NOTHING;

-- ============ SEED: Checklist capitoli per Marco Rossi (demo teoria) ============
-- Mettiamo completati i capitoli 1-9, il resto da fare
INSERT INTO student_chapters (student_id, chapter_id, completed, completed_at)
SELECT '11111111-1111-1111-1111-111111111111', c.id, true, now()
FROM chapters c WHERE c.number <= 9
ON CONFLICT (student_id, chapter_id) DO NOTHING;

INSERT INTO student_chapters (student_id, chapter_id, completed)
SELECT '11111111-1111-1111-1111-111111111111', c.id, false
FROM chapters c WHERE c.number > 9
ON CONFLICT (student_id, chapter_id) DO NOTHING;

-- Per Giulia (pratica) tutti i capitoli completati
INSERT INTO student_chapters (student_id, chapter_id, completed, completed_at)
SELECT '22222222-2222-2222-2222-222222222222', c.id, true, now()
FROM chapters c
ON CONFLICT (student_id, chapter_id) DO NOTHING;

-- Per Luca (teoria) capitoli 1-3 completati
INSERT INTO student_chapters (student_id, chapter_id, completed, completed_at)
SELECT '33333333-3333-3333-3333-333333333333', c.id, true, now()
FROM chapters c WHERE c.number <= 3
ON CONFLICT (student_id, chapter_id) DO NOTHING;

INSERT INTO student_chapters (student_id, chapter_id, completed)
SELECT '33333333-3333-3333-3333-333333333333', c.id, false
FROM chapters c WHERE c.number > 3
ON CONFLICT (student_id, chapter_id) DO NOTHING;

-- Sofia (2 tentativi falliti): capitoli 1-15 completati
INSERT INTO student_chapters (student_id, chapter_id, completed, completed_at)
SELECT '44444444-4444-4444-4444-444444444444', c.id, true, now()
FROM chapters c WHERE c.number <= 15
ON CONFLICT (student_id, chapter_id) DO NOTHING;

INSERT INTO student_chapters (student_id, chapter_id, completed)
SELECT '44444444-4444-4444-4444-444444444444', c.id, false
FROM chapters c WHERE c.number > 15
ON CONFLICT (student_id, chapter_id) DO NOTHING;

-- Andrea (pratica) tutti completati
INSERT INTO student_chapters (student_id, chapter_id, completed, completed_at)
SELECT '55555555-5555-5555-5555-555555555555', c.id, true, now()
FROM chapters c
ON CONFLICT (student_id, chapter_id) DO NOTHING;

-- ============ SEED: Prove teoria ============
-- Marco: 1 tentativo fallito (usa 1 di 2 prove)
INSERT INTO theory_exams (student_id, attempt_number, exam_date, passed, notes)
SELECT '11111111-1111-1111-1111-111111111111', 1, '2026-11-05', false, '5 errori, da ripetere'
WHERE NOT EXISTS (SELECT 1 FROM theory_exams WHERE student_id='11111111-1111-1111-1111-111111111111' AND attempt_number=1);

-- Giulia: 1 tentativo fallito, poi 2 superato
INSERT INTO theory_exams (student_id, attempt_number, exam_date, passed, notes)
SELECT '22222222-2222-2222-2222-222222222222', 1, '2026-09-10', false, '7 errori'
WHERE NOT EXISTS (SELECT 1 FROM theory_exams WHERE student_id='22222222-2222-2222-2222-222222222222' AND attempt_number=1);

INSERT INTO theory_exams (student_id, attempt_number, exam_date, passed, notes)
SELECT '22222222-2222-2222-2222-222222222222', 2, '2026-09-25', true, 'Esame superato con 2 errori'
WHERE NOT EXISTS (SELECT 1 FROM theory_exams WHERE student_id='22222222-2222-2222-2222-222222222222' AND attempt_number=2);

-- Sofia: 2 tentativi falliti (caso limite: nuova iscrizione necessaria)
INSERT INTO theory_exams (student_id, attempt_number, exam_date, passed, notes)
SELECT '44444444-4444-4444-4444-444444444444', 1, '2026-10-20', false, '8 errori'
WHERE NOT EXISTS (SELECT 1 FROM theory_exams WHERE student_id='44444444-4444-4444-4444-444444444444' AND attempt_number=1);

INSERT INTO theory_exams (student_id, attempt_number, exam_date, passed, notes)
SELECT '44444444-4444-4444-4444-444444444444', 2, '2026-11-08', false, '6 errori — esauriti i tentativi, necessaria nuova iscrizione'
WHERE NOT EXISTS (SELECT 1 FROM theory_exams WHERE student_id='44444444-4444-4444-4444-444444444444' AND attempt_number=2);

-- Andrea: superato al primo tentativo
INSERT INTO theory_exams (student_id, attempt_number, exam_date, passed, notes)
SELECT '55555555-5555-5555-5555-555555555555', 1, '2026-09-01', true, 'Esame superato con 1 errore'
WHERE NOT EXISTS (SELECT 1 FROM theory_exams WHERE student_id='55555555-5555-5555-5555-555555555555' AND attempt_number=1);

-- ============ SEED: Guide (per Giulia e Andrea, stato pratica) ============
-- Giulia: 1h autostrada, 1h extraurbana, 0h notturna (parziale)
INSERT INTO driving_lessons (student_id, lesson_date, duration_minutes, lesson_type, notes, is_extra_paid)
SELECT '22222222-2222-2222-2222-222222222222', '2026-10-05', 60, 'autostrada', 'Buona padronanza, sorpassi corretti', false
WHERE NOT EXISTS (SELECT 1 FROM driving_lessons WHERE student_id='22222222-2222-2222-2222-222222222222' AND lesson_date='2026-10-05');

INSERT INTO driving_lessons (student_id, lesson_date, duration_minutes, lesson_type, notes, is_extra_paid)
SELECT '22222222-2222-2222-2222-222222222222', '2026-10-12', 60, 'extraurbana', 'Attenzione alle distanze di sicurezza', false
WHERE NOT EXISTS (SELECT 1 FROM driving_lessons WHERE student_id='22222222-2222-2222-2222-222222222222' AND lesson_date='2026-10-12');

INSERT INTO driving_lessons (student_id, lesson_date, duration_minutes, lesson_type, notes, is_extra_paid)
SELECT '22222222-2222-2222-2222-222222222222', '2026-10-19', 60, 'normale', 'Esercitazione in centro urbano', false
WHERE NOT EXISTS (SELECT 1 FROM driving_lessons WHERE student_id='22222222-2222-2222-2222-222222222222' AND lesson_date='2026-10-19');

INSERT INTO driving_lessons (student_id, lesson_date, duration_minutes, lesson_type, notes, is_extra_paid)
SELECT '22222222-2222-2222-2222-222222222222', '2026-11-02', 30, 'normale', 'Lezione extra per parcheggio', true
WHERE NOT EXISTS (SELECT 1 FROM driving_lessons WHERE student_id='22222222-2222-2222-2222-222222222222' AND lesson_date='2026-11-02');

-- Andrea: 2h autostrada, 2h extraurbana, 1h notturna (quasi completo)
INSERT INTO driving_lessons (student_id, lesson_date, duration_minutes, lesson_type, notes, is_extra_paid)
SELECT '55555555-5555-5555-5555-555555555555', '2026-09-25', 60, 'autostrada', 'Ottimo, guida fluida', false
WHERE NOT EXISTS (SELECT 1 FROM driving_lessons WHERE student_id='55555555-5555-5555-5555-555555555555' AND lesson_date='2026-09-25');

INSERT INTO driving_lessons (student_id, lesson_date, duration_minutes, lesson_type, notes, is_extra_paid)
SELECT '55555555-5555-5555-5555-555555555555', '2026-09-28', 60, 'autostrada', 'Casse autostradali, merge corretto', false
WHERE NOT EXISTS (SELECT 1 FROM driving_lessons WHERE student_id='55555555-5555-5555-5555-555555555555' AND lesson_date='2026-09-28');

INSERT INTO driving_lessons (student_id, lesson_date, duration_minutes, lesson_type, notes, is_extra_paid)
SELECT '55555555-5555-5555-5555-555555555555', '2026-10-03', 60, 'extraurbana', 'Strade provinciali, curva controcurva', false
WHERE NOT EXISTS (SELECT 1 FROM driving_lessons WHERE student_id='55555555-5555-5555-5555-555555555555' AND lesson_date='2026-10-03');

INSERT INTO driving_lessons (student_id, lesson_date, duration_minutes, lesson_type, notes, is_extra_paid)
SELECT '55555555-5555-5555-5555-555555555555', '2026-10-07', 60, 'extraurbana', 'Migliorato, attenzione agli incroci', false
WHERE NOT EXISTS (SELECT 1 FROM driving_lessons WHERE student_id='55555555-5555-5555-5555-555555555555' AND lesson_date='2026-10-07');

INSERT INTO driving_lessons (student_id, lesson_date, duration_minutes, lesson_type, notes, is_extra_paid)
SELECT '55555555-5555-5555-5555-555555555555', '2026-10-14', 60, 'notturna', 'Guida notturna, abbaglianti corretti', false
WHERE NOT EXISTS (SELECT 1 FROM driving_lessons WHERE student_id='55555555-5555-5555-5555-555555555555' AND lesson_date='2026-10-14');

-- ============ SEED: Movimenti contabili ============
-- Marco: quota 850, acconto 300 versato
INSERT INTO transactions (student_id, amount, kind, description, movement_date)
SELECT '11111111-1111-1111-1111-111111111111', 300.00, 'acconto', 'Acconto iniziale iscrizione', '2026-09-15'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE student_id='11111111-1111-1111-1111-111111111111' AND movement_date='2026-09-15');

INSERT INTO transactions (student_id, amount, kind, description, movement_date)
SELECT '11111111-1111-1111-1111-111111111111', 100.00, 'acconto', 'Secondo versamento', '2026-10-15'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE student_id='11111111-1111-1111-1111-111111111111' AND movement_date='2026-10-15');

-- Giulia: quota 900, 700 versato
INSERT INTO transactions (student_id, amount, kind, description, movement_date)
SELECT '22222222-2222-2222-2222-222222222222', 400.00, 'acconto', 'Acconto iniziale', '2026-08-01'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE student_id='22222222-2222-2222-2222-222222222222' AND movement_date='2026-08-01');

INSERT INTO transactions (student_id, amount, kind, description, movement_date)
SELECT '22222222-2222-2222-2222-222222222222', 300.00, 'acconto', 'Versamento intermedio', '2026-09-01'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE student_id='22222222-2222-2222-2222-222222222222' AND movement_date='2026-09-01');

INSERT INTO transactions (student_id, amount, kind, description, movement_date)
SELECT '22222222-2222-2222-2222-222222222222', 50.00, 'extra', 'Lezione extra parcheggio', '2026-11-02'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE student_id='22222222-2222-2222-2222-222222222222' AND movement_date='2026-11-02');

-- Luca: quota 850, 200 versato
INSERT INTO transactions (student_id, amount, kind, description, movement_date)
SELECT '33333333-3333-3333-3333-333333333333', 200.00, 'acconto', 'Acconto', '2026-11-01'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE student_id='33333333-3333-3333-3333-333333333333' AND movement_date='2026-11-01');

-- Sofia: quota 880, 880 versato (saldata)
INSERT INTO transactions (student_id, amount, kind, description, movement_date)
SELECT '44444444-4444-4444-4444-444444444444', 500.00, 'acconto', 'Acconto', '2026-10-10'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE student_id='44444444-4444-4444-4444-444444444444' AND movement_date='2026-10-10');

INSERT INTO transactions (student_id, amount, kind, description, movement_date)
SELECT '44444444-4444-4444-4444-444444444444', 380.00, 'saldo', 'Saldo finale', '2026-10-25'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE student_id='44444444-4444-4444-4444-444444444444' AND movement_date='2026-10-25');

-- Andrea: quota 920, 600 versato
INSERT INTO transactions (student_id, amount, kind, description, movement_date)
SELECT '55555555-5555-5555-5555-555555555555', 400.00, 'acconto', 'Acconto', '2026-07-15'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE student_id='55555555-5555-5555-5555-555555555555' AND movement_date='2026-07-15');

INSERT INTO transactions (student_id, amount, kind, description, movement_date)
SELECT '55555555-5555-5555-5555-555555555555', 200.00, 'acconto', 'Versamento', '2026-08-15'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE student_id='55555555-5555-5555-5555-555555555555' AND movement_date='2026-08-15');
