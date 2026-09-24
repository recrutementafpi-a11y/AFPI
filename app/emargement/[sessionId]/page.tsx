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

function BackLink() {
  return (
    <Link
      href="/emargement"
      className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Retour
    </Link>
  );
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
        <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-10">
          <BackLink />

          <div className="bg-white border border-slate-200 rounded-2xl p-7 mt-5">
            <span className="inline-flex text-xs font-bold px-3 py-1.5 rounded-full bg-afpi-red-tint text-afpi-red-dark mb-4">
              Séance en cours
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 leading-snug">
              {formationSession.module_nom}
            </h1>
            <p className="text-slate-500 text-sm mt-1.5">
              {formatDate(formationSession.debut)} · {CRENEAU_LABEL[formationSession.creneau]}
              {formationSession.lieu ? ` · ${formationSession.lieu}` : ""}
            </p>

            <div className="border-t border-slate-100 mt-6 pt-6">
              {mySignature ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="h-9 w-9 rounded-full bg-afpi-green-tint flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#288d68" strokeWidth="2.2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <p className="text-afpi-green font-bold">
                      Présence signée le {new Date(mySignature.signed_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mySignature.signature}
                    alt="Signature enregistrée"
                    className="border border-slate-200 rounded-xl bg-white max-w-xs"
                  />
                </div>
              ) : (
                <SignaturePad sessionId={sessionId} />
              )}
            </div>
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
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-10">
        <BackLink />

        <div className="flex items-center justify-between mt-5 mb-1">
          <h1 className="text-2xl font-extrabold text-slate-900">{formationSession.module_nom}</h1>
          <Link
            href={`/admin/export?sessionId=${sessionId}`}
            className="inline-flex items-center gap-2 text-sm font-bold rounded-lg border border-slate-200 text-slate-700 px-4 py-2 hover:bg-slate-50 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exporter en CSV
          </Link>
        </div>
        <p className="text-slate-500 text-sm mb-3">
          {formatDate(formationSession.debut)} · {CRENEAU_LABEL[formationSession.creneau]}
          {formationSession.lieu ? ` · ${formationSession.lieu}` : ""} · Groupe {formationSession.groupe_nom}
        </p>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Inscrits</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stagiaires.length}</p>
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-afpi-green inline-block" /> Signés
            </p>
            <p className="text-2xl font-extrabold text-afpi-green mt-0.5">{signedCount}</p>
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-afpi-sky inline-block" /> En attente
            </p>
            <p className="text-2xl font-extrabold text-[#0b7bae] mt-0.5">{stagiaires.length - signedCount}</p>
          </div>
        </div>

        <ul className="space-y-2.5">
          {stagiaires.map((s) => (
            <li
              key={s.stagiaire_id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-bold text-slate-900">
                  {s.prenom} {s.nom}
                </p>
                {s.signed_at && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Signé le {new Date(s.signed_at).toLocaleString("fr-FR")}
                  </p>
                )}
              </div>
              {s.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.signature}
                  alt={`Signature de ${s.prenom} ${s.nom}`}
                  className="h-11 border border-slate-200 rounded-lg bg-white"
                />
              ) : (
                <span className="text-xs font-bold text-[#0b7bae] bg-afpi-sky-tint px-3 py-1.5 rounded-full">
                  En attente
                </span>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
