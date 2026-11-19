import { useState } from "react";
import {
  Shield, User, ArrowRight, Loader2, Mail, Lock, AlertCircle,
  UserPlus, Monitor, Phone, IdCard, GraduationCap,
} from "lucide-react";
import { useAuth, type SignUpData } from "@/lib/useAuth";
import { useSettings } from "@/lib/useSettings";
import { SchoolLogo } from "@/components/SchoolLogo";
import { verifyClassroomPin } from "@/lib/storage";
import { LICENSE_CATEGORIES } from "@/lib/format";

interface LoginScreenProps {
  onClassroomAccess: () => void;
}

type Tab = "login" | "register" | "classroom";

export function LoginScreen({ onClassroomAccess }: LoginScreenProps) {
  const { signIn, signUp } = useAuth();
  const { settings } = useSettings();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regFiscalCode, setRegFiscalCode] = useState("");
  const [regLicense, setRegLicense] = useState<string>("B");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Classroom PIN
  const [pin, setPin] = useState("");

  const schoolName = settings?.school_name ?? "Autoscuola";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Inserisci email e password");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) setError(error);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError("Nome, email e password sono obbligatori");
      return;
    }
    if (regPassword.length < 6) {
      setError("La password deve avere almeno 6 caratteri");
      return;
    }
    setLoading(true);
    const data: SignUpData = {
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone.trim(),
      fiscal_code: regFiscalCode.trim(),
      license_category: regLicense,
    };
    const { error } = await signUp(data);
    setLoading(false);
    if (error) setError(error);
  }

  async function handleClassroom(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pin.trim()) {
      setError("Inserisci il PIN");
      return;
    }
    setLoading(true);
    const valid = await verifyClassroomPin(pin.trim());
    setLoading(false);
    if (valid) {
      onClassroomAccess();
    } else {
      setError("PIN non corretto");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <SchoolLogo
              logoDataUrl={settings?.logo_url}
              schoolName={schoolName}
              size={64}
              rounded="rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{schoolName}</h1>
          <p className="text-slate-400 text-sm mt-1">Area Riservata — Gestione Didattica</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          {/* Tab toggle */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-5">
            <TabButton active={tab === "login"} onClick={() => { setTab("login"); setError(null); }} icon={Shield} label="Accedi" color="blue" />
            <TabButton active={tab === "register"} onClick={() => { setTab("register"); setError(null); }} icon={UserPlus} label="Registrati" color="emerald" />
            <TabButton active={tab === "classroom"} onClick={() => { setTab("classroom"); setError(null); }} icon={Monitor} label="Aula" color="amber" />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-rose-300 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* LOGIN */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className={inputCls("blue")}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={inputCls("blue")}
                />
              </div>
              <button type="submit" disabled={loading} className={btnCls("blue")}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Accedi
              </button>
            </form>
          )}

          {/* REGISTER */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nome e Cognome"
                  className={inputCls("emerald")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Telefono"
                    className={inputCls("emerald")}
                  />
                </div>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={regFiscalCode}
                    onChange={(e) => setRegFiscalCode(e.target.value)}
                    placeholder="Codice Fiscale"
                    className={inputCls("emerald")}
                  />
                </div>
              </div>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <select
                  value={regLicense}
                  onChange={(e) => setRegLicense(e.target.value)}
                  className={inputCls("emerald")}
                >
                  {LICENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>Patente {c}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Email"
                  className={inputCls("emerald")}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Password (min 6 caratteri)"
                  className={inputCls("emerald")}
                />
              </div>
              <button type="submit" disabled={loading} className={btnCls("emerald")}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Registrati
              </button>
            </form>
          )}

          {/* CLASSROOM PIN */}
          {tab === "classroom" && (
            <form onSubmit={handleClassroom} className="space-y-3">
              <div className="text-center mb-2">
                <Monitor className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                <p className="text-slate-300 text-sm">Inserisci il PIN per accedere alla Modalità Aula</p>
              </div>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN Aula"
                maxLength={10}
                className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button type="submit" disabled={loading} className={btnCls("amber")}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Monitor className="w-4 h-4" />}
                Entra in Aula
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active, onClick, icon: Icon, label, color,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Shield;
  label: string;
  color: "blue" | "emerald" | "amber";
}) {
  const activeColor = {
    blue: "bg-blue-600 text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-600 text-white",
  };
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
        active ? activeColor[color] : "text-slate-400 hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function inputCls(ring: "blue" | "emerald"): string {
  const ringColor = ring === "blue" ? "focus:ring-blue-500" : "focus:ring-emerald-500";
  return `w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 ${ringColor} focus:border-transparent`;
}

function btnCls(color: "blue" | "emerald" | "amber"): string {
  const bg = {
    blue: "bg-blue-600 hover:bg-blue-700",
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    amber: "bg-amber-600 hover:bg-amber-700",
  };
  return `w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-50 ${bg[color]}`;
}
