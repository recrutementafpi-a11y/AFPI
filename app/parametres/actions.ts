"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireUtilisateur() {
  const session = await getSession();
  if (!session.userId) {
    throw new Error("Non autorisé.");
  }
  return session;
}

function retourErreur(message: string): never {
  redirect(`/parametres?error=${encodeURIComponent(message)}`);
}

export async function mettreAJourProfil(formData: FormData) {
  const session = await requireUtilisateur();

  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!prenom || !nom || !email) {
    retourErreur("Tous les champs sont obligatoires.");
  }

  const emailPris = db
    .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
    .get(email, session.userId) as { id: number } | undefined;
  if (emailPris) {
    retourErreur("Cette adresse email est déjà utilisée par un autre compte.");
  }

  db.prepare("UPDATE users SET prenom = ?, nom = ?, email = ? WHERE id = ?").run(
    prenom,
    nom,
    email,
    session.userId
  );

  session.prenom = prenom;
  session.nom = nom;
  await session.save();

  revalidatePath("/parametres");
  redirect("/parametres?success=profil");
}

export async function changerMotDePasse(formData: FormData) {
  const session = await requireUtilisateur();

  const motDePasseActuel = String(formData.get("mot_de_passe_actuel") ?? "");
  const nouveauMotDePasse = String(formData.get("nouveau_mot_de_passe") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(session.userId) as
    | { password_hash: string }
    | undefined;

  if (!user || !bcrypt.compareSync(motDePasseActuel, user.password_hash)) {
    retourErreur("Mot de passe actuel incorrect.");
  }
  if (nouveauMotDePasse.length < 8) {
    retourErreur("Le nouveau mot de passe doit contenir au moins 8 caractères.");
  }
  if (nouveauMotDePasse !== confirmation) {
    retourErreur("La confirmation ne correspond pas au nouveau mot de passe.");
  }

  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    bcrypt.hashSync(nouveauMotDePasse, 10),
    session.userId
  );

  redirect("/parametres?success=mdp");
}
