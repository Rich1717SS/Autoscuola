import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, BookOpen, Monitor, LogOut, Menu, X,
  Calendar, Settings as SettingsIcon, RefreshCw, ClipboardCheck,
} from "lucide-react";
import { useSettings } from "@/lib/useSettings";
import { SchoolLogo } from "@/components/SchoolLogo";
import { SettingsModal } from "@/components/admin/SettingsModal";

export type AdminSection = "dashboard" | "esami" | "didattica" | "rinnovi" | "presenze" | "aula";

interface AdminShellProps {
  section: AdminSection;
  onSectionChange: (s: AdminSection) => void;
  onLogout: () => void;
  onOpenClassroom: () => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: AdminSection; label: string; icon: typeof LayoutDashboard; desc: string }[] = [
  { id: "dashboard", label: "Dashboard Allievi", icon: LayoutDashboard, desc: "Gestione allievi" },
  { id: "esami", label: "Calendario Esami", icon: Calendar, desc: "Esami fissati" },
  { id: "didattica", label: "Didattica", icon: BookOpen, desc: "25 Capitoli" },
  { id: "rinnovi", label: "Rinnovi Patente", icon: RefreshCw, desc: "Pratiche rinnovo" },
  { id: "presenze", label: "Registro Presenze", icon: ClipboardCheck, desc: "Lezioni e presenze" },
  { id: "aula", label: "Modalità Aula", icon: Monitor, desc: "Proiettore" },
];

export function AdminShell({ section, onSectionChange, onLogout, onOpenClassroom, children }: AdminShellProps) {
  const { settings, reload } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const schoolName = settings?.school_name ?? "Autoscuola";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900 fixed inset-y-0 left-0 z-30">
        <SidebarContent
          section={section}
          onSectionChange={onSectionChange}
          onLogout={onLogout}
          onOpenClassroom={onOpenClassroom}
          schoolName={schoolName}
          logoUrl={settings?.logo_url}
          onOpenSettings={() => setShowSettings(true)}
        />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 animate-slide-up">
            <div className="flex justify-end p-4">
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <SidebarContent
              section={section}
              onSectionChange={(s) => {
                onSectionChange(s);
                setMobileOpen(false);
              }}
              onLogout={onLogout}
              onOpenClassroom={() => {
                onOpenClassroom();
                setMobileOpen(false);
              }}
              schoolName={schoolName}
              logoUrl={settings?.logo_url}
              onOpenSettings={() => {
                setShowSettings(true);
                setMobileOpen(false);
              }}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-slate-900 text-white px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="text-white">
            <Menu className="w-6 h-6" />
          </button>
          <SchoolLogo logoDataUrl={settings?.logo_url} schoolName={schoolName} size={28} rounded="rounded-lg" />
          <span className="font-semibold text-sm">{schoolName}</span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onSaved={() => {
          setShowSettings(false);
          reload();
        }}
      />
    </div>
  );
}

function SidebarContent({
  section,
  onSectionChange,
  onLogout,
  onOpenClassroom,
  schoolName,
  logoUrl,
  onOpenSettings,
}: {
  section: AdminSection;
  onSectionChange: (s: AdminSection) => void;
  onLogout: () => void;
  onOpenClassroom: () => void;
  schoolName: string;
  logoUrl: string | null | undefined;
  onOpenSettings: () => void;
}) {
  return (
    <>
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <SchoolLogo logoDataUrl={logoUrl} schoolName={schoolName} size={40} rounded="rounded-xl" />
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{schoolName}</p>
            <p className="text-slate-400 text-xs">Area Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.8} />
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-sm">{item.label}</p>
                <p className={`text-xs ${active ? "text-blue-200" : "text-slate-500"}`}>{item.desc}</p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <SettingsIcon className="w-5 h-5" strokeWidth={1.8} />
          <span className="font-semibold text-sm">Impostazioni</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.8} />
          <span className="font-semibold text-sm">Esci</span>
        </button>
      </div>
    </>
  );
}
