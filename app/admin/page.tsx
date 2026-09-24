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

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-afpi-navy/25 focus:border-afpi-navy";
const primaryBtnClass =
  "text-sm font-bold rounded-lg bg-afpi-red hover:bg-afpi-red-dark text-white px-4 py-2.5 transition-colors";
const cardClass = "bg-white border border-slate-200 rounded-2xl p-6";

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

  const stagiaireCount = users.filter((u) => u.role === "stagiaire").length;

  return (
    <>
      <AppHeader prenom={session.prenom!} nom={session.nom!} role={session.role} />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10 space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Administration</h1>
          <p className="text-slate-500 text-sm">
            Gestion des groupes, modules, formateurs, stagiaires et séances (prototype de
            démonstration).
          </p>
        </div>

        <section className="flex gap-4">
          <div className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Groupes</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{groupes.length}</p>
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Modules</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{modules.length}</p>
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Formateurs</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{formateurs.length}</p>
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Stagiaires</p>
            <p className="text-2xl font-extrabold text-afpi-navy mt-0.5">{stagiaireCount}</p>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-5">
          <div className={cardClass}>
            <h2 className="font-extrabold text-slate-900 mb-4">Nouveau groupe</h2>
            <form action={createGroupe} className="space-y-3">
              <input name="nom" required placeholder="Nom du groupe" className={inputClass} />
              <button className={primaryBtnClass}>Créer</button>
            </form>
          </div>

          <div className={cardClass}>
            <h2 className="font-extrabold text-slate-900 mb-4">Nouveau module</h2>
            <form action={createModule} className="space-y-3">
              <input name="nom" required placeholder="Ex : Soudure MIG/MAG" className={inputClass} />
              <button className={primaryBtnClass}>Créer</button>
            </form>
          </div>

          <div className={cardClass}>
            <h2 className="font-extrabold text-slate-900 mb-4">Nouveau stagiaire</h2>
            <form action={createStagiaire} className="space-y-3">
              <div className="flex gap-2">
                <input name="prenom" required placeholder="Prénom" className={inputClass} />
                <input name="nom" required placeholder="Nom" className={inputClass} />
              </div>
              <input name="email" type="email" required placeholder="Email" className={inputClass} />
              <input
                name="password"
                placeholder="Mot de passe (par défaut Stagiaire123!)"
                className={inputClass}
              />
              <select name="groupe_id" required className={inputClass}>
                <option value="">Groupe...</option>
                {groupes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nom}
                  </option>
                ))}
              </select>
              <button className={primaryBtnClass}>Créer</button>
            </form>
          </div>

          <div className={cardClass}>
            <h2 className="font-extrabold text-slate-900 mb-4">Nouveau formateur</h2>
            <form action={createFormateur} className="space-y-3">
              <div className="flex gap-2">
                <input name="prenom" required placeholder="Prénom" className={inputClass} />
                <input name="nom" required placeholder="Nom" className={inputClass} />
              </div>
              <input name="email" type="email" required placeholder="Email" className={inputClass} />
              <input
                name="password"
                placeholder="Mot de passe (par défaut Formateur123!)"
                className={inputClass}
              />
              <button className={primaryBtnClass}>Créer</button>
            </form>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="font-extrabold text-slate-900 mb-4">Affecter un module à un formateur</h2>
          <form action={assignModule} className="flex flex-wrap gap-2.5 items-end">
            <select name="formateur_id" required className={`${inputClass} w-auto`}>
              <option value="">Formateur...</option>
              {formateurs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.prenom} {f.nom}
                </option>
              ))}
            </select>
            <select name="module_id" required className={`${inputClass} w-auto`}>
              <option value="">Module...</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
            <button className={primaryBtnClass}>Affecter</button>
          </form>
        </section>

        <section className={cardClass}>
          <h2 className="font-extrabold text-slate-900 mb-4">Nouvelle séance</h2>
          <form action={createSession} className="grid sm:grid-cols-2 gap-2.5">
            <select name="module_id" required className={`${inputClass} sm:col-span-2`}>
              <option value="">Module...</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
            <select name="formateur_id" className={`${inputClass} sm:col-span-2`}>
              <option value="">Formateur...</option>
              {formateurs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.prenom} {f.nom}
                </option>
              ))}
            </select>
            <input
              name="lieu"
              placeholder="Lieu (ex: Atelier Soudure - Halle A)"
              className={`${inputClass} sm:col-span-2`}
            />
            <select name="groupe_id" required className={`${inputClass} sm:col-span-2`}>
              <option value="">Groupe...</option>
              {groupes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom}
                </option>
              ))}
            </select>
            <label className="text-xs font-bold text-slate-600">
              Date
              <input name="date" type="date" required className={`${inputClass} mt-1`} />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Créneau
              <select name="creneau" required className={`${inputClass} mt-1`}>
                <option value="">Choisir...</option>
                <option value="matin">Matin · 8h-12h</option>
                <option value="apres-midi">Après-midi · 13h-16h</option>
              </select>
            </label>
            <button className={`${primaryBtnClass} sm:col-span-2 w-fit`}>Créer la séance</button>
          </form>
        </section>

        <section>
          <h2 className="font-extrabold text-slate-900 mb-1">Codes d&apos;inscription stagiaires</h2>
          <p className="text-slate-500 text-sm mb-4">
            À communiquer aux stagiaires d&apos;un groupe pour qu&apos;ils créent leur compte
            eux-mêmes sur la page <span className="font-mono">/inscription</span>.
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  <th className="px-5 pt-5 pb-3">Groupe</th>
                  <th className="px-5 pt-5 pb-3">Code</th>
                  <th className="px-5 pt-5 pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {groupes.map((g) => (
                  <tr key={g.id} className="border-t border-slate-100">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{g.nom}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-afpi-navy">
                      {g.code_inscription ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <form action={regenererCode}>
                        <input type="hidden" name="groupe_id" value={g.id} />
                        <button className="text-xs font-bold rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition-colors">
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
          <h2 className="font-extrabold text-slate-900 mb-4">Utilisateurs ({users.length})</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  <th className="px-5 pt-5 pb-3">Nom</th>
                  <th className="px-5 pt-5 pb-3">Email</th>
                  <th className="px-5 pt-5 pb-3">Rôle</th>
                  <th className="px-5 pt-5 pb-3">Groupe / Modules</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {u.prenom} {u.nom}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                    <td className="px-5 py-3.5 text-slate-500 capitalize">{u.role}</td>
                    <td className="px-5 py-3.5 text-slate-500">
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
