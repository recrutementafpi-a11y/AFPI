import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import AppHeader from "@/app/components/AppHeader";

interface SessionRow {
  id: number;
  titre: string;
  lieu: string | null;
  debut: string;
  fin: string;
  groupe_nom: string;
  formateur_prenom: string | null;
  formateur_nom: string | null;
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
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
        `SELECT s.id, s.titre, s.lieu, s.debut, s.fin, g.nom as groupe_nom,
                u.prenom as formateur_prenom, u.nom as formateur_nom
         FROM sessions_formation s
         JOIN groupes g ON g.id = s.groupe_id
         LEFT JOIN users u ON u.id = s.formateur_id
         WHERE s.groupe_id = ?
         ORDER BY s.debut ASC`
      )
      .all(user?.groupe_id ?? -1) as SessionRow[];
  } else {
    rows = db
      .prepare(
        `SELECT s.id, s.titre, s.lieu, s.debut, s.fin, g.nom as groupe_nom,
                u.prenom as formateur_prenom, u.nom as formateur_nom
         FROM sessions_formation s
         JOIN groupes g ON g.id = s.groupe_id
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
              <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-2">
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
                        <p className="font-medium text-slate-900">{s.titre}</p>
                        <p className="text-sm text-slate-600">
                          {formatTime(s.debut)} – {formatTime(s.fin)}
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
                        className="shrink-0 text-sm rounded bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 transition-colors"
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
