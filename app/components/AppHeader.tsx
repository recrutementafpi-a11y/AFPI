"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
    <header className="bg-afpi-navy text-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/planning" className="flex items-center gap-3">
            <Image
              src="/logo-afpi.png"
              alt="AFPI Région Dunkerquoise · UIMM Pôle Formation Flandre Maritime"
              width={111}
              height={49}
              className="h-10 w-auto rounded bg-white px-1 py-0.5"
            />
            <span className="font-bold text-lg tracking-tight hidden sm:inline">
              Espace stagiaires
            </span>
          </Link>
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
            className="rounded bg-afpi-navy-dark hover:opacity-90 px-3 py-1.5 transition-opacity"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
