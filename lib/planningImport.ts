import ical from "node-ical";
import db from "@/lib/db";

export interface ImportResult {
  created: number;
  updated: number;
  ignored: number;
  createdSessionIds: number[];
}

function texteDe(valeur: unknown): string {
  if (typeof valeur === "string") return valeur.trim();
  if (valeur && typeof valeur === "object" && "val" in valeur) {
    return String((valeur as { val: unknown }).val).trim();
  }
  return "";
}

function idModule(nom: string): number {
  db.prepare("INSERT OR IGNORE INTO modules (nom) VALUES (?)").run(nom);
  const module_ = db.prepare("SELECT id FROM modules WHERE nom = ?").get(nom) as { id: number };
  return module_.id;
}

/**
 * Importe les événements VEVENT d'un flux iCal (NetYparéo, Sowesign, ou tout
 * export .ics standard) comme séances de formation pour un groupe donné.
 * Chaque événement est identifié par son UID iCal pour permettre une
 * resynchronisation idempotente : un ré-import met à jour la séance
 * existante plutôt que d'en recréer une.
 */
export async function importerEvenementsICal(
  icsText: string,
  groupeId: number,
  formateurId: number | null
): Promise<ImportResult> {
  const calendrier = await ical.async.parseICS(icsText);

  const result: ImportResult = { created: 0, updated: 0, ignored: 0, createdSessionIds: [] };

  const insertStmt = db.prepare(
    `INSERT INTO sessions_formation
       (groupe_id, module_id, formateur_id, lieu, date, creneau, debut, fin, external_uid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const updateStmt = db.prepare(
    `UPDATE sessions_formation
     SET groupe_id = ?, module_id = ?, formateur_id = ?, lieu = ?, date = ?, creneau = ?, debut = ?, fin = ?
     WHERE id = ?`
  );
  const findStmt = db.prepare("SELECT id FROM sessions_formation WHERE external_uid = ?");

  for (const evenement of Object.values(calendrier)) {
    if (!evenement || evenement.type !== "VEVENT") continue;

    const uid = evenement.uid?.trim();
    const debut = evenement.start instanceof Date ? evenement.start : null;
    const fin = evenement.end instanceof Date ? evenement.end : debut;
    const nomModule = texteDe(evenement.summary) || "Séance importée";
    const lieu = texteDe(evenement.location) || null;

    if (!uid || !debut) {
      result.ignored += 1;
      continue;
    }

    const moduleId = idModule(nomModule);
    const creneau = debut.getHours() < 13 ? "matin" : "apres-midi";
    const dateStr = debut.toISOString().slice(0, 10);

    const existante = findStmt.get(uid) as { id: number } | undefined;
    if (existante) {
      updateStmt.run(
        groupeId,
        moduleId,
        formateurId,
        lieu,
        dateStr,
        creneau,
        debut.toISOString(),
        (fin ?? debut).toISOString(),
        existante.id
      );
      result.updated += 1;
    } else {
      const insertResult = insertStmt.run(
        groupeId,
        moduleId,
        formateurId,
        lieu,
        dateStr,
        creneau,
        debut.toISOString(),
        (fin ?? debut).toISOString(),
        uid
      );
      result.created += 1;
      result.createdSessionIds.push(Number(insertResult.lastInsertRowid));
    }
  }

  return result;
}
