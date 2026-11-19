import { useEffect, useState, useCallback } from "react";
import {
  Calendar, Clock, MapPin, Plus, Trash2, Loader2, Edit3,
  BookOpen, Car, AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ScheduledExam, Student } from "@/lib/types";
import { formatDate, formatDateLong, todayISO } from "@/lib/format";
import { Badge, Modal } from "@/components/ui";

interface ExamWithStudent extends ScheduledExam {
  student_name?: string;
}

interface ExamsCalendarProps {
  onOpenStudent?: (studentId: string) => void;
}

export function ExamsCalendar({ onOpenStudent }: ExamsCalendarProps) {
  const [exams, setExams] = useState<ExamWithStudent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamWithStudent | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [eRes, sRes] = await Promise.all([
      supabase.from("scheduled_exams").select("*").order("exam_date", { ascending: true }),
      supabase.from("students").select("*").order("name"),
    ]);
    if (eRes.data) {
      const sMap = new Map<string, string>();
      if (sRes.data) for (const s of sRes.data as Student[]) sMap.set(s.id, s.name);
      setExams(
        (eRes.data as ScheduledExam[]).map((e) => ({
          ...e,
          student_name: sMap.get(e.student_id) ?? "—",
        }))
      );
    }
    if (sRes.data) setStudents(sRes.data as Student[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = exams.filter((e) => e.status === "fissato");
  const past = exams.filter((e) => e.status !== "fissato");

  function getDayBadge(examDate: string): { label: string; color: "blue" | "emerald" | "amber" | "rose" | "slate" } {
    const today = new Date(todayISO() + "T00:00:00");
    const date = new Date(examDate + "T00:00:00");
    const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return { label: "Scaduto", color: "slate" };
    if (diff === 0) return { label: "Oggi", color: "rose" };
    if (diff === 1) return { label: "Domani", color: "amber" };
    if (diff <= 7) return { label: `Tra ${diff} giorni`, color: "amber" };
    return { label: `Tra ${diff} giorni`, color: "blue" };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendario Esami</h1>
          <p className="text-slate-500 text-sm mt-0.5">Tutti gli esami fissati in ordine cronologico</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Fissa Esame
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Upcoming exams */}
          <div>
            <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Prossimi Esami ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Nessun esame fissato</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((exam) => {
                  const dayBadge = getDayBadge(exam.exam_date);
                  return (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      dayBadge={dayBadge}
                      onEdit={() => setEditingExam(exam)}
                      onDelete={async () => {
                        await supabase.from("scheduled_exams").delete().eq("id", exam.id);
                        load();
                      }}
                      onOpenStudent={onOpenStudent}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Past exams */}
          {past.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Esami Passati ({past.length})
              </h2>
              <div className="space-y-2">
                {past.map((exam) => {
                  const dayBadge = getDayBadge(exam.exam_date);
                  return (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      dayBadge={dayBadge}
                      onEdit={() => setEditingExam(exam)}
                      onDelete={async () => {
                        await supabase.from("scheduled_exams").delete().eq("id", exam.id);
                        load();
                      }}
                      onOpenStudent={onOpenStudent}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <ExamModal
        open={showAdd || !!editingExam}
        exam={editingExam}
        students={students}
        onClose={() => {
          setShowAdd(false);
          setEditingExam(null);
        }}
        onSaved={() => {
          setShowAdd(false);
          setEditingExam(null);
          load();
        }}
      />
    </div>
  );
}

function ExamCard({
  exam, dayBadge, onEdit, onDelete, onOpenStudent,
}: {
  exam: ExamWithStudent;
  dayBadge: { label: string; color: "blue" | "emerald" | "amber" | "rose" | "slate" };
  onEdit: () => void;
  onDelete: () => void;
  onOpenStudent?: (studentId: string) => void;
}) {
  const isTeoria = exam.exam_type === "teoria";
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isTeoria ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
        }`}>
          {isTeoria ? <BookOpen className="w-6 h-6" /> : <Car className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-900 text-sm">
              {exam.student_name}
            </p>
            <Badge color={isTeoria ? "blue" : "emerald"} size="sm">
              {isTeoria ? "Teoria" : "Pratica"}
            </Badge>
            <Badge color={dayBadge.color} size="sm">{dayBadge.label}</Badge>
            {exam.status !== "fissato" && (
              <Badge color="slate" size="sm">{exam.status}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateLong(exam.exam_date)}
            </span>
            {exam.exam_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {exam.exam_time}
              </span>
            )}
            {exam.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5" />
                {exam.location}
              </span>
            )}
          </div>
          {exam.notes && (
            <p className="text-xs text-slate-400 mt-1 italic">{exam.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onOpenStudent && (
            <button
              onClick={() => onOpenStudent(exam.student_id)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Apri scheda
            </button>
          )}
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExamModal({
  open, exam, students, onClose, onSaved,
}: {
  open: boolean;
  exam: ExamWithStudent | null;
  students: Student[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [examType, setExamType] = useState<"teoria" | "pratica">("teoria");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (exam) {
      setStudentId(exam.student_id);
      setExamType(exam.exam_type);
      setDate(exam.exam_date);
      setTime(exam.exam_time ?? "09:00");
      setLocation(exam.location ?? "");
      setNotes(exam.notes ?? "");
    } else {
      setStudentId(students[0]?.id ?? "");
      setExamType("teoria");
      setDate(todayISO());
      setTime("09:00");
      setLocation("");
      setNotes("");
    }
  }, [exam, students, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) return;
    setSaving(true);
    const payload = {
      student_id: studentId,
      exam_type: examType,
      exam_date: date,
      exam_time: time || null,
      location: location.trim() || null,
      notes: notes.trim() || null,
    };
    if (exam) {
      await supabase.from("scheduled_exams").update(payload).eq("id", exam.id);
    } else {
      await supabase.from("scheduled_exams").insert(payload);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={exam ? "Modifica Esame" : "Fissa Nuovo Esame"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Allievo</span>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className={inputCls}
            disabled={!!exam}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Tipo Esame</span>
            <select value={examType} onChange={(e) => setExamType(e.target.value as "teoria" | "pratica")} className={inputCls}>
              <option value="teoria">Teoria</option>
              <option value="pratica">Pratica / Guida</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Data</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Ora</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-1.5 block">Sede / Luogo</span>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder="Es. Sala Esami — Sede Centrale" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Note</span>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="Note opzionali" />
        </label>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
            Annulla
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {exam ? "Salva Modifiche" : "Fissa Esame"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
