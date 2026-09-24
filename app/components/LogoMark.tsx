/**
 * Repère visuel temporaire en attendant le fichier logo AFPI réel
 * (à remplacer par app/logo-afpi.svg / .png une fois transmis).
 */
export default function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="AFPI">
      <rect width="64" height="64" rx="10" fill="var(--afpi-navy)" />
      <path d="M0 46 Q 32 62 64 46 V64 H0 Z" fill="var(--afpi-green)" opacity="0.9" />
      <text
        x="32"
        y="34"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="22"
        fill="white"
      >
        AFPI
      </text>
    </svg>
  );
}
