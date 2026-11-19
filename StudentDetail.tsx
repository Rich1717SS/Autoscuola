import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft, BookOpen, Car, Wallet, CheckCircle2, XCircle, Plus,
  Loader2, Calendar, AlertTriangle, Copy, Trash2, Clock, Moon,
  Route, Trees, FileText, GraduationCap, KeyRound, Mail, MessageCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type {
  Student, Chapter, StudentChapter, TheoryExam, DrivingLesson, Transaction,
  LessonType, ScheduledExam,
} from "@/lib/types";
import { formatEuro, formatDate, formatDateLong, todayISO, addMonths } from "@/lib/format";
import { Modal, Badge, ProgressBar, ConfirmDialog } from "@/components/ui";

interface StudentDetailProps {
  studentId: string;
  onBack: () => void;
  onChanged: () => void;
}

type Tab = "percorso" | "guide" | "contabilita" | "accesso";

export function StudentDetail({ studentId, onBack, onChanged }: StudentDetailProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [studentChapters, setStudentChapters] = useState<StudentChapter[]>([]);
  const [exams, setExams] = useState<TheoryExam[]>([]);
  const [lessons, setLessons] = useState<DrivingLesson[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<Tab>("percorso");
  const [scheduledExams, setScheduledExams] = useState<ScheduledExam[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [sRes, cRes, scRes, eRes, lRes, tRes] = await Promise.all([
      supabase.from("students").select("*").eq("id", studentId).maybeSingle(),
      supabase.from("chapters").select("*").order("number"),
      supabase.from("student_chapters").select("*").eq("student_id", studentId),
      supabase.from("theory_exams").select("*").eq("student_id", studentId).order("attempt_number"),
      supabase.from("driving_lessons").select("*").eq("student_id", studentId).order("lesson_date", { ascending: false }),
      supabase.from("transactions").select("*").eq("student_id", studentId).order("movement_date", { ascending: false }),
      supabase.from("scheduled_exams").select("*").eq("student_id", studentId).order("exam_date", { ascending: true }),
    ]);

    if (seRes.data) setScheduledExams(seRes.data as ScheduledExam[]);

    if (sRes.data) setStudent(sRes.data as Student);
    if (cRes.data) setChapters(cRes.data as Chapter[]);
    if (scRes.data) setStudentChapters(scRes.data as StudentChapter[]);
    if (eRes.data) setExams(eRes.data as TheoryExam[]);
    if (lRes.data) setLessons(lRes.data as DrivingLesson[]);
    if (tRes.data) setTransactions(tRes.data as Transaction[]);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Allievo non trovato</p>
        <button onClick={onBack} className="mt-4 text-blue-600 font-medium">Torna indietro</button>
      </div>
    );
  }

  const completedChapters = studentChapters.filter((sc) => sc.completed).length;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Torna alla lista
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white ${
              student.status === "teoria" ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-emerald-400 to-emerald-600"
            }`}>
              {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge color={student.status === "teoria" ? "amber" : "emerald"}>
                  {student.status === "teoria" ? "Fase Teoria" : "Fase Pratica"}
                </Badge>
                {student.theory_passed && (
                  <Badge color="emerald">
                    <CheckCircle2 className="w-3 h-3" /> Teoria superata
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-6">
            <div>
              <p className="text-xs text-slate-400">Capitoli</p>
              <p className="font-bold text-slate-900">{completedChapters}/25</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Prove teoria</p>
              <p className="font-bold text-slate-900">{student.theory_attempts_used}/2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 overflow-x-auto">
        <TabButton active={tab === "percorso"} onClick={() => setTab("percorso")} icon={BookOpen} label="Percorso" />
        <TabButton active={tab === "guide"} onClick={() => setTab("guide")} icon={Car} label="Guide" disabled={student.status !== "pratica"} />
        <TabButton active={tab === "contabilita"} onClick={() => setTab("contabilita")} icon={Wallet} label="Contabilità" />
        <TabButton active={tab === "accesso"} onClick={() => setTab("accesso")} icon={KeyRound} label="Accesso" />
      </div>

      {tab === "percorso" && (
        <PercorsoTab
          student={student}
          chapters={chapters}
          studentChapters={studentChapters}
          exams={exams}
          onChanged={loadAll}
          onStudentChanged={onChanged}
        />
      )}
      {tab === "guide" && student.status === "pratica" && (
        <GuideTab student={student} lessons={lessons} onChanged={loadAll} />
      )}
      {tab === "contabilita" && (
        <ContabilitaTab student={student} transactions={transactions} onChanged={loadAll} />
      )}
      {tab === "accesso" && (
        <AccessoTab student={student} scheduledExams={scheduledExams} onChanged={loadAll} />
      )}
    </div>
  );
}

function TabButton({
  active, onClick, icon: Icon, label, disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof BookOpen;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all min-w-fit ${
        active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// =================== TAB PERCORSO ===================
function PercorsoTab({
  student, chapters, studentChapters, exams, onChanged, onStudentChanged,
}: {
  student: Student;
  chapters: Chapter[];
  studentChapters: StudentChapter[];
  exams: TheoryExam[];
  onChanged: () => void;
  onStudentChanged: () => void;
}) {
  const [showPassModal, setShowPassModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [foglioRosaDate, setFoglioRosaDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  const completedCount = studentChapters.filter((sc) => sc.completed).length;
  const attemptsUsed = student.theory_attempts_used;
  const attemptsLeft = 2 - attemptsUsed;
  const bothFailed = attemptsUsed >= 2 && !student.theory_passed;

  async function toggleChapter(chapterId: string, currentCompleted: boolean) {
    const existing = studentChapters.find((sc) => sc.chapter_id === chapterId);
    if (existing) {
      await supabase
        .from("student_chapters")
        .update({ completed: !currentCompleted, completed_at: !currentCompleted ? new Date().toISOString() : null })
        .eq("id", existing.id);
    } else {
      await supabase.from("student_chapters").insert({
        student_id: student.id,
        chapter_id: chapterId,
        completed: true,
        completed_at: new Date().toISOString(),
      });
    }
    onChanged();
  }

  async function markTheoryPassed() {
    setSaving(true);
    const expiry = addMonths(foglioRosaDate, 12);

    // Update student
    await supabase
      .from("students")
      .update({
        theory_passed: true,
        status: "pratica",
        foglio_rosa_date: foglioRosaDate,
        foglio_rosa_expiry: expiry,
      })
      .eq("id", student.id);

    // Record the exam attempt if not already at 2
    const nextAttempt = Math.min(attemptsUsed + 1, 2);
    const alreadyHas = exams.find((e) => e.attempt_number === nextAttempt);
    if (!alreadyHas) {
      await supabase.from("theory_exams").insert({
        student_id: student.id,
        attempt_number: nextAttempt,
        exam_date: foglioRosaDate,
        passed: true,
        notes: "Esame teoria superato",
      });
    }

    setSaving(false);
    setShowPassModal(false);
    onChanged();
    onStudentChanged();
  }

  async function markTheoryFailed() {
    setSaving(true);
    const nextAttempt = attemptsUsed + 1;
    if (nextAttempt > 2) {
      setSaving(false);
      return;
    }

    // Record failed exam
    const alreadyHas = exams.find((e) => e.attempt_number === nextAttempt);
    if (!alreadyHas) {
      await supabase.from("theory_exams").insert({
        student_id: student.id,
        attempt_number: nextAttempt,
        exam_date: todayISO(),
        passed: false,
        notes: "Esame non superato",
      });
    }

    // Update attempts counter
    const newAttemptsUsed = nextAttempt;
    await supabase
      .from("students")
      .update({ theory_attempts_used: newAttemptsUsed })
      .eq("id", student.id);

    setSaving(false);
    setShowFailModal(false);
    onChanged();
    onStudentChanged();
  }

  return (
    <div className="space-y-5">
      {/* Theory exam status card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Esame di Teoria</h2>
            <p className="text-sm text-slate-500">Regola delle 2 prove</p>
          </div>
        </div>

        {/* Attempt dots */}
        <div className="flex items-center gap-3 mb-4">
          {[1, 2].map((n) => {
            const exam = exams.find((e) => e.attempt_number === n);
            return (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  exam ? (exam.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")
                       : "bg-slate-100 text-slate-400"
                }`}>
                  {exam ? (exam.passed ? "✓" : "✗") : n}
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-700">Prova {n}</p>
                  {exam && <p className="text-slate-400">{formatDate(exam.exam_date)}</p>}
                </div>
              </div>
            );
          })}
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-400">Tentativi rimasti</p>
            <p className="text-2xl font-bold text-slate-900">{attemptsLeft}</p>
          </div>
        </div>

        {/* Alert: both attempts failed → nuova iscrizione */}
        {bothFailed && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900 text-sm">Esauriti i 2 tentativi disponibili</p>
              <p className="text-rose-700 text-sm mt-0.5">
                È necessaria una <strong>nuova iscrizione</strong> all'esame di teoria.
                L'allievo deve rifare l'iscrizione per avere altri 2 tentativi.
              </p>
              <button
                onClick={async () => {
                  await supabase.from("students").update({ theory_attempts_used: 0 }).eq("id", student.id);
                  onChanged();
                  onStudentChanged();
                }}
                className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuova Iscrizione (reset prove)
              </button>
            </div>
          </div>
        )}

        {/* Alert: 1 attempt failed, 1 left */}
        {attemptsUsed === 1 && !student.theory_passed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">Prima prova non superata</p>
              <p className="text-amber-700 text-sm mt-0.5">
                L'allievo ha ancora <strong>1 tentativo</strong> disponibile. Al secondo fallimento sarà necessaria una nuova iscrizione.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!student.theory_passed && !bothFailed && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowPassModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-5 h-5" />
              Esame Teoria Superato
            </button>
            <button
              onClick={() => setShowFailModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-rose-200 text-rose-600 font-semibold text-sm hover:bg-rose-50 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Esame Non Superato
            </button>
          </div>
        )}

        {student.theory_passed && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-900 text-sm">Teoria superata e archiviata</p>
              <p className="text-emerald-700 text-sm">
                Foglio Rosa rilasciato il {formatDateLong(student.foglio_rosa_date)} — scade il {formatDateLong(student.foglio_rosa_expiry)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chapter checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">25 Capitoli Ministeriali</h2>
              <p className="text-sm text-slate-500">{completedCount}/25 completati</p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#ede9fe" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="28" fill="none" stroke="#7c3aed" strokeWidth="6"
                  strokeDasharray={`${(completedCount / 25) * 176} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-violet-700">
                {Math.round((completedCount / 25) * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {chapters.map((ch) => {
            const sc = studentChapters.find((s) => s.chapter_id === ch.id);
            const completed = sc?.completed ?? false;
            return (
              <button
                key={ch.id}
                onClick={() => toggleChapter(ch.id, completed)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  completed
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center transition-colors ${
                  completed ? "bg-emerald-500" : "bg-slate-100"
                }`}>
                  {completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${completed ? "text-emerald-900" : "text-slate-700"}`}>
                    <span className="text-slate-400 mr-1.5">{ch.number}.</span>
                    {ch.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <Modal open={showPassModal} onClose={() => setShowPassModal(false)} title="Esame Teoria Superato">
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">
              Verrà registrato il superamento della teoria, calcolata la scadenza del Foglio Rosa
              (12 mesi) e attivata la scheda Guide per l'allievo.
            </p>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">
              Data rilascio Foglio Rosa
            </span>
            <input
              type="date"
              value={foglioRosaDate}
              onChange={(e) => setFoglioRosaDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
            <Calendar className="w-4 h-4 inline mr-1.5" />
            Scadenza Foglio Rosa: <strong>{formatDateLong(addMonths(foglioRosaDate, 12))}</strong>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowPassModal(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              Annulla
            </button>
            <button
              onClick={markTheoryPassed}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Conferma e Attiva Guide
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showFailModal}
        title="Esame Non Superato"
        message={
          attemptsUsed === 0
            ? "Registra il primo tentativo come non superato. L'allievo avrà ancora 1 tentativo."
            : "Attenzione: questo è il secondo tentativo. Al fallimento sarà necessaria una nuova iscrizione all'esame."
        }
        confirmLabel="Registra fallimento"
        danger
        onConfirm={markTheoryFailed}
        onCancel={() => setShowFailModal(false)}
      />
    </div>
  );
}

// =================== TAB GUIDE ===================
function GuideTab({
  student, lessons, onChanged,
}: {
  student: Student;
  lessons: DrivingLesson[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);

  const autostradaMin = lessons.filter((l) => l.lesson_type === "autostrada").reduce((s, l) => s + l.duration_minutes, 0);
  const extraurbanaMin = lessons.filter((l) => l.lesson_type === "extraurbana").reduce((s, l) => s + l.duration_minutes, 0);
  const notturnaMin = lessons.filter((l) => l.lesson_type === "notturna").reduce((s, l) => s + l.duration_minutes, 0);

  async function addQuickLesson(type: LessonType, minutes: number) {
    await supabase.from("driving_lessons").insert({
      student_id: student.id,
      lesson_date: todayISO(),
      duration_minutes: minutes,
      lesson_type: type,
      notes: null,
      is_extra_paid: false,
    });
    onChanged();
  }

  return (
    <div className="space-y-5">
      {/* Foglio Rosa banner */}
      {student.foglio_rosa_date && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Foglio Rosa attivo</p>
              <p className="text-blue-100 text-sm">
                Rilasciato il {formatDateLong(student.foglio_rosa_date)} · Scade il {formatDateLong(student.foglio_rosa_expiry)}
              </p>
            </div>
            <Badge color="amber">Patente B</Badge>
          </div>
        </div>
      )}

      {/* 3 progress bars for 6h obligatory */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="font-bold text-slate-900 mb-1">6 Ore Obbligatorie</h2>
        <p className="text-sm text-slate-500 mb-5">2h autostrada · 2h extraurbana · 2h notturna</p>

        <div className="space-y-5">
          <ObligatoryBar
            icon={Route}
            label="Autostrada"
            minutes={autostradaMin}
            target={120}
            color="blue"
            onAdd30={() => addQuickLesson("autostrada", 30)}
            onAdd60={() => addQuickLesson("autostrada", 60)}
          />
          <ObligatoryBar
            icon={Trees}
            label="Extraurbana"
            minutes={extraurbanaMin}
            target={120}
            color="emerald"
            onAdd30={() => addQuickLesson("extraurbana", 30)}
            onAdd60={() => addQuickLesson("extraurbana", 60)}
          />
          <ObligatoryBar
            icon={Moon}
            label="Notturna"
            minutes={notturnaMin}
            target={120}
            color="violet"
            onAdd30={() => addQuickLesson("notturna", 30)}
            onAdd60={() => addQuickLesson("notturna", 60)}
          />
        </div>
      </div>

      {/* Driving lessons registry */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Car className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Registro Guide</h2>
              <p className="text-sm text-slate-500">{lessons.length} lezioni registrate</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Aggiungi
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-10">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Nessuna guida registrata</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  lesson.lesson_type === "autostrada" ? "bg-blue-50 text-blue-600" :
                  lesson.lesson_type === "extraurbana" ? "bg-emerald-50 text-emerald-600" :
                  lesson.lesson_type === "notturna" ? "bg-violet-50 text-violet-600" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {lesson.lesson_type === "autostrada" ? <Route className="w-5 h-5" /> :
                   lesson.lesson_type === "extraurbana" ? <Trees className="w-5 h-5" /> :
                   lesson.lesson_type === "notturna" ? <Moon className="w-5 h-5" /> :
                   <Car className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-slate-900 capitalize">{lesson.lesson_type}</p>
                    {lesson.is_extra_paid && <Badge color="amber" size="sm">Extra a pagamento</Badge>}
                  </div>
                  <p className="text-xs text-slate-400">
                    {formatDate(lesson.lesson_date)} · {lesson.duration_minutes} min
                    {lesson.notes && ` · ${lesson.notes}`}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await supabase.from("driving_lessons").delete().eq("id", lesson.id);
                    onChanged();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddLessonModal open={showAdd} onClose={() => setShowAdd(false)} student={student} onChanged={onChanged} />
    </div>
  );
}

function ObligatoryBar({
  icon: Icon, label, minutes, target, color, onAdd30, onAdd60,
}: {
  icon: typeof Car;
  label: string;
  minutes: number;
  target: number;
  color: "blue" | "emerald" | "violet";
  onAdd30: () => void;
  onAdd60: () => void;
}) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="ml-auto text-sm font-bold text-slate-900">
          {hours}h{mins > 0 ? ` ${mins}m` : ""} / {target / 60}h
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar value={minutes} max={target} color={color} unit="m" />
        </div>
        <button
          onClick={onAdd30}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap"
        >
          +30m
        </button>
        <button
          onClick={onAdd60}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          +1h
        </button>
      </div>
    </div>
  );
}

function AddLessonModal({
  open, onClose, student, onChanged,
}: {
  open: boolean;
  onClose: () => void;
  student: Student;
  onChanged: () => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [duration, setDuration] = useState("60");
  const [type, setType] = useState<LessonType>("normale");
  const [notes, setNotes] = useState("");
  const [isExtra, setIsExtra] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("driving_lessons").insert({
      student_id: student.id,
      lesson_date: date,
      duration_minutes: parseInt(duration) || 60,
      lesson_type: type,
      notes: notes.trim() || null,
      is_extra_paid: isExtra,
    });
    setSaving(false);
    setNotes("");
    setIsExtra(false);
    onClose();
    onChanged();
  }

  return (
    <Modal open={open} onClose={onClose} title="Aggiungi Guida">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Data</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Durata (min)</span>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value as LessonType)} className={inputCls}>
            <option value="normale">Normale</option>
            <option value="autostrada">Autostrada</option>
            <option value="extraurbana">Extraurbana</option>
            <option value="notturna">Notturna</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Note istruttore</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Note sulla lezione..." />
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isExtra} onChange={(e) => setIsExtra(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
          <span className="text-sm text-slate-700">Lezione extra a pagamento</span>
        </label>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
            Annulla
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salva
          </button>
        </div>
      </form>
    </Modal>
  );
}

// =================== TAB CONTABILITÀ ===================
function ContabilitaTab({
  student, transactions, onChanged,
}: {
  student: Student;
  transactions: Transaction[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);

  const versato = transactions
    .filter((t) => t.kind === "acconto" || t.kind === "saldo")
    .reduce((s, t) => s + t.amount, 0);
  const extra = transactions
    .filter((t) => t.kind === "extra")
    .reduce((s, t) => s + t.amount, 0);
  const totale = student.total_fee ?? 0;
  const saldoResiduo = totale - versato;

  function copyWhatsApp() {
    const lines = [
      `*Riepilogo Contabile — ${student.name}*`,
      ``,
      `Quota totale: ${formatEuro(totale)}`,
      `Versato: ${formatEuro(versato)}`,
      `Extra: ${formatEuro(extra)}`,
      `Saldo residuo: ${formatEuro(saldoResiduo)}`,
      ``,
      `*Storico movimenti:*`,
      ...transactions.map((t) =>
        `• ${formatDate(t.movement_date)} — ${t.kind.toUpperCase()}: ${formatEuro(t.amount)}${t.description ? ` (${t.description})` : ""}`
      ),
    ];
    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FinanceCard label="Quota Totale" value={formatEuro(totale)} color="slate" />
        <FinanceCard label="Versato" value={formatEuro(versato)} color="emerald" />
        <FinanceCard label="Extra" value={formatEuro(extra)} color="amber" />
        <FinanceCard label="Saldo Residuo" value={formatEuro(saldoResiduo)} color={saldoResiduo > 0 ? "rose" : "emerald"} />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Aggiungi Movimento
        </button>
        <button
          onClick={copyWhatsApp}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors border border-emerald-200"
        >
          <Copy className="w-4 h-4" />
          Copia Riepilogo WhatsApp
        </button>
      </div>

      {/* Transactions history */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="font-bold text-slate-900 mb-4">Storico Movimenti</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-10">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Nessun movimento registrato</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  t.kind === "acconto" ? "bg-blue-50 text-blue-600" :
                  t.kind === "saldo" ? "bg-emerald-50 text-emerald-600" :
                  "bg-amber-50 text-amber-600"
                }`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900">
                    {t.description ?? t.kind}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(t.movement_date)} · <span className="capitalize">{t.kind}</span>
                  </p>
                </div>
                <span className={`font-bold text-sm ${t.kind === "extra" ? "text-amber-600" : "text-emerald-600"}`}>
                  +{formatEuro(t.amount)}
                </span>
                <button
                  onClick={async () => {
                    await supabase.from("transactions").delete().eq("id", t.id);
                    onChanged();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTransactionModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        student={student}
        onChanged={onChanged}
      />
    </div>
  );
}

function FinanceCard({
  label, value, color,
}: {
  label: string;
  value: string;
  color: "slate" | "emerald" | "amber" | "rose";
}) {
  const colorMap = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      <p className={`text-lg font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}

function AddTransactionModal({
  open, onClose, student, onChanged,
}: {
  open: boolean;
  onClose: () => void;
  student: Student;
  onChanged: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"acconto" | "saldo" | "extra">("acconto");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    await supabase.from("transactions").insert({
      student_id: student.id,
      amount: amt,
      kind,
      description: description.trim() || null,
      movement_date: date,
    });
    setSaving(false);
    setAmount("");
    setDescription("");
    onClose();
    onChanged();
  }

  return (
    <Modal open={open} onClose={onClose} title="Aggiungi Movimento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Importo (€)</span>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="0.00" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Tipo</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={inputCls}>
              <option value="acconto">Acconto</option>
              <option value="saldo">Saldo</option>
              <option value="extra">Extra</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Data</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Descrizione</span>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Es. Versamento in contanti" />
        </label>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
            Annulla
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salva
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

// =================== TAB ACCESSO ===================
function AccessoTab({
  student, scheduledExams, onChanged,
}: {
  student: Student;
  scheduledExams: ScheduledExam[];
  onChanged: () => void;
}) {
  const [accessCode, setAccessCode] = useState(student.access_code ?? "");
  const [accessPin, setAccessPin] = useState(student.access_pin ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Exam scheduling state
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ScheduledExam | null>(null);
  const [examDate, setExamDate] = useState(todayISO());
  const [examTime, setExamTime] = useState("09:00");
  const [examType, setExamType] = useState<"teoria" | "pratica">(
    student.status === "teoria" ? "teoria" : "pratica"
  );
  const [examLocation, setExamLocation] = useState("");
  const [examNotes, setExamNotes] = useState("");

  function generateCode() {
    const code = "AR" + Math.floor(100 + Math.random() * 900);
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    setAccessCode(code);
    setAccessPin(pin);
  }

  async function saveCredentials() {
    setSaving(true);
    await supabase
      .from("students")
      .update({
        access_code: accessCode.trim() || null,
        access_pin: accessPin.trim() || null,
      })
      .eq("id", student.id);
    setSaving(false);
    onChanged();
  }

  function copyWhatsApp() {
    const text = `Ciao ${student.name}, ecco le tue credenziali per accedere all'area allievo:\n\nCodice Allievo: ${accessCode}\nPIN: ${accessPin}\n\nAccedi su ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openNewExamModal() {
    setEditingExam(null);
    setExamDate(todayISO());
    setExamTime("09:00");
    setExamType(student.status === "teoria" ? "teoria" : "pratica");
    setExamLocation("");
    setExamNotes("");
    setShowExamModal(true);
  }

  function openEditExamModal(exam: ScheduledExam) {
    setEditingExam(exam);
    setExamDate(exam.exam_date);
    setExamTime(exam.exam_time ?? "09:00");
    setExamType(exam.exam_type);
    setExamLocation(exam.location ?? "");
    setExamNotes(exam.notes ?? "");
    setShowExamModal(true);
  }

  async function saveExam() {
    setSaving(true);
    const payload = {
      student_id: student.id,
      exam_type: examType,
      exam_date: examDate,
      exam_time: examTime || null,
      location: examLocation.trim() || null,
      notes: examNotes.trim() || null,
    };
    if (editingExam) {
      await supabase.from("scheduled_exams").update(payload).eq("id", editingExam.id);
    } else {
      await supabase.from("scheduled_exams").insert(payload);
    }
    setSaving(false);
    setShowExamModal(false);
    onChanged();
  }

  async function deleteExam(id: string) {
    await supabase.from("scheduled_exams").delete().eq("id", id);
    onChanged();
  }

  return (
    <div className="space-y-5">
      {/* Access credentials card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Credenziali di Accesso Allievo</h2>
            <p className="text-sm text-slate-500">Codice e PIN per l'accesso all'area allievo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Codice Allievo</span>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className={inputCls}
              placeholder="Es. AR001"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">PIN</span>
            <input
              type="text"
              value={accessPin}
              onChange={(e) => setAccessPin(e.target.value)}
              className={inputCls}
              placeholder="Es. 1234"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={generateCode}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-50 text-violet-700 font-semibold text-sm hover:bg-violet-100 transition-colors border border-violet-200"
          >
            <KeyRound className="w-4 h-4" />
            Genera Codice + PIN
          </button>
          <button
            onClick={saveCredentials}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salva Credenziali
          </button>
          {accessCode && accessPin && (
            <button
              onClick={copyWhatsApp}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors border border-emerald-200"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
              {copied ? "Copiato!" : "Copia per WhatsApp"}
            </button>
          )}
        </div>
      </div>

      {/* Exam scheduling card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Esami Fissati</h2>
              <p className="text-sm text-slate-500">Date e orari degli esami</p>
            </div>
          </div>
          <button
            onClick={openNewExamModal}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Fissa Esame
          </button>
        </div>

        {scheduledExams.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Nessun esame fissato</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scheduledExams.map((exam) => {
              const isTeoria = exam.exam_type === "teoria";
              const today = new Date(todayISO() + "T00:00:00");
              const eDate = new Date(exam.exam_date + "T00:00:00");
              const diff = Math.round((eDate.getTime() - today.getTime()) / 86400000);
              const isFissato = exam.status === "fissato";
              return (
                <div
                  key={exam.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isTeoria ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {isTeoria ? <BookOpen className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-slate-900">
                        {isTeoria ? "Teoria" : "Pratica"}
                      </p>
                      <Badge color={isFissato ? (diff === 0 ? "rose" : diff <= 7 ? "amber" : "blue") : "slate"} size="sm">
                        {isFissato ? (diff === 0 ? "Oggi" : diff === 1 ? "Domani" : diff > 0 ? `Tra ${diff} giorni` : "Passato") : exam.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatDate(exam.exam_date)}
                      {exam.exam_time && ` · ${exam.exam_time}`}
                      {exam.location && ` · ${exam.location}`}
                    </p>
                    {exam.notes && <p className="text-xs text-slate-400 italic">{exam.notes}</p>}
                  </div>
                  <button
                    onClick={() => openEditExamModal(exam)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteExam(exam.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exam modal */}
      <Modal
        open={showExamModal}
        onClose={() => setShowExamModal(false)}
        title={editingExam ? "Modifica Esame" : "Fissa Esame"}
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Tipo Esame</span>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as "teoria" | "pratica")}
              className={inputCls}
            >
              <option value="teoria">Teoria</option>
              <option value="pratica">Pratica / Guida</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1.5 block">Data</span>
              <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1.5 block">Ora</span>
              <input type="time" value={examTime} onChange={(e) => setExamTime(e.target.value)} className={inputCls} />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Sede / Luogo</span>
            <input type="text" value={examLocation} onChange={(e) => setExamLocation(e.target.value)} className={inputCls} placeholder="Es. Sala Esami — Sede Centrale" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Note</span>
            <input type="text" value={examNotes} onChange={(e) => setExamNotes(e.target.value)} className={inputCls} placeholder="Note opzionali" />
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowExamModal(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              Annulla
            </button>
            <button
              onClick={saveExam}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingExam ? "Salva" : "Fissa Esame"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
