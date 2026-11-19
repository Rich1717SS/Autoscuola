export type StudentStatus = "teoria" | "pratica";
export type LessonType = "autostrada" | "extraurbana" | "notturna" | "normale";
export type PaymentKind = "acconto" | "saldo" | "extra";
export type ExamOutcome = "in_programma" | "superato" | "non_superato";

export interface Student {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  fiscal_code: string | null;
  license_category: string;
  registry_number: string | null;
  total_fee: number | null;
  status: StudentStatus;
  foglio_rosa_date: string | null;
  foglio_rosa_expiry: string | null;
  theory_attempts_used: number;
  theory_passed: boolean;
  missing_documents: string[];
  created_at: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string | null;
  visible_to_students: boolean;
  created_at: string;
}

export interface ChapterMaterial {
  id: string;
  chapter_id: string;
  storage_path: string;
  file_name: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface StudentChapter {
  id: string;
  student_id: string;
  chapter_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface TheoryExam {
  id: string;
  student_id: string;
  attempt_number: number;
  exam_date: string;
  passed: boolean;
  notes: string | null;
  created_at: string;
}

export interface DrivingLesson {
  id: string;
  student_id: string;
  lesson_date: string;
  duration_minutes: number;
  lesson_type: LessonType;
  notes: string | null;
  is_extra_paid: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  kind: PaymentKind;
  description: string | null;
  movement_date: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  chapter_id: string;
  student_id: string;
  session_date: string;
  present: boolean;
  created_at: string;
}

export interface SchoolSettings {
  id: number;
  school_name: string;
  logo_url: string | null;
  classroom_pin: string;
  created_at: string;
}

export interface Exam {
  id: string;
  student_id: string;
  exam_type: "teoria" | "pratica";
  exam_date: string;
  exam_time: string | null;
  location: string | null;
  notes: string | null;
  outcome: ExamOutcome;
  created_at: string;
}

export interface LicenseRenewal {
  id: string;
  name: string;
  phone: string | null;
  license_category: string | null;
  documents_complete: boolean;
  doc_patente_scadua: boolean;
  doc_carta_identita: boolean;
  doc_codice_fiscale: boolean;
  doc_fototessera: boolean;
  doc_pagopa: boolean;
  missing_docs_notes: string | null;
  total_amount: number | null;
  amount_paid: number;
  medical_date: string | null;
  notes: string | null;
  created_at: string;
}
