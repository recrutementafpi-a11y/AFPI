import db from "@/lib/db";

export type NotificationType =
  | "seance_creee"
  | "seance_annulee"
  | "signature"
  | "presence_validee"
  | "presence_absente";

const insertStmt = db.prepare(
  `INSERT INTO notifications (user_id, type, message, session_id) VALUES (?, ?, ?, ?)`
);

export function notifier(
  userIds: number[],
  type: NotificationType,
  message: string,
  sessionId: number | null = null
) {
  const uniqueIds = [...new Set(userIds)];
  for (const userId of uniqueIds) {
    insertStmt.run(userId, type, message, sessionId);
  }
}

/** Stagiaires d'un groupe + son formateur, hors un éventuel utilisateur à exclure. */
export function destinatairesGroupe(groupeId: number, formateurId: number | null, exclude?: number) {
  const stagiaires = db
    .prepare("SELECT id FROM users WHERE groupe_id = ? AND role = 'stagiaire'")
    .all(groupeId) as { id: number }[];
  const ids = stagiaires.map((s) => s.id);
  if (formateurId) ids.push(formateurId);
  return ids.filter((id) => id !== exclude);
}

export function idsAdmins(exclude?: number) {
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as { id: number }[];
  return admins.map((a) => a.id).filter((id) => id !== exclude);
}
