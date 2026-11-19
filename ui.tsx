import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  color?: "blue" | "amber" | "violet" | "emerald" | "rose";
  label?: string;
  unit?: string;
}

export function ProgressBar({ value, max, color = "blue", label, unit }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  const colorMap = {
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
  };
  const trackMap = {
    blue: "bg-blue-100",
    amber: "bg-amber-100",
    violet: "bg-violet-100",
    emerald: "bg-emerald-100",
    rose: "bg-rose-100",
  };

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-slate-600">{label}</span>
          <span className="text-sm font-bold text-slate-900">
            {value}
            {unit || ""} / {max}
            {unit || ""}
          </span>
        </div>
      )}
      <div className={`h-3 ${trackMap[color]} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${colorMap[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: "blue" | "emerald" | "amber" | "rose" | "slate" | "violet";
  size?: "sm" | "md";
}

export function Badge({ children, color = "slate", size = "md" }: BadgeProps) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  const sizeMap = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${colorMap[color]} ${sizeMap[size]}`}>
      {children}
    </span>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-scale-in">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
