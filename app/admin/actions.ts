"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

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
  db.prepare("INSERT INTO groupes (nom) VALUES (?)").run(nom);
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

  db.prepare(
    `INSERT INTO sessions_formation (groupe_id, module_id, formateur_id, lieu, date, creneau, debut, fin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(groupeId, moduleId, formateurId, lieu || null, date, creneau, debut.toISOString(), fin.toISOString());
  revalidatePath("/admin");
  revalidatePath("/planning");
}
