import bcrypt from "bcryptjs";
import db from "./db";
import { genererCodeInscription } from "./codes";

function hash(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

const CRENEAUX: Record<"matin" | "apres-midi", { h1: number; h2: number }> = {
  matin: { h1: 8, h2: 12 },
  "apres-midi": { h1: 13, h2: 16 },
};

function mkDateTime(baseDate: Date, dayOffset: number, hour: number) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function isoDate(baseDate: Date, dayOffset: number) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

export function seed() {
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (userCount.c > 0) {
    console.log("Déjà initialisé, seed ignoré.");
    return;
  }

  const nomGroupe = "CAP Réalisations Industrielles - Promo 2026";
  const codeInscription = genererCodeInscription(nomGroupe);
  const insertGroupe = db.prepare("INSERT INTO groupes (nom, code_inscription) VALUES (?, ?)");
  const groupeId = insertGroupe.run(nomGroupe, codeInscription).lastInsertRowid as number;

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

  const formateurSoudure = insertUser.run({
    email: "formateur@afpi-formation.com",
    password_hash: hash("Formateur123!"),
    role: "formateur",
    nom: "Martin",
    prenom: "Jean",
    groupe_id: null,
  });

  const formateurUsinage = insertUser.run({
    email: "formateur2@afpi-formation.com",
    password_hash: hash("Formateur123!"),
    role: "formateur",
    nom: "Lefebvre",
    prenom: "Nathalie",
    groupe_id: null,
  });

  const stagiaires = [
    { email: "lea.bernard@example.com", nom: "Bernard", prenom: "Léa" },
    { email: "karim.saidi@example.com", nom: "Saïdi", prenom: "Karim" },
    { email: "chloe.roux@example.com", nom: "Roux", prenom: "Chloé" },
  ];

  for (const s of stagiaires) {
    insertUser.run({
      email: s.email,
      password_hash: hash("Stagiaire123!"),
      role: "stagiaire",
      nom: s.nom,
      prenom: s.prenom,
      groupe_id: groupeId,
    });
  }

  const insertModule = db.prepare("INSERT INTO modules (nom) VALUES (?)");
  const modules = {
    soudure: insertModule.run("Soudure MIG/MAG").lastInsertRowid as number,
    lectureDePlans: insertModule.run("Lecture de plans industriels").lastInsertRowid as number,
    usinage: insertModule.run("Usinage conventionnel").lastInsertRowid as number,
    metrologie: insertModule.run("Métrologie et contrôle qualité").lastInsertRowid as number,
    securite: insertModule.run("Sécurité machines et EPI").lastInsertRowid as number,
    chaudronnerie: insertModule.run("Chaudronnerie industrielle").lastInsertRowid as number,
  };

  const insertAffectation = db.prepare(
    "INSERT INTO formateur_modules (formateur_id, module_id) VALUES (?, ?)"
  );
  insertAffectation.run(formateurSoudure.lastInsertRowid, modules.soudure);
  insertAffectation.run(formateurSoudure.lastInsertRowid, modules.securite);
  insertAffectation.run(formateurSoudure.lastInsertRowid, modules.chaudronnerie);
  insertAffectation.run(formateurUsinage.lastInsertRowid, modules.usinage);
  insertAffectation.run(formateurUsinage.lastInsertRowid, modules.metrologie);
  insertAffectation.run(formateurUsinage.lastInsertRowid, modules.lectureDePlans);

  const insertSession = db.prepare(`
    INSERT INTO sessions_formation (groupe_id, module_id, formateur_id, lieu, date, creneau, debut, fin)
    VALUES (@groupe_id, @module_id, @formateur_id, @lieu, @date, @creneau, @debut, @fin)
  `);

  const today = new Date();

  const seances: {
    offset: number;
    creneau: "matin" | "apres-midi";
    module: number;
    formateur: number;
    lieu: string;
  }[] = [
    { offset: 0, creneau: "matin", module: modules.soudure, formateur: formateurSoudure.lastInsertRowid as number, lieu: "Atelier Soudure - Halle A" },
    { offset: 0, creneau: "apres-midi", module: modules.securite, formateur: formateurSoudure.lastInsertRowid as number, lieu: "Salle 2" },
    { offset: 1, creneau: "matin", module: modules.usinage, formateur: formateurUsinage.lastInsertRowid as number, lieu: "Atelier Usinage - Halle B" },
    { offset: 1, creneau: "apres-midi", module: modules.metrologie, formateur: formateurUsinage.lastInsertRowid as number, lieu: "Atelier Usinage - Halle B" },
    { offset: 2, creneau: "matin", module: modules.lectureDePlans, formateur: formateurUsinage.lastInsertRowid as number, lieu: "Salle 2" },
    { offset: 7, creneau: "matin", module: modules.chaudronnerie, formateur: formateurSoudure.lastInsertRowid as number, lieu: "Atelier Soudure - Halle A" },
  ];

  for (const s of seances) {
    const { h1, h2 } = CRENEAUX[s.creneau];
    insertSession.run({
      groupe_id: groupeId,
      module_id: s.module,
      formateur_id: s.formateur,
      lieu: s.lieu,
      date: isoDate(today, s.offset),
      creneau: s.creneau,
      debut: mkDateTime(today, s.offset, h1),
      fin: mkDateTime(today, s.offset, h2),
    });
  }

  console.log("Seed terminé.");
  console.log(`Code d'inscription stagiaire pour "${nomGroupe}" : ${codeInscription}`);
  console.log("Comptes de démo :");
  console.log("  admin@afpi-formation.com / Admin123!");
  console.log("  formateur@afpi-formation.com / Formateur123! (Soudure, Sécurité, Chaudronnerie)");
  console.log("  formateur2@afpi-formation.com / Formateur123! (Usinage, Métrologie, Lecture de plans)");
  console.log("  lea.bernard@example.com / Stagiaire123!");
  console.log("  karim.saidi@example.com / Stagiaire123!");
  console.log("  chloe.roux@example.com / Stagiaire123!");
}

seed();
