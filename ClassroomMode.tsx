import { useEffect, useState, useCallback } from "react";
import {
  X, ChevronLeft, ChevronRight, Check, User, Loader2, Monitor,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Chapter, Student, ClassroomAttendance, ChapterImage } from "@/lib/types";
import { todayISO } from "@/lib/format";
import { useSettings } from "@/lib/useSettings";
import { SchoolLogo } from "@/components/SchoolLogo";

interface ClassroomModeProps {
  onExit: () => void;
}

export function ClassroomMode({ onExit }: ClassroomModeProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [images, setImages] = useState<ChapterImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionDate] = useState(todayISO());
  const { settings } = useSettings();
  const schoolName = settings?.school_name ?? "Autoscuola";

  const loadData = useCallback(async () => {
    const [chRes, sRes] = await Promise.all([
      supabase.from("chapters").select("*").order("number"),
      supabase.from("students").select("*").order("name"),
    ]);
    if (chRes.data) setChapters(chRes.data as Chapter[]);
    if (sRes.data) setStudents(sRes.data as Student[]);
    setLoading(false);
  }, []);

  const loadAttendance = useCallback(async (chapterId: string) => {
    const { data } = await supabase
      .from("classroom_attendance")
      .select("*")
      .eq("chapter_id", chapterId)
      .eq("session_date", sessionDate);
    if (data) {
      const map: Record<string, boolean> = {};
      for (const a of data as ClassroomAttendance[]) {
        map[a.student_id] = a.present;
      }
      setAttendance(map);
    }
  }, [sessionDate]);

  const loadImages = useCallback(async (chapterId: string) => {
    const { data } = await supabase
      .from("chapter_images")
      .select("*")
      .eq("chapter_id", chapterId);
    setImages(data as ChapterImage[] ?? []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (chapters.length > 0) {
      const ch = chapters[currentIndex];
      loadAttendance(ch.id);
      loadImages(ch.id);
    }
  }, [chapters, currentIndex, loadAttendance, loadImages]);

  async function toggleAttendance(studentId: string) {
    if (chapters.length === 0) return;
    const ch = chapters[currentIndex];
    const isPresent = !attendance[studentId];

    // Upsert attendance
    const { data: existing } = await supabase
      .from("classroom_attendance")
      .select("id")
      .eq("chapter_id", ch.id)
      .eq("student_id", studentId)
      .eq("session_date", sessionDate)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("classroom_attendance")
        .update({ present: isPresent })
        .eq("id", existing.id);
    } else {
      await supabase.from("classroom_attendance").insert({
        chapter_id: ch.id,
        student_id: studentId,
        session_date: sessionDate,
        present: isPresent,
      });
    }

    setAttendance((prev) => ({ ...prev, [studentId]: isPresent }));
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50 text-white">
        <p>Nessun capitolo disponibile</p>
      </div>
    );
  }

  const chapter = chapters[currentIndex];
  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <SchoolLogo logoDataUrl={settings?.logo_data_url} schoolName={schoolName} size={36} rounded="rounded-lg" />
          <div>
            <p className="text-white font-bold">{schoolName}</p>
            <p className="text-slate-400 text-sm">Proiettore Aula · Capitolo {chapter.number} di 25</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-slate-400 text-xs">Presenti</p>
            <p className="text-white font-bold text-lg">{presentCount}/{students.length}</p>
          </div>
          <button
            onClick={onExit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white font-medium text-sm hover:bg-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
            Esci
          </button>
        </div>
      </div>

      {/* Chapter content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left: chapter display */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 min-h-0 overflow-y-auto">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-600/20 text-blue-300 font-bold text-sm mb-4">
                Capitolo {chapter.number}
              </span>
              <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight mb-4">
                {chapter.title}
              </h1>
            </div>

            {images.length > 0 && (
              <div className="flex justify-center gap-4 flex-wrap mb-6">
                {images.map((img) => (
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt={img.caption ?? ""}
                    className="max-h-64 rounded-xl border border-slate-700 object-contain"
                  />
                ))}
              </div>
            )}

            {chapter.summary ? (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">
                  {chapter.summary}
                </p>
              </div>
            ) : (
              <p className="text-slate-500 text-center text-lg">Nessun riassunto disponibile per questo capitolo</p>
            )}
          </div>
        </div>

        {/* Right: attendance checklist */}
        <div className="lg:w-80 flex-shrink-0 bg-slate-800 border-t lg:border-t-0 lg:border-l border-slate-700 flex flex-col max-h-[40vh] lg:max-h-none">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-white font-semibold text-sm">Spunta Rapida Presenti</p>
            <p className="text-slate-400 text-xs">{sessionDate}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {students.map((s) => {
              const present = attendance[s.id] ?? false;
              return (
                <button
                  key={s.id}
                  onClick={() => toggleAttendance(s.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    present
                      ? "bg-emerald-600/20 border border-emerald-500/30"
                      : "bg-slate-700/50 border border-slate-600/30 hover:bg-slate-700"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    present ? "bg-emerald-500" : "bg-slate-600"
                  }`}>
                    {present ? <Check className="w-5 h-5 text-white" /> : <User className="w-4 h-4 text-slate-300" />}
                  </div>
                  <span className={`text-sm font-medium truncate ${present ? "text-white" : "text-slate-300"}`}>
                    {s.name}
                  </span>
                </button>
              );
            })}
            {students.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">Nessun allievo</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-t border-slate-700">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 text-white font-medium text-sm hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Precedente
        </button>
        <div className="flex gap-1.5">
          {chapters.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? "bg-blue-400 w-6" : "bg-slate-600 hover:bg-slate-500"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrentIndex((i) => Math.min(chapters.length - 1, i + 1))}
          disabled={currentIndex === chapters.length - 1}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 text-white font-medium text-sm hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Successivo
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
