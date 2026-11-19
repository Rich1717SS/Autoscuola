import { GraduationCap } from "lucide-react";

interface SchoolLogoProps {
  logoDataUrl: string | null | undefined;
  schoolName: string;
  size?: number;
  className?: string;
  iconClassName?: string;
  rounded?: string;
}

export function SchoolLogo({
  logoDataUrl,
  schoolName,
  size = 40,
  className = "",
  iconClassName = "",
  rounded = "rounded-xl",
}: SchoolLogoProps) {
  if (logoDataUrl) {
    return (
      <img
        src={logoDataUrl}
        alt={schoolName}
        className={`${rounded} object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`${rounded} bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <GraduationCap
        className={`text-white ${iconClassName}`}
        strokeWidth={1.8}
        style={{ width: size * 0.6, height: size * 0.6 }}
      />
    </div>
  );
}
