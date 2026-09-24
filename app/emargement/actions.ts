"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireFormateurOuAdmin() {
  const session = await getSession();
  if (!session.userId || (session.role !== "formateur" && session.role !== "admin")) {
    throw new Error("Non autorisé.");
  }
  return session;
}

export async function definirPresence(formData: FormData) {
  const session = await requireFormateurOuAdmin();
  const sessionId = Number(formData.get("session_id"));
  const stagiaireId = Number(formData.get("stagiaire_id"));
  const statut = String(formData.get("statut") ?? "");
  if (!sessionId || !stagiaireId) return;

  if (statut === "present" || statut === "absent") {
    db.prepare(
      `INSERT INTO presences (session_id, stagiaire_id, statut, valide_par, valide_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(session_id, stagiaire_id)
       DO UPDATE SET statut = excluded.statut, valide_par = excluded.valide_par, valide_at = excluded.valide_at`
    ).run(sessionId, stagiaireId, statut, session.userId);
  } else {
    // Repasser en attente de validation.
    db.prepare("DELETE FROM presences WHERE session_id = ? AND stagiaire_id = ?").run(
      sessionId,
      stagiaireId
    );
  }

  revalidatePath(`/emargement/${sessionId}`);
  revalidatePath("/emargement");
  revalidatePath("/planning");
}
