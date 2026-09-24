import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import AppHeader from "@/app/components/AppHeader";
import { createGroupe, createStagiaire, createSession } from "./actions";

interface Groupe {
  id: number;
  nom: string;
}

interface UserRow {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  groupe_nom: string | null;
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session.userId || session.role !== "admin") redirect("/login");

  const groupes = db.prepare("SELECT id, nom FROM groupes ORDER BY nom").all() as Groupe[];
  const users = db
    .prepare(
      `SELECT u.id, u.prenom, u.nom, u.email, u.role, g.nom as groupe_nom
       FROM users u LEFT JOIN groupes g ON g.id = u.groupe_id
       ORDER BY u.role, u.nom`
    )
    .all() as UserRow[];

  return (
    <>
      <AppHeader prenom={session.prenom!} nom={session.nom!} role={session.role} />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 space-y-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Administration</h1>
          <p className="text-slate-600 text-sm">
            Gestion des groupes, comptes stagiaires et séances (prototype de démonstration).
          </p>
        </div>

        <section className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Nouveau groupe</h2>
            <form action={createGroupe} className="space-y-2">
              <input
                name="nom"
                required
                placeholder="Nom du groupe"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="text-sm rounded bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5">
                Créer
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Nouveau stagiaire</h2>
            <form action={createStagiaire} className="space-y-2">
              <div className="flex gap-2">
                <input name="prenom" required placeholder="Prénom" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                <input name="nom" required placeholder="Nom" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <input name="email" type="email" required placeholder="Email" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="password" placeholder="Mot de passe (par défaut Stagiaire123!)" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              <select name="groupe_id" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
                <option value="">Groupe...</option>
                {groupes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nom}
                  </option>
                ))}
              </select>
              <button className="text-sm rounded bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5">
                Créer
              </button>
            </form>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Nouvelle séance</h2>
          <form action={createSession} className="grid sm:grid-cols-2 gap-2">
            <input name="titre" required placeholder="Titre" className="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
            <input name="lieu" placeholder="Lieu" className="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
            <select name="groupe_id" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2">
              <option value="">Groupe...</option>
              {groupes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom}
                </option>
              ))}
            </select>
            <label className="text-xs text-slate-600">
              Début
              <input name="debut" type="datetime-local" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm mt-1" />
            </label>
            <label className="text-xs text-slate-600">
              Fin
              <input name="fin" type="datetime-local" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm mt-1" />
            </label>
            <button className="text-sm rounded bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 sm:col-span-2 w-fit">
              Créer la séance
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-3">Utilisateurs ({users.length})</h2>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-2">Nom</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Rôle</th>
                  <th className="px-4 py-2">Groupe</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      {u.prenom} {u.nom}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{u.email}</td>
                    <td className="px-4 py-2 text-slate-600">{u.role}</td>
                    <td className="px-4 py-2 text-slate-600">{u.groupe_nom ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
