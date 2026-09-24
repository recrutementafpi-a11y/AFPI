"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import NotificationBell from "./NotificationBell";

interface AppHeaderProps {
  prenom: string;
  nom: string;
  role: "admin" | "formateur" | "stagiaire";
}

const roleLabel: Record<AppHeaderProps["role"], string> = {
  admin: "Administrateur",
  formateur: "Formateur",
  stagiaire: "Stagiaire",
};

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export default function AppHeader({ prenom, nom, role }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { href: "/planning", label: "Planning" },
    { href: "/emargement", label: "Émargement" },
    ...(role === "admin" ? [{ href: "/admin", label: "Administration" }] : []),
  ];

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-5xl px-4 h-[72px] flex items-center gap-8">
        <Link href="/planning" className="flex items-center shrink-0">
          <Image
            src="/logo-afpi.png"
            alt="AFPI Région Dunkerquoise · UIMM Pôle Formation Flandre Maritime"
            width={111}
            height={49}
            className="h-9 w-auto"
          />
        </Link>

        <nav className="hidden sm:flex gap-7 flex-1">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-bold py-2 border-b-2 transition-colors ${
                  active
                    ? "text-afpi-navy border-afpi-red"
                    : "text-slate-500 border-transparent hover:text-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 ml-auto">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-bold text-slate-900">
              {prenom} {nom}
            </span>
            <span className="text-xs text-slate-400">{roleLabel[role]}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-afpi-navy-tint text-afpi-navy flex items-center justify-center text-sm font-bold shrink-0">
            {initials(prenom, nom)}
          </div>
          <NotificationBell />
          <button
            onClick={logout}
            aria-label="Se déconnecter"
            className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
