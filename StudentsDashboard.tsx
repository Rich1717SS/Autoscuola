import { useEffect, useState, useCallback } from "react";
import {
  Users, Search, Plus, Phone, IdCard, FileWarning, Loader2,
  BookOpen, CheckCircle2, XCircle, TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Student } from "@/lib/types";
import { formatEuro, formatDate } from "@/lib/format";
import { Modal, Badge } from "@/components/ui";
import { StudentDetail } from "./StudentDetail";

interface StudentsDashboardProps {
  selectedStudentId: string | null;
  onSelectStudent: (id: string | null) => void;
}

export function StudentsDashboard({ selectedStudentId, onSelectStudent }: StudentsDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "teoria" | "pratica">("all");
  const [showCreate, setShowCreate] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Errore caricamento allievi:", error);
    } else {
      setStudents(data as Student[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filtered = students.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? "").includes(search) ||
      (s.fiscal_code ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: students.length,
    teoria: students.filter((s) => s.status === "teoria").length,
    pratica: students.filter((s) => s.status === "pratica").length,
  };

  if (selectedStudentId) {
    return (
      <StudentDetail
        studentId={selectedStudentId}
        onBack={() => onSelectStudent(null)}
        onChanged={loadStudents}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Allievi</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestisci tutti gli allievi iscritti</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Nuovo Allievo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Users} label="Totali" value={stats.total} color="blue" />
        <StatCard icon={BookOpen} label="In Teoria" value={stats.teoria} color="amber" />
        <StatCard icon={TrendingUp} label="In Pratica" value={stats.pratica} color="emerald" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca per nome, telefono, CF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "teoria", "pratica"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filterStatus === f
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f === "all" ? "Tutti" : f === "teoria" ? "Teoria" : "Pratica"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nessun allievo trovato</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((student) => (
            <StudentCard key={student.id} student={student} onClick={() => onSelectStudent(student.id)} />
          ))}
        </div>
      )}

      <CreateStudentModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          loadStudents();
        }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  color: "blue" | "amber" | "emerald";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  );
}

function StudentCard({ student, onClick }: { student: Student; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {student.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">CF: {student.fiscal_code ?? "—"}</p>
        </div>
        <Badge color={student.status === "teoria" ? "amber" : "emerald"}>
          {student.status === "teoria" ? "Teoria" : "Pratica"}
        </Badge>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="truncate">{student.phone ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <TrendingUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Quota: {formatEuro(student.total_fee)}</span>
        </div>
        {student.missing_documents.length > 0 && (
          <div className="flex items-center gap-2 text-amber-600">
            <FileWarning className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-medium">{student.missing_documents.length} doc. mancanti</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400">Prove teoria: {student.theory_attempts_used}/2</span>
        {student.theory_passed ? (
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Superato
          </span>
        ) : (
          <span className="flex items-center gap-1 text-slate-400">
            <XCircle className="w-3.5 h-3.5" /> In corso
          </span>
        )}
      </div>
    </button>
  );
}

function CreateStudentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");
  const [totalFee, setTotalFee] = useState("");
  const [acconto, setAcconto] = useState("");
  const [missingDocs, setMissingDocs] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Il nome è obbligatorio");
      return;
    }
    setSaving(true);
    setError(null);

    const docsArray = missingDocs
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    const fee = totalFee.trim() ? parseFloat(totalFee) : null;

    const { data: newStudent, error: insertError } = await supabase
      .from("students")
      .insert({
        name: name.trim(),
        phone: phone.trim() || null,
        fiscal_code: fiscalCode.trim() || null,
        total_fee: fee,
        missing_documents: docsArray,
      })
      .select()
      .single();

    if (insertError) {
      setError("Errore nella creazione dell'allievo");
      setSaving(false);
      return;
    }

    // Record initial acconto transaction if provided
    const accontoNum = acconto.trim() ? parseFloat(acconto) : null;
    if (accontoNum && accontoNum > 0 && newStudent) {
      await supabase.from("transactions").insert({
        student_id: newStudent.id,
        amount: accontoNum,
        kind: "acconto",
        description: "Acconto iniziale",
      });
    }

    // Reset form
    setName("");
    setPhone("");
    setFiscalCode("");
    setTotalFee("");
    setAcconto("");
    setMissingDocs("");
    setSaving(false);
    onCreated();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuovo Allievo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome e Cognome" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Mario Rossi"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefono">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="333 1234567"
            />
          </Field>
          <Field label="Codice Fiscale">
            <input
              type="text"
              value={fiscalCode}
              onChange={(e) => setFiscalCode(e.target.value)}
              className={inputClass}
              placeholder="RSSMRC01A01..."
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Quota Totale (€)">
            <input
              type="number"
              step="0.01"
              value={totalFee}
              onChange={(e) => setTotalFee(e.target.value)}
              className={inputClass}
              placeholder="Lascia vuoto se non fissata"
            />
          </Field>
          <Field label="Acconto Iniziale (€)">
            <input
              type="number"
              step="0.01"
              value={acconto}
              onChange={(e) => setAcconto(e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Documenti Mancanti" hint="Separati da virgola">
          <input
            type="text"
            value={missingDocs}
            onChange={(e) => setMissingDocs(e.target.value)}
            className={inputClass}
            placeholder="Certificato medico, Foto tessera"
          />
        </Field>

        {error && (
          <div className="bg-rose-50 text-rose-700 text-sm rounded-lg p-3 border border-rose-200">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Crea Allievo
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 mb-1.5 block">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-slate-400 mt-1 block">{hint}</span>}
    </label>
  );
}
