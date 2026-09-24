"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { genererCodeInscription } from "@/lib/codes";
import { notifier, destinatairesGroupe } from "@/lib/notifications";
import { importerEvenementsICal, type ImportResult } from "@/lib/planningImport";

async function requireAdmin() {
  const session = await getSession();
  if (!session.userId || session.role !== "admin") {
    throw new Error("Non autorisé.");
  }
}

export async function createGroupe(formData: FormData) {
  await requireAdmin();
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return;
  let code = genererCodeInscription(nom);
  for (let tentative = 0; tentative < 5; tentative++) {
    const existe = db.prepare("SELECT 1 FROM groupes WHERE code_inscription = ?").get(code);
    if (!existe) break;
    code = genererCodeInscription(nom);
  }
  db.prepare("INSERT INTO groupes (nom, code_inscription) VALUES (?, ?)").run(nom, code);
  revalidatePath("/admin");
}

export async function regenererCode(formData: FormData) {
  await requireAdmin();
  const groupeId = Number(formData.get("groupe_id"));
  const groupe = db.prepare("SELECT nom FROM groupes WHERE id = ?").get(groupeId) as
    | { nom: string }
    | undefined;
  if (!groupe) return;
  let code = genererCodeInscription(groupe.nom);
  for (let tentative = 0; tentative < 5; tentative++) {
    const existe = db.prepare("SELECT 1 FROM groupes WHERE code_inscription = ?").get(code);
    if (!existe) break;
    code = genererCodeInscription(groupe.nom);
  }
  db.prepare("UPDATE groupes SET code_inscription = ? WHERE id = ?").run(code, groupeId);
  revalidatePath("/admin");
}

export async function createStagiaire(formData: FormData) {
  await requireAdmin();
  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const groupeId = Number(formData.get("groupe_id"));
  const password = String(formData.get("password") ?? "").trim() || "Stagiaire123!";
  if (!prenom || !nom || !email || !groupeId) return;

  db.prepare(
    `INSERT INTO users (email, password_hash, role, nom, prenom, groupe_id)
     VALUES (?, ?, 'stagiaire', ?, ?, ?)`
  ).run(email, bcrypt.hashSync(password, 10), nom, prenom, groupeId);
  revalidatePath("/admin");
}

export async function createFormateur(formData: FormData) {
  await requireAdmin();
  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim() || "Formateur123!";
  if (!prenom || !nom || !email) return;

  db.prepare(
    `INSERT INTO users (email, password_hash, role, nom, prenom, groupe_id)
     VALUES (?, ?, 'formateur', ?, ?, NULL)`
  ).run(email, bcrypt.hashSync(password, 10), nom, prenom);
  revalidatePath("/admin");
}

export async function createModule(formData: FormData) {
  await requireAdmin();
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return;
  db.prepare("INSERT INTO modules (nom) VALUES (?)").run(nom);
  revalidatePath("/admin");
}

export async function assignModule(formData: FormData) {
  await requireAdmin();
  const formateurId = Number(formData.get("formateur_id"));
  const moduleId = Number(formData.get("module_id"));
  if (!formateurId || !moduleId) return;
  db.prepare(
    "INSERT OR IGNORE INTO formateur_modules (formateur_id, module_id) VALUES (?, ?)"
  ).run(formateurId, moduleId);
  revalidatePath("/admin");
}

const CRENEAUX = {
  matin: { h1: 8, h2: 12 },
  "apres-midi": { h1: 13, h2: 16 },
} as const;

export async function createSession(formData: FormData) {
  await requireAdmin();
  const moduleId = Number(formData.get("module_id"));
  const formateurId = Number(formData.get("formateur_id")) || null;
  const lieu = String(formData.get("lieu") ?? "").trim();
  const groupeId = Number(formData.get("groupe_id"));
  const date = String(formData.get("date") ?? "");
  const creneau = String(formData.get("creneau") ?? "");
  if (!moduleId || !groupeId || !date || !(creneau === "matin" || creneau === "apres-midi")) return;

  const { h1, h2 } = CRENEAUX[creneau];
  const debut = new Date(`${date}T${String(h1).padStart(2, "0")}:00:00`);
  const fin = new Date(`${date}T${String(h2).padStart(2, "0")}:00:00`);

  const result = db
    .prepare(
      `INSERT INTO sessions_formation (groupe_id, module_id, formateur_id, lieu, date, creneau, debut, fin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(groupeId, moduleId, formateurId, lieu || null, date, creneau, debut.toISOString(), fin.toISOString());

  const module_ = db.prepare("SELECT nom FROM modules WHERE id = ?").get(moduleId) as
    | { nom: string }
    | undefined;
  const dateLabel = debut.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
  notifier(
    destinatairesGroupe(groupeId, formateurId),
    "seance_creee",
    `Nouvelle séance ajoutée à votre planning : ${module_?.nom ?? "Module"} le ${dateLabel}.`,
    Number(result.lastInsertRowid)
  );

  revalidatePath("/admin");
  revalidatePath("/planning");
}

export async function supprimerSession(formData: FormData) {
  await requireAdmin();
  const sessionId = Number(formData.get("session_id"));
  if (!sessionId) return;

  const seance = db
    .prepare(
      `SELECT s.groupe_id, s.formateur_id, s.debut, m.nom as module_nom
       FROM sessions_formation s JOIN modules m ON m.id = s.module_id
       WHERE s.id = ?`
    )
    .get(sessionId) as
    | { groupe_id: number; formateur_id: number | null; debut: string; module_nom: string }
    | undefined;
  if (!seance) return;

  db.prepare("DELETE FROM presences WHERE session_id = ?").run(sessionId);
  db.prepare("DELETE FROM emargements WHERE session_id = ?").run(sessionId);
  db.prepare("DELETE FROM notifications WHERE session_id = ?").run(sessionId);
  db.prepare("DELETE FROM sessions_formation WHERE id = ?").run(sessionId);

  const dateLabel = new Date(seance.debut).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  notifier(
    destinatairesGroupe(seance.groupe_id, seance.formateur_id),
    "seance_annulee",
    `Séance annulée : ${seance.module_nom} du ${dateLabel} a été retirée du planning.`
  );

  revalidatePath("/admin");
  revalidatePath("/planning");
}

export async function importerPlanningICal(formData: FormData) {
  await requireAdmin();

  const groupeId = Number(formData.get("groupe_id"));
  const formateurId = Number(formData.get("formateur_id")) || null;
  const url = String(formData.get("ics_url") ?? "").trim();
  const icsText = String(formData.get("ics_text") ?? "").trim();

  if (!groupeId || (!url && !icsText)) {
    redirect(
      `/admin?import=error&message=${encodeURIComponent(
        "Choisissez un groupe et renseignez soit une URL, soit un contenu iCal."
      )}`
    );
  }

  let result: ImportResult | null = null;
  let errorMessage: string | null = null;
  try {
    const texte = icsText || (await (await fetch(url)).text());
    result = await importerEvenementsICal(texte, groupeId, formateurId);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Échec de l'import du planning.";
  }

  if (errorMessage || !result) {
    redirect(`/admin?import=error&message=${encodeURIComponent(errorMessage ?? "Import invalide.")}`);
  }

  if (result.createdSessionIds.length > 0) {
    notifier(
      destinatairesGroupe(groupeId, formateurId),
      "seance_creee",
      `${result.createdSessionIds.length} nouvelle(s) séance(s) importée(s) dans votre planning.`
    );
  }

  revalidatePath("/admin");
  revalidatePath("/planning");
  redirect(
    `/admin?import=ok&created=${result.created}&updated=${result.updated}&ignored=${result.ignored}`
  );
}
