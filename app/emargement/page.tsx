import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import AppHeader from "@/app/components/AppHeader";

interface SessionRow {
  id: number;
  module_nom: string;
  creneau: "matin" | "apres-midi";
  debut: string;
  groupe_nom: string;
  signed: number;
  validated: number;
  total_stagiaires: number;
  my_signature: number;
  mon_statut: "present" | "absent" | null;
}

const CRENEAU_LABEL: Record<SessionRow["creneau"], string> = {
  matin: "Matin · 8h-12h",
  "apres-midi": "Après-midi · 13h-16h",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function EmargementIndexPage() {
  const session = await getSession();
  if (!session.userId || !session.role) redirect("/login");

  let rows: SessionRow[];

  if (session.role === "stagiaire") {
    const user = db.prepare("SELECT groupe_id FROM users WHERE id = ?").get(session.userId) as
      | { groupe_id: number | null }
      | undefined;
    rows = db
      .prepare(
        `SELECT s.id, m.nom as module_nom, s.creneau, s.debut, g.nom as groupe_nom,
                0 as signed, 0 as validated, 0 as total_stagiaires,
                (SELECT COUNT(*) FROM emargements e WHERE e.session_id = s.id AND e.stagiaire_id = ?) as my_signature,
                (SELECT p.statut FROM presences p WHERE p.session_id = s.id AND p.stagiaire_id = ?) as mon_statut
         FROM sessions_formation s
         JOIN groupes g ON g.id = s.groupe_id
         JOIN modules m ON m.id = s.module_id
         WHERE s.groupe_id = ? AND datetime(s.debut) <= datetime('now')
         ORDER BY s.debut DESC`
      )
      .all(session.userId, session.userId, user?.groupe_id ?? -1) as SessionRow[];
  } else {
    rows = db
      .prepare(
        `SELECT s.id, m.nom as module_nom, s.creneau, s.debut, g.nom as groupe_nom,
                (SELECT COUNT(*) FROM emargements e WHERE e.session_id = s.id) as signed,
                (SELECT COUNT(*) FROM presences p WHERE p.session_id = s.id) as validated,
                (SELECT COUNT(*) FROM users u WHERE u.groupe_id = s.groupe_id AND u.role = 'stagiaire') as total_stagiaires,
                0 as my_signature, NULL as mon_statut
         FROM sessions_formation s
         JOIN groupes g ON g.id = s.groupe_id
         JOIN modules m ON m.id = s.module_id
         ORDER BY s.debut DESC`
      )
      .all() as SessionRow[];
  }

  return (
    <>
      <AppHeader prenom={session.prenom!} nom={session.nom!} role={session.role} />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Émargement</h1>
        <p className="text-slate-500 text-sm mb-8">
          {session.role === "stagiaire"
            ? "Signez votre présence pour chaque séance."
            : "Suivi des signatures par séance."}
        </p>

        {rows.length === 0 && (
          <p className="text-slate-500 bg-white border border-slate-200 rounded-2xl p-8 text-center">
            Aucune séance à émarger pour le moment.
          </p>
        )}

        <ul className="space-y-2.5">
          {rows.map((s) => {
            const badgeClass =
              s.mon_statut === "absent"
                ? "bg-afpi-red-tint text-afpi-red-dark"
                : s.mon_statut === "present"
                  ? "bg-afpi-green-tint text-afpi-green"
                  : s.my_signature
                    ? "bg-afpi-sky-tint text-[#0b7bae]"
                    : "bg-afpi-red hover:bg-afpi-red-dark text-white";
            const label =
              s.mon_statut === "absent"
                ? "Absence enregistrée"
                : s.mon_statut === "present"
                  ? "Présence validée ✓"
                  : s.my_signature
                    ? "Signé · en attente"
                    : "Signer";
            return (
              <li
                key={s.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{s.module_nom}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(s.debut)} · {CRENEAU_LABEL[s.creneau]}
                  </p>
                  {session.role !== "stagiaire" && (
                    <p className="text-xs text-slate-400 mt-1">
                      Groupe {s.groupe_nom} · {s.signed}/{s.total_stagiaires} signatures ·{" "}
                      {s.validated}/{s.total_stagiaires} validées
                    </p>
                  )}
                </div>
                <a
                  href={`/emargement/${s.id}`}
                  className={`shrink-0 text-sm font-bold rounded-lg px-4 py-2 transition-colors ${
                    session.role === "stagiaire"
                      ? badgeClass
                      : "bg-afpi-red hover:bg-afpi-red-dark text-white"
                  }`}
                >
                  {session.role === "stagiaire" ? label : "Voir le détail"}
                </a>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
