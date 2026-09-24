import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

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
    .prepare("SELECT id, groupe_id FROM sessions_formation WHERE id = ?")
    .get(sessionId) as { id: number; groupe_id: number } | undefined;
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

  return NextResponse.json({ ok: true });
}
