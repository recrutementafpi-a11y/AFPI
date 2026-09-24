import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import AppHeader from "@/app/components/AppHeader";
import SignaturePad from "@/app/components/SignaturePad";

interface FormationSession {
  id: number;
  module_nom: string;
  creneau: "matin" | "apres-midi";
  lieu: string | null;
  debut: string;
  groupe_id: number;
  groupe_nom: string;
}

const CRENEAU_LABEL: Record<FormationSession["creneau"], string> = {
  matin: "Matin · 8h-12h",
  "apres-midi": "Après-midi · 13h-16h",
};

interface EmargementRow {
  stagiaire_id: number;
  prenom: string;
  nom: string;
  signature: string | null;
  signed_at: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export default async function EmargementDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await getSession();
  if (!session.userId || !session.role) redirect("/login");

  const { sessionId: sessionIdParam } = await params;
  const sessionId = Number(sessionIdParam);
  if (!Number.isInteger(sessionId)) notFound();

  const formationSession = db
    .prepare(
      `SELECT s.id, m.nom as module_nom, s.creneau, s.lieu, s.debut, s.groupe_id, g.nom as groupe_nom
       FROM sessions_formation s
       JOIN groupes g ON g.id = s.groupe_id
       JOIN modules m ON m.id = s.module_id
       WHERE s.id = ?`
    )
    .get(sessionId) as FormationSession | undefined;

  if (!formationSession) notFound();

  if (session.role === "stagiaire") {
    const stagiaire = db.prepare("SELECT groupe_id FROM users WHERE id = ?").get(session.userId) as
      | { groupe_id: number | null }
      | undefined;
    if (!stagiaire || stagiaire.groupe_id !== formationSession.groupe_id) {
      redirect("/emargement");
    }

    const mySignature = db
      .prepare("SELECT signature, signed_at FROM emargements WHERE session_id = ? AND stagiaire_id = ?")
      .get(sessionId, session.userId) as { signature: string; signed_at: string } | undefined;

    return (
      <>
        <AppHeader prenom={session.prenom!} nom={session.nom!} role={session.role} />
        <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8">
          <Link href="/emargement" className="text-sm text-afpi-navy hover:underline">
            ← Retour
          </Link>
          <h1 className="text-xl font-bold text-slate-900 mt-2 mb-1">{formationSession.module_nom}</h1>
          <p className="text-slate-600 text-sm mb-6">
            {formatDate(formationSession.debut)} · {CRENEAU_LABEL[formationSession.creneau]}
            {formationSession.lieu ? ` · ${formationSession.lieu}` : ""}
          </p>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            {mySignature ? (
              <div>
                <p className="text-green-700 font-medium mb-3">
                  ✓ Présence signée le {new Date(mySignature.signed_at).toLocaleString("fr-FR")}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mySignature.signature}
                  alt="Signature enregistrée"
                  className="border border-slate-200 rounded bg-white max-w-xs"
                />
              </div>
            ) : (
              <SignaturePad sessionId={sessionId} />
            )}
          </div>
        </main>
      </>
    );
  }

  // Formateur / admin : vue de suivi
  const stagiaires = db
    .prepare(
      `SELECT u.id as stagiaire_id, u.prenom, u.nom, e.signature, e.signed_at
       FROM users u
       LEFT JOIN emargements e ON e.session_id = ? AND e.stagiaire_id = u.id
       WHERE u.groupe_id = ? AND u.role = 'stagiaire'
       ORDER BY u.nom ASC`
    )
    .all(sessionId, formationSession.groupe_id) as EmargementRow[];

  const signedCount = stagiaires.filter((s) => s.signature).length;

  return (
    <>
      <AppHeader prenom={session.prenom!} nom={session.nom!} role={session.role} />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8">
        <Link href="/emargement" className="text-sm text-afpi-navy hover:underline">
          ← Retour
        </Link>
        <div className="flex items-center justify-between mt-2 mb-1">
          <h1 className="text-xl font-bold text-slate-900">{formationSession.module_nom}</h1>
          <Link
            href={`/admin/export?sessionId=${sessionId}`}
            className="text-sm rounded border border-afpi-navy text-afpi-navy px-3 py-1.5 hover:bg-afpi-navy/5"
          >
            Exporter en CSV
          </Link>
        </div>
        <p className="text-slate-600 text-sm mb-6">
          {formatDate(formationSession.debut)} · {CRENEAU_LABEL[formationSession.creneau]}
          {formationSession.lieu ? ` · ${formationSession.lieu}` : ""} · Groupe{" "}
          {formationSession.groupe_nom} · {signedCount}/{stagiaires.length} signatures
        </p>

        <ul className="space-y-2">
          {stagiaires.map((s) => (
            <li
              key={s.stagiaire_id}
              className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {s.prenom} {s.nom}
                </p>
                {s.signed_at && (
                  <p className="text-xs text-slate-500">
                    Signé le {new Date(s.signed_at).toLocaleString("fr-FR")}
                  </p>
                )}
              </div>
              {s.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.signature}
                  alt={`Signature de ${s.prenom} ${s.nom}`}
                  className="h-12 border border-slate-200 rounded bg-white"
                />
              ) : (
                <span className="text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded">
                  Non signé
                </span>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
