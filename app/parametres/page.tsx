import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import AppHeader from "@/app/components/AppHeader";
import { mettreAJourProfil, changerMotDePasse } from "./actions";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-afpi-navy/25 focus:border-afpi-navy";
const primaryBtnClass =
  "text-sm font-bold rounded-lg bg-afpi-red hover:bg-afpi-red-dark text-white px-5 py-2.5 transition-colors";
const cardClass = "bg-white border border-slate-200 rounded-2xl p-6";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  formateur: "Formateur",
  stagiaire: "Stagiaire",
};

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session.userId || !session.role) redirect("/login");
  const sp = await searchParams;

  const utilisateur = db
    .prepare("SELECT prenom, nom, email FROM users WHERE id = ?")
    .get(session.userId) as { prenom: string; nom: string; email: string };

  return (
    <>
      <AppHeader prenom={session.prenom!} nom={session.nom!} role={session.role} />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Paramètres du compte</h1>
          <p className="text-slate-500 text-sm">
            {ROLE_LABEL[session.role]} · Modifiez vos informations personnelles et votre mot de passe.
          </p>
        </div>

        {sp.success === "profil" && (
          <div className="bg-afpi-green-tint text-afpi-green text-sm font-bold rounded-xl px-5 py-4">
            Vos informations ont été mises à jour.
          </div>
        )}
        {sp.success === "mdp" && (
          <div className="bg-afpi-green-tint text-afpi-green text-sm font-bold rounded-xl px-5 py-4">
            Votre mot de passe a été changé.
          </div>
        )}
        {sp.error && (
          <div className="bg-afpi-red-tint text-afpi-red-dark text-sm font-bold rounded-xl px-5 py-4">
            {sp.error}
          </div>
        )}

        <section className={cardClass}>
          <h2 className="font-extrabold text-slate-900 mb-4">Informations personnelles</h2>
          <form action={mettreAJourProfil} className="space-y-4">
            <div className="flex gap-3">
              <div className="w-full">
                <label htmlFor="prenom" className="block text-sm font-bold text-slate-700 mb-1.5">
                  Prénom
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  required
                  defaultValue={utilisateur.prenom}
                  className={inputClass}
                />
              </div>
              <div className="w-full">
                <label htmlFor="nom" className="block text-sm font-bold text-slate-700 mb-1.5">
                  Nom
                </label>
                <input id="nom" name="nom" required defaultValue={utilisateur.nom} className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                defaultValue={utilisateur.email}
                className={inputClass}
              />
            </div>
            <button className={primaryBtnClass}>Enregistrer</button>
          </form>
        </section>

        <section className={cardClass}>
          <h2 className="font-extrabold text-slate-900 mb-1">Mot de passe</h2>
          <p className="text-slate-500 text-sm mb-4">Au moins 8 caractères.</p>
          <form action={changerMotDePasse} className="space-y-4">
            <div>
              <label
                htmlFor="mot_de_passe_actuel"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Mot de passe actuel
              </label>
              <input
                id="mot_de_passe_actuel"
                name="mot_de_passe_actuel"
                type="password"
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </div>
            <div className="flex gap-3">
              <div className="w-full">
                <label
                  htmlFor="nouveau_mot_de_passe"
                  className="block text-sm font-bold text-slate-700 mb-1.5"
                >
                  Nouveau mot de passe
                </label>
                <input
                  id="nouveau_mot_de_passe"
                  name="nouveau_mot_de_passe"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
              <div className="w-full">
                <label htmlFor="confirmation" className="block text-sm font-bold text-slate-700 mb-1.5">
                  Confirmation
                </label>
                <input
                  id="confirmation"
                  name="confirmation"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
            </div>
            <button className={primaryBtnClass}>Changer le mot de passe</button>
          </form>
        </section>
      </main>
    </>
  );
}
