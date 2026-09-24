import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import AppHeader from "@/app/components/AppHeader";
import {
  createGroupe,
  regenererCode,
  createStagiaire,
  createFormateur,
  createModule,
  assignModule,
  createSession,
} from "./actions";

interface Groupe {
  id: number;
  nom: string;
  code_inscription: string | null;
}

interface ModuleRow {
  id: number;
  nom: string;
}

interface FormateurRow {
  id: number;
  prenom: string;
  nom: string;
}

interface UserRow {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  groupe_nom: string | null;
  modules: string | null;
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session.userId || session.role !== "admin") redirect("/login");

  const groupes = db
    .prepare("SELECT id, nom, code_inscription FROM groupes ORDER BY nom")
    .all() as Groupe[];
  const modules = db.prepare("SELECT id, nom FROM modules ORDER BY nom").all() as ModuleRow[];
  const formateurs = db
    .prepare("SELECT id, prenom, nom FROM users WHERE role = 'formateur' ORDER BY nom")
    .all() as FormateurRow[];
  const users = db
    .prepare(
      `SELECT u.id, u.prenom, u.nom, u.email, u.role, g.nom as groupe_nom,
              (SELECT GROUP_CONCAT(m.nom, ', ') FROM formateur_modules fm
               JOIN modules m ON m.id = fm.module_id WHERE fm.formateur_id = u.id) as modules
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
            Gestion des groupes, modules, formateurs, stagiaires et séances (prototype de
            démonstration).
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
              <button className="text-sm rounded bg-afpi-navy hover:bg-afpi-navy-dark text-white px-3 py-1.5">
                Créer
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Nouveau module</h2>
            <form action={createModule} className="space-y-2">
              <input
                name="nom"
                required
                placeholder="Ex : Soudure MIG/MAG"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="text-sm rounded bg-afpi-navy hover:bg-afpi-navy-dark text-white px-3 py-1.5">
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
              <button className="text-sm rounded bg-afpi-navy hover:bg-afpi-navy-dark text-white px-3 py-1.5">
                Créer
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Nouveau formateur</h2>
            <form action={createFormateur} className="space-y-2">
              <div className="flex gap-2">
                <input name="prenom" required placeholder="Prénom" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                <input name="nom" required placeholder="Nom" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <input name="email" type="email" required placeholder="Email" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="password" placeholder="Mot de passe (par défaut Formateur123!)" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              <button className="text-sm rounded bg-afpi-navy hover:bg-afpi-navy-dark text-white px-3 py-1.5">
                Créer
              </button>
            </form>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Affecter un module à un formateur</h2>
          <form action={assignModule} className="flex flex-wrap gap-2 items-end">
            <select name="formateur_id" required className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">Formateur...</option>
              {formateurs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.prenom} {f.nom}
                </option>
              ))}
            </select>
            <select name="module_id" required className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">Module...</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
            <button className="text-sm rounded bg-afpi-navy hover:bg-afpi-navy-dark text-white px-3 py-1.5">
              Affecter
            </button>
          </form>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Nouvelle séance</h2>
          <form action={createSession} className="grid sm:grid-cols-2 gap-2">
            <select name="module_id" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2">
              <option value="">Module...</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
            <select name="formateur_id" className="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2">
              <option value="">Formateur...</option>
              {formateurs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.prenom} {f.nom}
                </option>
              ))}
            </select>
            <input name="lieu" placeholder="Lieu (ex: Atelier Soudure - Halle A)" className="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
            <select name="groupe_id" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2">
              <option value="">Groupe...</option>
              {groupes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom}
                </option>
              ))}
            </select>
            <label className="text-xs text-slate-600">
              Date
              <input name="date" type="date" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm mt-1" />
            </label>
            <label className="text-xs text-slate-600">
              Créneau
              <select name="creneau" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm mt-1">
                <option value="">Choisir...</option>
                <option value="matin">Matin · 8h-12h</option>
                <option value="apres-midi">Après-midi · 13h-16h</option>
              </select>
            </label>
            <button className="text-sm rounded bg-afpi-navy hover:bg-afpi-navy-dark text-white px-3 py-1.5 sm:col-span-2 w-fit">
              Créer la séance
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-1">Codes d&apos;inscription stagiaires</h2>
          <p className="text-slate-600 text-sm mb-3">
            À communiquer aux stagiaires d&apos;un groupe pour qu&apos;ils créent leur compte
            eux-mêmes sur la page <span className="font-mono">/inscription</span>.
          </p>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-2">Groupe</th>
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {groupes.map((g) => (
                  <tr key={g.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{g.nom}</td>
                    <td className="px-4 py-2 font-mono font-semibold text-afpi-navy">
                      {g.code_inscription ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <form action={regenererCode}>
                        <input type="hidden" name="groupe_id" value={g.id} />
                        <button className="text-xs rounded border border-slate-300 px-2 py-1 hover:bg-slate-100">
                          Régénérer
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  <th className="px-4 py-2">Groupe / Modules</th>
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
                    <td className="px-4 py-2 text-slate-600">
                      {u.role === "formateur" ? u.modules ?? "—" : u.groupe_nom ?? "—"}
                    </td>
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
