import { useState, useEffect, useRef } from "react";
import { Upload, Loader2, Save, Trash2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Settings } from "@/lib/types";
import { Modal } from "@/components/ui";
import { SchoolLogo } from "@/components/SchoolLogo";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings | null;
  onSaved: () => void;
}

export function SettingsModal({ open, onClose, settings, onSaved }: SettingsModalProps) {
  const [schoolName, setSchoolName] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setSchoolName(settings.school_name);
      setLogoDataUrl(settings.logo_data_url);
      setAdminEmail(settings.admin_email);
      setAdminPassword(settings.admin_password);
    }
  }, [settings, open]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      alert("L'immagine è troppo grande. Usa un'immagine inferiore a 500KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("settings")
      .upsert({
        id: 1,
        school_name: schoolName.trim() || "Autoscuola",
        logo_data_url: logoDataUrl,
        admin_email: adminEmail.trim(),
        admin_password: adminPassword.trim(),
      });
    setSaving(false);
    onSaved();
  }

  async function handleRemoveLogo() {
    setLogoDataUrl(null);
  }

  return (
    <Modal open={open} onClose={onClose} title="Impostazioni Autoscuola">
      <div className="space-y-5">
        {/* Logo upload */}
        <div>
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Logo Autoscuola</span>
          <div className="flex items-center gap-4">
            <SchoolLogo
              logoDataUrl={logoDataUrl}
              schoolName={schoolName || "Autoscuola"}
              size={64}
              rounded="rounded-2xl"
            />
            <div className="flex-1 space-y-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Carica Logo
              </button>
              {logoDataUrl && (
                <button
                  onClick={handleRemoveLogo}
                  className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 text-sm font-semibold hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Rimuovi
                </button>
              )}
              <p className="text-xs text-slate-400">
                PNG/JPG, max 500KB. Verrà mostrato in login, sidebar e area allievo.
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* School name */}
        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Nome Autoscuola</span>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className={inputCls}
            placeholder="Es. Autoscuola La Mezza"
          />
        </label>

        {/* Admin credentials */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Credenziali Admin</p>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1.5 block">Email Admin</span>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className={inputCls}
                placeholder="admin@autoscuola.it"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1.5 block">Password Admin</span>
              <input
                type="text"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className={inputCls}
                placeholder="Password di accesso admin"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva Impostazioni
          </button>
        </div>
      </div>
    </Modal>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
