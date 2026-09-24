"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function AppHeader({ prenom, nom, role }: AppHeaderProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-blue-900 text-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg tracking-tight">AFPI · Espace stagiaires</span>
          <nav className="hidden sm:flex gap-4 text-sm">
            <Link href="/planning" className="hover:underline">
              Planning
            </Link>
            <Link href="/emargement" className="hover:underline">
              Émargement
            </Link>
            {role === "admin" && (
              <Link href="/admin" className="hover:underline">
                Administration
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-blue-100">
            {prenom} {nom} · {roleLabel[role]}
          </span>
          <button
            onClick={logout}
            className="rounded bg-blue-800 hover:bg-blue-700 px-3 py-1.5 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
