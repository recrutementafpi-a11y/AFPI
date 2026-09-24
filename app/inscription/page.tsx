"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function InscriptionPage() {
  const router = useRouter();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codeInscription, setCodeInscription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, nom, email, password, codeInscription }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'inscription.");
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
    <div className="flex-1 flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <Image
            src="/logo-afpi.png"
            alt="AFPI Région Dunkerquoise · UIMM Pôle Formation Flandre Maritime"
            width={278}
            height={122}
            className="mx-auto mb-4"
            priority
          />
          <h1 className="text-2xl font-extrabold text-slate-900">Créer mon compte</h1>
          <p className="text-slate-500 text-sm mt-1">Espace stagiaire AFPI</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
        >
          <div className="flex gap-3">
            <div className="w-full">
              <label htmlFor="prenom" className="block text-sm font-bold text-slate-700 mb-1.5">
                Prénom
              </label>
              <input
                id="prenom"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-afpi-navy/25 focus:border-afpi-navy"
              />
            </div>
            <div className="w-full">
              <label htmlFor="nom" className="block text-sm font-bold text-slate-700 mb-1.5">
                Nom
              </label>
              <input
                id="nom"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-afpi-navy/25 focus:border-afpi-navy"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-afpi-navy/25 focus:border-afpi-navy"
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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-afpi-navy/25 focus:border-afpi-navy"
              placeholder="8 caractères minimum"
            />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-bold text-slate-700 mb-1.5">
              Code d&apos;inscription
            </label>
            <input
              id="code"
              required
              value={codeInscription}
              onChange={(e) => setCodeInscription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-afpi-navy/25 focus:border-afpi-navy"
              placeholder="Fourni par votre formateur"
            />
          </div>
          {error && <p className="text-sm text-afpi-red-dark">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-afpi-red hover:bg-afpi-red-dark disabled:opacity-60 text-white font-bold py-3 text-sm transition-colors"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-5">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-afpi-navy font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
