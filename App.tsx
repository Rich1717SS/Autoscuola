import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { LoginScreen } from "@/components/LoginScreen";
import { AdminShell, type AdminSection } from "@/components/admin/AdminShell";
import { StudentsDashboard } from "@/components/admin/StudentsDashboard";
import { ChaptersManager } from "@/components/admin/ChaptersManager";
import { ClassroomMode } from "@/components/admin/ClassroomMode";
import { ExamsCalendar } from "@/components/admin/ExamsCalendar";
import { LicenseRenewals } from "@/components/admin/LicenseRenewals";
import { AttendanceRegistry } from "@/components/admin/AttendanceRegistry";
import { StudentArea } from "@/components/student/StudentArea";
import { Loader2 } from "lucide-react";

function App() {
  const { session, isAdmin, student, loading, signOut, reloadStudent } = useAuth();
  const [adminSection, setAdminSection] = useState<AdminSection>("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [classroomMode, setClassroomMode] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Classroom mode (accessible via PIN from login screen)
  if (classroomMode) {
    return <ClassroomMode onExit={() => setClassroomMode(false)} />;
  }

  // Not logged in
  if (!session) {
    return <LoginScreen onClassroomAccess={() => setClassroomMode(true)} />;
  }

  // Admin
  if (isAdmin) {
    return (
      <AdminShell
        section={adminSection}
        onSectionChange={(s) => {
          setAdminSection(s);
          setSelectedStudentId(null);
        }}
        onLogout={signOut}
        onOpenClassroom={() => setClassroomMode(true)}
      >
        {adminSection === "dashboard" && (
          <StudentsDashboard
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
          />
        )}
        {adminSection === "esami" && (
          <ExamsCalendar
            onOpenStudent={(id) => {
              setSelectedStudentId(id);
              setAdminSection("dashboard");
            }}
          />
        )}
        {adminSection === "didattica" && <ChaptersManager />}
        {adminSection === "rinnovi" && <LicenseRenewals />}
        {adminSection === "presenze" && <AttendanceRegistry />}
        {adminSection === "aula" && <ClassroomMode onExit={() => setAdminSection("dashboard")} />}
      </AdminShell>
    );
  }

  // Student
  if (student) {
    return <StudentArea student={student} onLogout={signOut} onChanged={reloadStudent} />;
  }

  // Authenticated but no student record — show waiting state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <p className="text-slate-600 mb-2">Account registrato ma nessuna scheda allievo associata.</p>
      <p className="text-slate-400 text-sm mb-4">Contatta l'autoscuola per attivare il tuo account.</p>
      <button onClick={signOut} className="text-blue-600 font-medium">Esci</button>
    </div>
  );
}

export default App;
