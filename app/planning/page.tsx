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
  const todayKey = new Date(now).toDateString();
  const grouped = new Map<string, SessionRow[]>();
  for (const r of rows) {
    const day = new Date(r.debut).toDateString();
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(r);
  }

  return (
    <>
      <AppHeader prenom={session.prenom!} nom={session.nom!} role={session.role} />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Mon planning</h1>
        <p className="text-slate-500 text-sm mb-8">Séances de formation à venir et passées.</p>

        {rows.length === 0 && (
          <p className="text-slate-500 bg-white border border-slate-200 rounded-2xl p-8 text-center">
            Aucune séance planifiée pour le moment.
          </p>
        )}

        <div className="space-y-7">
          {[...grouped.entries()].map(([day, sessions]) => {
            const isToday = day === todayKey;
            return (
              <div key={day} className="flex gap-6">
                <div className="w-20 shrink-0 flex flex-col items-center pt-1">
                  <span
                    className={`text-xs uppercase tracking-wide font-bold ${
                      isToday ? "text-afpi-red" : "text-slate-400"
                    }`}
                  >
                    {isToday ? "Aujourd'hui" : new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(new Date(sessions[0].debut))}
                  </span>
                  <span className={`text-2xl font-extrabold ${isToday ? "text-afpi-navy" : "text-slate-900"}`}>
                    {new Date(sessions[0].debut).getDate()}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-2.5">
                  {sessions.map((s) => {
                    const isPast = new Date(s.fin).getTime() < now;
                    const isCurrentToday = isToday && !isPast;
                    const accent = isPast ? "bg-slate-300" : isCurrentToday ? "bg-afpi-red" : "bg-slate-200";
                    return (
                      <Link
                        key={s.id}
                        href={`/emargement/${s.id}`}
                        className={`flex items-center gap-4 bg-white rounded-xl p-4 transition-shadow ${
                          isCurrentToday
                            ? "border-[1.5px] border-afpi-red shadow-[0_2px_10px_rgba(226,0,26,0.08)]"
                            : "border border-slate-200"
                        } ${isPast ? "opacity-70" : ""}`}
                      >
                        <span className={`w-1 self-stretch rounded-full ${accent}`} />
                        <span className="w-28 shrink-0 text-sm font-bold text-slate-700">
                          {CRENEAU_LABEL[s.creneau]}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold text-slate-900 truncate">{s.module_nom}</span>
                          <span className="block text-sm text-slate-500 truncate">
                            {s.formateur_nom ? `Formateur : ${s.formateur_prenom} ${s.formateur_nom}` : ""}
                            {s.lieu ? ` · ${s.lieu}` : ""}
                            {session.role !== "stagiaire" ? ` · Groupe ${s.groupe_nom}` : ""}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${
                            isPast
                              ? "bg-slate-100 text-slate-500"
                              : isCurrentToday
                                ? "bg-afpi-red-tint text-afpi-red-dark"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isPast ? "Terminée · émargée" : isCurrentToday ? "En cours · à émarger" : "À venir"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
