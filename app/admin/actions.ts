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

export async function createSession(formData: FormData) {
  await requireAdmin();
  const titre = String(formData.get("titre") ?? "").trim();
  const lieu = String(formData.get("lieu") ?? "").trim();
  const groupeId = Number(formData.get("groupe_id"));
  const debut = String(formData.get("debut") ?? "");
  const fin = String(formData.get("fin") ?? "");
  if (!titre || !groupeId || !debut || !fin) return;

  db.prepare(
    `INSERT INTO sessions_formation (groupe_id, titre, lieu, debut, fin)
     VALUES (?, ?, ?, ?, ?)`
  ).run(groupeId, titre, lieu || null, new Date(debut).toISOString(), new Date(fin).toISOString());
  revalidatePath("/admin");
  revalidatePath("/planning");
}
