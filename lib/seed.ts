import bcrypt from "bcryptjs";
import db from "./db";

function hash(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

export function seed() {
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (userCount.c > 0) {
    console.log("Déjà initialisé, seed ignoré.");
    return;
  }

  const insertGroupe = db.prepare("INSERT INTO groupes (nom) VALUES (?)");
  const groupeId = insertGroupe.run("BTS SIO 2026 - Alternance").lastInsertRowid as number;

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, nom, prenom, groupe_id)
    VALUES (@email, @password_hash, @role, @nom, @prenom, @groupe_id)
  `);

  insertUser.run({
    email: "admin@afpi-formation.com",
    password_hash: hash("Admin123!"),
    role: "admin",
    nom: "Dupont",
    prenom: "Sylvie",
    groupe_id: null,
  });

  const formateur = insertUser.run({
    email: "formateur@afpi-formation.com",
    password_hash: hash("Formateur123!"),
    role: "formateur",
    nom: "Martin",
    prenom: "Jean",
    groupe_id: null,
  });

  const stagiaires = [
    { email: "lea.bernard@example.com", nom: "Bernard", prenom: "Léa" },
    { email: "karim.saidi@example.com", nom: "Saïdi", prenom: "Karim" },
    { email: "chloe.roux@example.com", nom: "Roux", prenom: "Chloé" },
  ];

  const stagiaireIds: number[] = [];
  for (const s of stagiaires) {
    const r = insertUser.run({
      email: s.email,
      password_hash: hash("Stagiaire123!"),
      role: "stagiaire",
      nom: s.nom,
      prenom: s.prenom,
      groupe_id: groupeId,
    });
    stagiaireIds.push(r.lastInsertRowid as number);
  }

  const insertSession = db.prepare(`
    INSERT INTO sessions_formation (groupe_id, formateur_id, titre, lieu, debut, fin)
    VALUES (@groupe_id, @formateur_id, @titre, @lieu, @debut, @fin)
  `);

  const today = new Date();
  const fmt = (d: Date) => d.toISOString();

  const mkDate = (dayOffset: number, hour: number, min = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, min, 0, 0);
    return fmt(d);
  };

  const seances = [
    { offset: 0, titre: "Base de données relationnelles", h1: 9, h2: 12 },
    { offset: 0, titre: "Atelier SQL avancé", h1: 13, h2: 17 },
    { offset: 1, titre: "Réseaux - TP configuration", h1: 9, h2: 12 },
    { offset: 2, titre: "Développement web - React", h1: 9, h2: 17 },
    { offset: 7, titre: "Cybersécurité - Sensibilisation", h1: 9, h2: 12 },
  ];

  for (const s of seances) {
    insertSession.run({
      groupe_id: groupeId,
      formateur_id: formateur.lastInsertRowid,
      titre: s.titre,
      lieu: "Centre AFPI - Salle 204",
      debut: mkDate(s.offset, s.h1),
      fin: mkDate(s.offset, s.h2),
    });
  }

  console.log("Seed terminé.");
  console.log("Comptes de démo :");
  console.log("  admin@afpi-formation.com / Admin123!");
  console.log("  formateur@afpi-formation.com / Formateur123!");
  console.log("  lea.bernard@example.com / Stagiaire123!");
  console.log("  karim.saidi@example.com / Stagiaire123!");
  console.log("  chloe.roux@example.com / Stagiaire123!");
}

seed();
