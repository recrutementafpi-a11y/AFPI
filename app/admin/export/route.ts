import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || (session.role !== "admin" && session.role !== "formateur")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const sessionId = Number(req.nextUrl.searchParams.get("sessionId"));
  if (!Number.isInteger(sessionId)) {
    return NextResponse.json({ error: "Paramètre invalide." }, { status: 400 });
  }

  const formationSession = db
    .prepare("SELECT titre, debut FROM sessions_formation WHERE id = ?")
    .get(sessionId) as { titre: string; debut: string } | undefined;
  if (!formationSession) {
    return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });
  }

  const rows = db
    .prepare(
      `SELECT u.nom, u.prenom, u.email,
              CASE WHEN e.id IS NOT NULL THEN 'Présent' ELSE 'Absent' END as statut,
              e.signed_at
       FROM sessions_formation s
       JOIN users u ON u.groupe_id = s.groupe_id AND u.role = 'stagiaire'
       LEFT JOIN emargements e ON e.session_id = s.id AND e.stagiaire_id = u.id
       WHERE s.id = ?
       ORDER BY u.nom ASC`
    )
    .all(sessionId) as { nom: string; prenom: string; email: string; statut: string; signed_at: string | null }[];

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["Nom", "Prénom", "Email", "Statut", "Signé le"].map(escape).join(";");
  const lines = rows.map((r) =>
    [r.nom, r.prenom, r.email, r.statut, r.signed_at ?? ""].map(escape).join(";")
  );
  const csv = "﻿" + [header, ...lines].join("\r\n");

  const filename = `emargement_${formationSession.titre.replace(/[^a-z0-9]+/gi, "_")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
