import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  role: "admin" | "formateur" | "stagiaire";
  nom: string;
  prenom: string;
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const user = db
    .prepare("SELECT id, email, password_hash, role, nom, prenom FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as UserRow | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.role = user.role;
  session.nom = user.nom;
  session.prenom = user.prenom;
  await session.save();

  return NextResponse.json({ ok: true, role: user.role });
}
