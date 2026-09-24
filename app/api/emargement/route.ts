import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notifier, idsAdmins } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || session.role !== "stagiaire") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { sessionId, signature } = await req.json();
  if (typeof sessionId !== "number" || typeof signature !== "string") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!signature.startsWith("data:image/png;base64,")) {
    return NextResponse.json({ error: "Format de signature invalide." }, { status: 400 });
  }

  const formationSession = db
    .prepare(
      `SELECT s.id, s.groupe_id, s.formateur_id, m.nom as module_nom
       FROM sessions_formation s JOIN modules m ON m.id = s.module_id
       WHERE s.id = ?`
    )
    .get(sessionId) as
    | { id: number; groupe_id: number; formateur_id: number | null; module_nom: string }
    | undefined;
  if (!formationSession) {
    return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });
  }

  const stagiaire = db
    .prepare("SELECT groupe_id FROM users WHERE id = ?")
    .get(session.userId) as { groupe_id: number | null } | undefined;
  if (!stagiaire || stagiaire.groupe_id !== formationSession.groupe_id) {
    return NextResponse.json(
      { error: "Vous n'appartenez pas au groupe de cette séance." },
      { status: 403 }
    );
  }

  db.prepare(
    `INSERT INTO emargements (session_id, stagiaire_id, signature, signed_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(session_id, stagiaire_id) DO UPDATE SET signature = excluded.signature, signed_at = datetime('now')`
  ).run(sessionId, session.userId, signature);

  const destinataires = [...idsAdmins(), ...(formationSession.formateur_id ? [formationSession.formateur_id] : [])];
  notifier(
    destinataires,
    "signature",
    `${session.prenom} ${session.nom} a signé sa présence pour ${formationSession.module_nom}.`,
    sessionId
  );

  return NextResponse.json({ ok: true });
}
