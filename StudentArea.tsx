import { useEffect, useState, useCallback } from "react";
import {
  GraduationCap, LogOut, BookOpen, CheckCircle2, Clock, Wallet,
  FileText, ChevronDown, ChevronUp, Loader2, Route, Trees, Moon,
  Car, AlertTriangle, Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type {
  Student, Chapter, StudentChapter, TheoryExam, DrivingLesson, Transaction, ChapterImage,
  ScheduledExam,
} from "@/lib/types";
import { formatEuro, formatDate, formatDateLong } from "@/lib/format";
import { Badge, ProgressBar } from "@/components/ui";
import { useSettings } from "@/lib/useSettings";
import { SchoolLogo } from "@/components/SchoolLogo";

interface StudentAreaProps {
  studentId: string;
  onLogout: () => void;
}

export function StudentArea({ studentId, onLogout }: StudentAreaProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [studentChapters, setStudentChapters] = useState<StudentChapter[]>([]);
  const [exams, setExams] = useState<TheoryExam[]>([]);
  const [lessons, setLessons] = useState<DrivingLesson[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [images, setImages] = useState<Record<string, ChapterImage[]>>({});
  const [scheduledExams, setScheduledExams] = useState<ScheduledExam[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const schoolName = settings?.school_name ?? "Autoscuola";
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [showTheoryHistory, setShowTheoryHistory] = useState(false);

  const loadAll = useCallback(async () => {
    const [sRes, cRes, scRes, eRes, lRes, tRes, imgRes, seRes] = await Promise.all([
      supabase.from("students").select("*").eq("id", studentId).maybeSingle(),
      supabase.from("chapters").select("*").order("number"),
      supabase.from("student_chapters").select("*").eq("student_id", studentId),
      supabase.from("theory_exams").select("*").eq("student_id", studentId).order("attempt_number"),
      supabase.from("driving_lessons").select("*").eq("student_id", studentId).order("lesson_date", { ascending: false }),
      supabase.from("transactions").select("*").eq("student_id", studentId).order("movement_date", { ascending: false }),
      supabase.from("chapter_images").select("*"),
      supabase.from("scheduled_exams").select("*").eq("student_id", studentId).eq("status", "fissato").order("exam_date", { ascending: true }),
    ]);

    if (sRes.data) setStudent(sRes.data as Student);
    if (cRes.data) setChapters(cRes.data as Chapter[]);
    if (scRes.data) setStudentChapters(scRes.data as StudentChapter[]);
    if (eRes.data) setExams(eRes.data as TheoryExam[]);
    if (lRes.data) setLessons(lRes.data as DrivingLesson[]);
    if (tRes.data) setTransactions(tRes.data as Transaction[]);
    if (imgRes.data) {
      const map: Record<string, ChapterImage[]> = {};
      for (const img of imgRes.data as ChapterImage[]) {
        if (!map[img.chapter_id]) map[img.chapter_id] = [];
        map[img.chapter_id].push(img);
      }
      setImages(map);
    }
    if (seRes.data) setScheduledExams(seRes.data as ScheduledExam[]);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-slate-500 mb-4">Profilo non trovato</p>
        <button onClick={onLogout} className="text-blue-600 font-medium">Torna al login</button>
      </div>
    );
  }

  const completedCount = studentChapters.filter((sc) => sc.completed).length;
  const versato = transactions.filter((t) => t.kind === "acconto" || t.kind === "saldo").reduce((s, t) => s + t.amount, 0);
  const extra = transactions.filter((t) => t.kind === "extra").reduce((s, t) => s + t.amount, 0);
  const totale = student.total_fee ?? 0;
  const saldoResiduo = totale - versato;

  const visibleChapters = chapters.filter((c) => c.visible_to_students);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-20 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SchoolLogo logoDataUrl={settings?.logo_data_url} schoolName={schoolName} size={36} rounded="rounded-lg" />
            <div>
              <p className="font-bold text-sm">{schoolName}</p>
              <p className="text-blue-100 text-xs">Il Mio Armadietto — {student.name}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {student.status === "teoria" ? (
          <TeoriaView
            student={student}
            completedCount={completedCount}
            chapters={chapters}
            studentChapters={studentChapters}
            exams={exams}
            visibleChapters={visibleChapters}
            images={images}
            expandedChapter={expandedChapter}
            setExpandedChapter={setExpandedChapter}
            totale={totale}
            versato={versato}
            saldoResiduo={saldoResiduo}
            extra={extra}
            transactions={transactions}
            showTheoryHistory={showTheoryHistory}
            setShowTheoryHistory={setShowTheoryHistory}
            scheduledExams={scheduledExams}
          />
        ) : (
          <PraticaView
            student={student}
            lessons={lessons}
            exams={exams}
            totale={totale}
            versato={versato}
            saldoResiduo={saldoResiduo}
            extra={extra}
            transactions={transactions}
            showTheoryHistory={showTheoryHistory}
            setShowTheoryHistory={setShowTheoryHistory}
            scheduledExams={scheduledExams}
          />
        )}
      </div>
    </div>
  );
}

// =================== TEORIA VIEW ===================
function TeoriaView({
  student, completedCount, chapters, studentChapters, exams,
  visibleChapters, images, expandedChapter, setExpandedChapter,
  totale, versato, saldoResiduo, extra, transactions,
  showTheoryHistory, setShowTheoryHistory, scheduledExams,
}: {
  student: Student;
  completedCount: number;
  chapters: Chapter[];
  studentChapters: StudentChapter[];
  exams: TheoryExam[];
  visibleChapters: Chapter[];
  images: Record<string, ChapterImage[]>;
  expandedChapter: string | null;
  setExpandedChapter: (id: string | null) => void;
  totale: number;
  versato: number;
  saldoResiduo: number;
  extra: number;
  transactions: Transaction[];
  showTheoryHistory: boolean;
  setShowTheoryHistory: (v: boolean) => void;
  scheduledExams: ScheduledExam[];
}) {
  const attemptsLeft = 2 - student.theory_attempts_used;
  const bothFailed = student.theory_attempts_used >= 2 && !student.theory_passed;
  const lastExam = exams[exams.length - 1];

  return (
    <>
      {/* Prossimo Esame */}
      <NextExamCard exams={scheduledExams} />

      {/* Status banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-900">Fase Teoria</h2>
            <p className="text-sm text-slate-500">Studiando per l'esame</p>
          </div>
          <Badge color="amber">In corso</Badge>
        </div>

        {/* Progress circle */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 relative flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#fef3c7" strokeWidth="7" />
              <circle
                cx="40" cy="40" r="34" fill="none" stroke="#f59e0b" strokeWidth="7"
                strokeDasharray={`${(completedCount / 25) * 214} 214`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-amber-700">{completedCount}</span>
              <span className="text-[10px] text-slate-400">/ 25</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">Capitoli completati</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {25 - completedCount} capitoli ancora da studiare
            </p>
          </div>
        </div>
      </div>

      {/* Theory attempts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-3">Prove d'Esame Teoria</h3>

        <div className="flex items-center gap-3 mb-3">
          {[1, 2].map((n) => {
            const exam = exams.find((e) => e.attempt_number === n);
            return (
              <div key={n} className={`flex-1 rounded-xl p-3 border-2 text-center ${
                exam ? (exam.passed ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50")
                     : "border-slate-200 bg-slate-50"
              }`}>
                <div className={`text-2xl font-bold mb-0.5 ${
                  exam ? (exam.passed ? "text-emerald-600" : "text-rose-600") : "text-slate-300"
                }`}>
                  {exam ? (exam.passed ? "✓" : "✗") : n}
                </div>
                <p className="text-xs text-slate-500 font-medium">Prova {n}</p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Tentativi rimasti:</span>
          <span className={`font-bold ${attemptsLeft > 0 ? "text-slate-900" : "text-rose-600"}`}>
            {attemptsLeft} su 2
          </span>
        </div>

        {bothFailed && (
          <div className="mt-3 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700">
              Hai esaurito i 2 tentativi. È necessaria una <strong>nuova iscrizione</strong> all'esame di teoria.
              Contatta l'autoscuola per procedere.
            </p>
          </div>
        )}

        {student.theory_attempts_used === 1 && !student.theory_passed && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Prima prova non superata. Hai ancora <strong>1 tentativo</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Chapter checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-1">I 25 Capitoli</h3>
        <p className="text-sm text-slate-500 mb-4">Tocca per vedere i contenuti disponibili</p>

        <div className="space-y-2">
          {chapters.map((ch) => {
            const sc = studentChapters.find((s) => s.chapter_id === ch.id);
            const completed = sc?.completed ?? false;
            const isVisible = ch.visible_to_students;
            const chImages = images[ch.id] ?? [];
            const hasContent = isVisible && (ch.summary || chImages.length > 0);
            const isExpanded = expandedChapter === ch.id;

            return (
              <div key={ch.id}>
                <button
                  onClick={() => hasContent ? setExpandedChapter(isExpanded ? null : ch.id) : undefined}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    completed
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white border-slate-200"
                  } ${hasContent ? "cursor-pointer hover:border-blue-300" : "cursor-default"}`}
                >
                  <div className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center transition-colors ${
                    completed ? "bg-emerald-500" : "bg-slate-100"
                  }`}>
                    {completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${completed ? "text-emerald-900" : "text-slate-700"}`}>
                      <span className="text-slate-400 mr-1.5">{ch.number}.</span>
                      {ch.title}
                    </p>
                  </div>
                  {hasContent && (
                    isVisible ? (
                      <span className="text-xs text-blue-600 font-medium">Contenuto</span>
                    ) : null
                  )}
                </button>

                {isExpanded && hasContent && (
                  <div className="mt-1 mb-2 ml-9 bg-blue-50 rounded-xl p-4 animate-slide-up">
                    {ch.summary && (
                      <p className="text-sm text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">
                        {ch.summary}
                      </p>
                    )}
                    {chImages.length > 0 && (
                      <div className="space-y-2">
                        {chImages.map((img) => (
                          <div key={img.id}>
                            <img
                              src={img.image_url}
                              alt={img.caption ?? ""}
                              className="w-full rounded-lg border border-slate-200"
                            />
                            {img.caption && (
                              <p className="text-xs text-slate-500 mt-1 text-center">{img.caption}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial summary */}
      <FinancialSummary
        totale={totale} versato={versato} saldoResiduo={saldoResiduo}
        extra={extra} transactions={transactions}
      />
    </>
  );
}

// =================== PRATICA VIEW ===================
function PraticaView({
  student, lessons, exams, totale, versato, saldoResiduo, extra, transactions,
  showTheoryHistory, setShowTheoryHistory, scheduledExams,
}: {
  student: Student;
  lessons: DrivingLesson[];
  exams: TheoryExam[];
  totale: number;
  versato: number;
  saldoResiduo: number;
  extra: number;
  transactions: Transaction[];
  showTheoryHistory: boolean;
  setShowTheoryHistory: (v: boolean) => void;
  scheduledExams: ScheduledExam[];
}) {
  const autostradaMin = lessons.filter((l) => l.lesson_type === "autostrada").reduce((s, l) => s + l.duration_minutes, 0);
  const extraurbanaMin = lessons.filter((l) => l.lesson_type === "extraurbana").reduce((s, l) => s + l.duration_minutes, 0);
  const notturnaMin = lessons.filter((l) => l.lesson_type === "notturna").reduce((s, l) => s + l.duration_minutes, 0);

  return (
    <>
      {/* Prossimo Esame */}
      <NextExamCard exams={scheduledExams} />

      {/* Foglio Rosa banner */}
      {student.foglio_rosa_date && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold">Foglio Rosa Attivo</h2>
              <p className="text-blue-100 text-sm">Patente B</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-blue-100 text-xs">Rilasciato</p>
              <p className="font-bold text-sm">{formatDate(student.foglio_rosa_date)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-blue-100 text-xs">Scade</p>
              <p className="font-bold text-sm">{formatDate(student.foglio_rosa_expiry)}</p>
            </div>
          </div>
        </div>
      )}

      {/* 6 ore obbligatorie */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-1">6 Ore Obbligatorie</h3>
        <p className="text-sm text-slate-500 mb-4">Le guide obbligatorie per il patentino</p>

        <div className="space-y-4">
          <StudentObligatoryBar icon={Route} label="Autostrada" minutes={autostradaMin} target={120} color="blue" />
          <StudentObligatoryBar icon={Trees} label="Extraurbana" minutes={extraurbanaMin} target={120} color="emerald" />
          <StudentObligatoryBar icon={Moon} label="Notturna" minutes={notturnaMin} target={120} color="violet" />
        </div>
      </div>

      {/* Diario guide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Car className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Diario delle Guide</h3>
            <p className="text-sm text-slate-500">{lessons.length} lezioni</p>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-8">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Nessuna guida registrata</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  lesson.lesson_type === "autostrada" ? "bg-blue-50 text-blue-600" :
                  lesson.lesson_type === "extraurbana" ? "bg-emerald-50 text-emerald-600" :
                  lesson.lesson_type === "notturna" ? "bg-violet-50 text-violet-600" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {lesson.lesson_type === "autostrada" ? <Route className="w-4 h-4" /> :
                   lesson.lesson_type === "extraurbana" ? <Trees className="w-4 h-4" /> :
                   lesson.lesson_type === "notturna" ? <Moon className="w-4 h-4" /> :
                   <Car className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-slate-900 capitalize">{lesson.lesson_type}</p>
                    {lesson.is_extra_paid && <Badge color="amber" size="sm">Extra</Badge>}
                  </div>
                  <p className="text-xs text-slate-400">
                    {formatDate(lesson.lesson_date)} · {lesson.duration_minutes} min
                  </p>
                  {lesson.notes && (
                    <p className="text-sm text-slate-600 mt-1 italic">{lesson.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teoria completata (collapsible) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowTheoryHistory(!showTheoryHistory)}
          className="w-full flex items-center justify-between p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900">Teoria Completata</h3>
              <p className="text-sm text-slate-500">Storico esame di teoria</p>
            </div>
          </div>
          {showTheoryHistory ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showTheoryHistory && (
          <div className="px-5 pb-5 animate-slide-up">
            <div className="space-y-2 border-t border-slate-100 pt-4">
              {exams.map((exam) => (
                <div key={exam.id} className={`flex items-center gap-3 p-3 rounded-xl ${
                  exam.passed ? "bg-emerald-50" : "bg-rose-50"
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    exam.passed ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  }`}>
                    {exam.passed ? "✓" : "✗"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Prova {exam.attempt_number}</p>
                    <p className="text-xs text-slate-500">{formatDate(exam.exam_date)}</p>
                  </div>
                  {exam.notes && <p className="text-xs text-slate-500 italic">{exam.notes}</p>}
                </div>
              ))}
              {student.foglio_rosa_date && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 mt-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Foglio Rosa</p>
                    <p className="text-xs text-blue-700">
                      Rilasciato il {formatDateLong(student.foglio_rosa_date)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Financial summary */}
      <FinancialSummary
        totale={totale} versato={versato} saldoResiduo={saldoResiduo}
        extra={extra} transactions={transactions}
      />
    </>
  );
}

function StudentObligatoryBar({
  icon: Icon, label, minutes, target, color,
}: {
  icon: typeof Car;
  label: string;
  minutes: number;
  target: number;
  color: "blue" | "emerald" | "violet";
}) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="ml-auto text-sm font-bold text-slate-900">
          {hours}h{mins > 0 ? ` ${mins}m` : ""} / {target / 60}h
        </span>
      </div>
      <ProgressBar value={minutes} max={target} color={color} />
    </div>
  );
}

function FinancialSummary({
  totale, versato, saldoResiduo, extra, transactions,
}: {
  totale: number;
  versato: number;
  saldoResiduo: number;
  extra: number;
  transactions: Transaction[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Riepilogo Economico</h3>
          <p className="text-sm text-slate-500">Quota e pagamenti</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs text-slate-400 font-medium">Totale</p>
          <p className="font-bold text-slate-900">{formatEuro(totale)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-xs text-emerald-600 font-medium">Versato</p>
          <p className="font-bold text-emerald-700">{formatEuro(versato)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-xs text-amber-600 font-medium">Extra</p>
          <p className="font-bold text-amber-700">{formatEuro(extra)}</p>
        </div>
        <div className={`rounded-xl p-3 ${saldoResiduo > 0 ? "bg-rose-50" : "bg-emerald-50"}`}>
          <p className={`text-xs font-medium ${saldoResiduo > 0 ? "text-rose-600" : "text-emerald-600"}`}>Saldo</p>
          <p className={`font-bold ${saldoResiduo > 0 ? "text-rose-700" : "text-emerald-700"}`}>
            {formatEuro(saldoResiduo)}
          </p>
        </div>
      </div>

      {transactions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Storico acconti</p>
          <div className="space-y-1.5">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-slate-700 font-medium">{t.description ?? t.kind}</p>
                  <p className="text-xs text-slate-400">{formatDate(t.movement_date)}</p>
                </div>
                <span className="font-bold text-emerald-600">+{formatEuro(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NextExamCard({ exams }: { exams: ScheduledExam[] }) {
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
  const next = exams.length > 0 ? exams[0] : null;

  if (!next) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-5 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-bold text-slate-700 text-sm">Prossimo Esame</p>
        <p className="text-slate-400 text-sm mt-1">Data esame da fissare</p>
        <p className="text-slate-400 text-xs mt-2">L'autoscuola fisserà la data il prima possibile.</p>
      </div>
    );
  }

  const examDate = new Date(next.exam_date + "T00:00:00");
  const diffDays = Math.round((examDate.getTime() - today.getTime()) / 86400000);
  const isTeoria = next.exam_type === "teoria";

  let countdownLabel: string;
  let countdownColor: string;
  if (diffDays < 0) { countdownLabel = "Data passata"; countdownColor = "text-slate-400"; }
  else if (diffDays === 0) { countdownLabel = "Oggi!"; countdownColor = "text-rose-600"; }
  else if (diffDays === 1) { countdownLabel = "Domani"; countdownColor = "text-amber-600"; }
  else { countdownLabel = `Tra ${diffDays} giorni`; countdownColor = diffDays <= 7 ? "text-amber-600" : "text-blue-600"; }

  return (
    <div className={`rounded-2xl p-5 shadow-lg ${isTeoria ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-600/20" : "bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-emerald-600/20"} text-white`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          {isTeoria ? <BookOpen className="w-6 h-6" /> : <Car className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <p className="font-bold">Prossimo Esame {isTeoria ? "di Teoria" : "Pratico"}</p>
          <p className={`text-sm ${isTeoria ? "text-blue-100" : "text-emerald-100"}`}>{countdownLabel}</p>
        </div>
        <span className={`text-3xl font-bold ${countdownColor === "text-rose-600" ? "text-white" : "text-white/90"}`}>
          {diffDays > 0 ? diffDays : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-xl p-3">
          <p className={`text-xs ${isTeoria ? "text-blue-100" : "text-emerald-100"}`}>Data</p>
          <p className="font-bold text-sm">{formatDateLong(next.exam_date)}</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3">
          <p className={`text-xs ${isTeoria ? "text-blue-100" : "text-emerald-100"}`}>Ora</p>
          <p className="font-bold text-sm">{next.exam_time ?? "Da confermare"}</p>
        </div>
      </div>
      {next.location && (
        <div className="bg-white/10 rounded-xl p-3 mt-2">
          <p className={`text-xs ${isTeoria ? "text-blue-100" : "text-emerald-100"}`}>Sede</p>
          <p className="font-bold text-sm">{next.location}</p>
        </div>
      )}
      {next.notes && (
        <p className={`text-xs ${isTeoria ? "text-blue-100" : "text-emerald-100"} mt-2 italic`}>{next.notes}</p>
      )}
    </div>
  );
}
