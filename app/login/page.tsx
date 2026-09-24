"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur de connexion.");
        return;
      }
      router.push("/planning");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex">
      <div className="hidden lg:flex lg:w-[480px] shrink-0 bg-afpi-navy text-white p-12 flex-col justify-between">
        <div className="bg-white rounded-xl p-3 inline-flex self-start">
          <Image
            src="/logo-afpi.png"
            alt="AFPI Région Dunkerquoise · UIMM Pôle Formation Flandre Maritime"
            width={111}
            height={49}
            className="h-11 w-auto"
          />
        </div>
        <div className="flex flex-col gap-5 max-w-sm">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
            Le planning et l&apos;émargement de vos formations en métallurgie, tertiaire et sécurité, enfin
            numériques.
          </h1>
          <p className="text-blue-100 leading-relaxed">
            Soudure, CACES, habilitations, bureautique, management ou secourisme : consultez vos séances,
            signez votre présence en un geste, et suivez votre parcours en temps réel.
          </p>
        </div>
        <div className="text-sm text-blue-200/80 flex flex-col gap-1">
          <span>AFPI — Région Dunkerquoise</span>
          <span>Espace stagiaires · Espace formateurs</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 lg:hidden">
            <Image
              src="/logo-afpi.png"
              alt="AFPI Région Dunkerquoise · UIMM Pôle Formation Flandre Maritime"
              width={278}
              height={122}
              className="mx-auto mb-3"
              priority
            />
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-900">Bienvenue</h2>
            <p className="text-slate-500 text-sm mt-1">Connectez-vous à votre espace AFPI.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-afpi-navy/25 focus:border-afpi-navy"
                placeholder="prenom.nom@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-afpi-navy/25 focus:border-afpi-navy"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-afpi-red-dark">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-afpi-red hover:bg-afpi-red-dark disabled:opacity-60 text-white font-bold py-3 text-sm transition-colors"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Vous êtes stagiaire et n&apos;avez pas encore de compte ?{" "}
            <Link href="/inscription" className="text-afpi-navy font-semibold hover:underline">
              Créer mon compte
            </Link>
          </p>

          <div className="mt-8 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="font-bold text-slate-700 mb-1.5">Comptes de démonstration :</p>
            <p>admin@afpi-formation.com / Admin123!</p>
            <p>formateur@afpi-formation.com / Formateur123!</p>
            <p>lea.bernard@example.com / Stagiaire123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
