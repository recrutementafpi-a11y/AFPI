import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import AppHeader from "@/app/components/AppHeader";

interface SessionRow {
  id: number;
  titre: string;
  debut: string;
  fin: string;
  groupe_nom: string;
  signed: number;
  total_stagiaires: number;
  my_signature: number;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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
        `SELECT s.id, s.titre, s.debut, s.fin, g.nom as groupe_nom,
                0 as signed, 0 as total_stagiaires,
                (SELECT COUNT(*) FROM emargements e WHERE e.session_id = s.id AND e.stagiaire_id = ?) as my_signature
         FROM sessions_formation s
         JOIN groupes g ON g.id = s.groupe_id
         WHERE s.groupe_id = ? AND datetime(s.debut) <= datetime('now')
         ORDER BY s.debut DESC`
      )
      .all(session.userId, user?.groupe_id ?? -1) as SessionRow[];
  } else {
    rows = db
      .prepare(
        `SELECT s.id, s.titre, s.debut, s.fin, g.nom as groupe_nom,
                (SELECT COUNT(*) FROM emargements e WHERE e.session_id = s.id) as signed,
                (SELECT COUNT(*) FROM users u WHERE u.groupe_id = s.groupe_id AND u.role = 'stagiaire') as total_stagiaires,
                0 as my_signature
         FROM sessions_formation s
         JOIN groupes g ON g.id = s.groupe_id
         ORDER BY s.debut DESC`
      )
      .all() as SessionRow[];
  }

  return (
    <>
      <AppHeader prenom={session.prenom!} nom={session.nom!} role={session.role} />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Émargement</h1>
        <p className="text-slate-600 text-sm mb-6">
          {session.role === "stagiaire"
            ? "Signez votre présence pour chaque séance."
            : "Suivi des signatures par séance."}
        </p>

        {rows.length === 0 && (
          <p className="text-slate-500 bg-white border border-slate-200 rounded p-6 text-center">
            Aucune séance à émarger pour le moment.
          </p>
        )}

        <ul className="space-y-2">
          {rows.map((s) => (
            <li
              key={s.id}
              className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium text-slate-900">{s.titre}</p>
                <p className="text-sm text-slate-600">
                  {formatDateTime(s.debut)} – {formatDateTime(s.fin)}
                </p>
                {session.role !== "stagiaire" && (
                  <p className="text-xs text-slate-500 mt-1">
                    Groupe {s.groupe_nom} · {s.signed}/{s.total_stagiaires} signatures
                  </p>
                )}
              </div>
              <a
                href={`/emargement/${s.id}`}
                className={`shrink-0 text-sm rounded px-3 py-1.5 transition-colors ${
                  session.role === "stagiaire" && s.my_signature
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-900 hover:bg-blue-800 text-white"
                }`}
              >
                {session.role === "stagiaire"
                  ? s.my_signature
                    ? "Signé ✓"
                    : "Signer"
                  : "Voir le détail"}
              </a>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
