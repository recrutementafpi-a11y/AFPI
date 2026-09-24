import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import AppHeader from "@/app/components/AppHeader";

interface SessionRow {
  id: number;
  module_nom: string;
  creneau: "matin" | "apres-midi";
  lieu: string | null;
  debut: string;
  fin: string;
  groupe_nom: string;
  formateur_prenom: string | null;
  formateur_nom: string | null;
}

const CRENEAU_LABEL: Record<SessionRow["creneau"], string> = {
  matin: "Matin · 8h-12h",
  "apres-midi": "Après-midi · 13h-16h",
};

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function PlanningPage() {
  const session = await getSession();
  if (!session.userId || !session.role) redirect("/login");

  let rows: SessionRow[];
  if (session.role === "stagiaire") {
    const user = db.prepare("SELECT groupe_id FROM users WHERE id = ?").get(session.userId) as
      | { groupe_id: number | null }
      | undefined;
    rows = db
      .prepare(
        `SELECT s.id, m.nom as module_nom, s.creneau, s.lieu, s.debut, s.fin, g.nom as groupe_nom,
                u.prenom as formateur_prenom, u.nom as formateur_nom
         FROM sessions_formation s
         JOIN groupes g ON g.id = s.groupe_id
         JOIN modules m ON m.id = s.module_id
         LEFT JOIN users u ON u.id = s.formateur_id
         WHERE s.groupe_id = ?
         ORDER BY s.debut ASC`
      )
      .all(user?.groupe_id ?? -1) as SessionRow[];
  } else {
    rows = db
      .prepare(
        `SELECT s.id, m.nom as module_nom, s.creneau, s.lieu, s.debut, s.fin, g.nom as groupe_nom,
                u.prenom as formateur_prenom, u.nom as formateur_nom
         FROM sessions_formation s
         JOIN groupes g ON g.id = s.groupe_id
         JOIN modules m ON m.id = s.module_id
         LEFT JOIN users u ON u.id = s.formateur_id
         ORDER BY s.debut ASC`
      )
      .all() as SessionRow[];
  }

  // eslint-disable-next-line react-hooks/purity -- rendu serveur à la demande, pas de mise en cache
  const now = Date.now();
  const grouped = new Map<string, SessionRow[]>();
  for (const r of rows) {
    const day = new Date(r.debut).toDateString();
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(r);
  }

  return (
    <>
      <AppHeader prenom={session.prenom!} nom={session.nom!} role={session.role} />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Mon planning</h1>
        <p className="text-slate-600 text-sm mb-6">
          Séances de formation à venir et passées.
        </p>

        {rows.length === 0 && (
          <p className="text-slate-500 bg-white border border-slate-200 rounded p-6 text-center">
            Aucune séance planifiée pour le moment.
          </p>
        )}

        <div className="space-y-6">
          {[...grouped.entries()].map(([day, sessions]) => (
            <div key={day}>
              <h2 className="text-sm font-semibold text-afpi-navy uppercase tracking-wide mb-2">
                {formatDay(sessions[0].debut)}
              </h2>
              <ul className="space-y-2">
                {sessions.map((s) => {
                  const isPast = new Date(s.fin).getTime() < now;
                  return (
                    <li
                      key={s.id}
                      className={`bg-white border rounded-lg p-4 flex items-start justify-between gap-4 ${
                        isPast ? "border-slate-200 opacity-60" : "border-slate-300"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-slate-900">{s.module_nom}</p>
                        <p className="text-sm text-slate-600">
                          {CRENEAU_LABEL[s.creneau]}
                          {s.lieu ? ` · ${s.lieu}` : ""}
                        </p>
                        {session.role !== "stagiaire" && (
                          <p className="text-xs text-slate-500 mt-1">Groupe : {s.groupe_nom}</p>
                        )}
                        {s.formateur_nom && (
                          <p className="text-xs text-slate-500">
                            Formateur : {s.formateur_prenom} {s.formateur_nom}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/emargement/${s.id}`}
                        className="shrink-0 text-sm rounded bg-afpi-navy hover:bg-afpi-navy-dark text-white px-3 py-1.5 transition-colors"
                      >
                        Émargement
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
