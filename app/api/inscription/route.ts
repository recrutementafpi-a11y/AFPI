import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { prenom, nom, email, password, codeInscription } = await req.json();

  if (
    typeof prenom !== "string" ||
    typeof nom !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof codeInscription !== "string"
  ) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (!prenom.trim() || !nom.trim()) {
    return NextResponse.json({ error: "Prénom et nom requis." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 }
    );
  }

  const groupe = db
    .prepare("SELECT id, nom FROM groupes WHERE code_inscription = ?")
    .get(codeInscription.trim().toUpperCase()) as { id: number; nom: string } | undefined;

  if (!groupe) {
    return NextResponse.json(
      { error: "Code d'inscription invalide. Vérifiez-le auprès de votre formateur." },
      { status: 400 }
    );
  }

  const emailNormalise = email.trim().toLowerCase();
  const dejaExistant = db.prepare("SELECT 1 FROM users WHERE email = ?").get(emailNormalise);
  if (dejaExistant) {
    return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
  }

  const result = db
    .prepare(
      `INSERT INTO users (email, password_hash, role, nom, prenom, groupe_id)
       VALUES (?, ?, 'stagiaire', ?, ?, ?)`
    )
    .run(emailNormalise, bcrypt.hashSync(password, 10), nom.trim(), prenom.trim(), groupe.id);

  const session = await getSession();
  session.userId = result.lastInsertRowid as number;
  session.role = "stagiaire";
  session.nom = nom.trim();
  session.prenom = prenom.trim();
  await session.save();

  return NextResponse.json({ ok: true, groupe: groupe.nom });
}
