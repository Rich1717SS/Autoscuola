import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, Eye, EyeOff, Image as ImageIcon, Plus, Save, Loader2,
  Monitor, X, ChevronLeft, ChevronRight, Check, Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Chapter, ChapterImage } from "@/lib/types";
import { Modal, Badge } from "@/components/ui";
import { ClassroomMode } from "./ClassroomMode";

export function ChaptersManager() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [images, setImages] = useState<Record<string, ChapterImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [classroomMode, setClassroomMode] = useState(false);

  const loadChapters = useCallback(async () => {
    setLoading(true);
    const { data: chData } = await supabase.from("chapters").select("*").order("number");
    if (chData) {
      setChapters(chData as Chapter[]);
      const { data: imgData } = await supabase.from("chapter_images").select("*");
      if (imgData) {
        const map: Record<string, ChapterImage[]> = {};
        for (const img of imgData as ChapterImage[]) {
          if (!map[img.chapter_id]) map[img.chapter_id] = [];
          map[img.chapter_id].push(img);
        }
        setImages(map);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  async function toggleVisible(ch: Chapter) {
    await supabase
      .from("chapters")
      .update({ visible_to_students: !ch.visible_to_students })
      .eq("id", ch.id);
    loadChapters();
  }

  async function saveSummary() {
    if (!editing) return;
    setSaving(true);
    await supabase.from("chapters").update({ summary: editSummary.trim() || null }).eq("id", editing);
    setSaving(false);
    setEditing(null);
    loadChapters();
  }

  async function addImage() {
    if (!editing || !imageUrl.trim()) return;
    await supabase.from("chapter_images").insert({
      chapter_id: editing,
      image_url: imageUrl.trim(),
      caption: imageCaption.trim() || null,
    });
    setImageUrl("");
    setImageCaption("");
    loadChapters();
  }

  async function deleteImage(imgId: string) {
    await supabase.from("chapter_images").delete().eq("id", imgId);
    loadChapters();
  }

  if (classroomMode) {
    return <ClassroomMode onExit={() => setClassroomMode(false)} />;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Didattica — 25 Capitoli</h1>
          <p className="text-slate-500 text-sm mt-0.5">Patente B · Riassunti, foto e visibilità allievi</p>
        </div>
        <button
          onClick={() => setClassroomMode(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors shadow-lg"
        >
          <Monitor className="w-4 h-4" />
          Modalità Proiettore Aula
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {chapters.map((ch) => {
          const chImages = images[ch.id] ?? [];
          return (
            <div key={ch.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {ch.number}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{ch.title}</h3>
                  {ch.summary && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ch.summary}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleVisible(ch)}
                  className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    ch.visible_to_students
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                  title={ch.visible_to_students ? "Visibile agli allievi" : "Nascosto agli allievi"}
                >
                  {ch.visible_to_students ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              {chImages.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {chImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.image_url}
                        alt={img.caption ?? ""}
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                      />
                      <button
                        onClick={() => deleteImage(img.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditing(ch.id);
                    setEditSummary(ch.summary ?? "");
                    setImageUrl("");
                    setImageCaption("");
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Modifica ({chImages.length} foto)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Modifica Capitolo`} maxWidth="max-w-2xl">
        {editing && (
          <div className="space-y-5">
            <div>
              <h4 className="font-bold text-slate-900 mb-2">
                {chapters.find((c) => c.id === editing)?.number}. {chapters.find((c) => c.id === editing)?.title}
              </h4>
            </div>

            {/* Summary */}
            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1.5 block">Riassunto</span>
              <textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Scrivi un riassunto del capitolo..."
              />
            </label>

            {/* Existing images */}
            {(images[editing] ?? []).length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Foto/Schemi caricati</p>
                <div className="flex gap-3 flex-wrap">
                  {(images[editing] ?? []).map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={img.image_url} alt={img.caption ?? ""} className="w-24 h-24 rounded-lg object-cover border border-slate-200" />
                      {img.caption && <p className="text-xs text-slate-400 mt-1 w-24 truncate">{img.caption}</p>}
                      <button
                        onClick={() => deleteImage(img.id)}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add image */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Aggiungi foto/schema (URL)</p>
              <div className="space-y-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Didascalia (opzionale)"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addImage}
                  disabled={!imageUrl.trim()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi foto
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
              <button onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
                Chiudi
              </button>
              <button
                onClick={saveSummary}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salva Riassunto
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
