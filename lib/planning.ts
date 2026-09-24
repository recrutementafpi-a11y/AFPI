export type VuePlanning = "semaine" | "mois" | "annee";

export function estVuePlanning(v: unknown): v is VuePlanning {
  return v === "semaine" || v === "mois" || v === "annee";
}

function debutSemaine(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const jour = (date.getDay() + 6) % 7; // 0 = lundi
  date.setDate(date.getDate() - jour);
  return date;
}

export function periode(vue: VuePlanning, ancre: Date): { debut: Date; fin: Date } {
  if (vue === "semaine") {
    const debut = debutSemaine(ancre);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 7);
    return { debut, fin };
  }
  if (vue === "mois") {
    const debut = new Date(ancre.getFullYear(), ancre.getMonth(), 1);
    const fin = new Date(ancre.getFullYear(), ancre.getMonth() + 1, 1);
    return { debut, fin };
  }
  const debut = new Date(ancre.getFullYear(), 0, 1);
  const fin = new Date(ancre.getFullYear() + 1, 0, 1);
  return { debut, fin };
}

export function decaler(vue: VuePlanning, ancre: Date, sens: 1 | -1): Date {
  const d = new Date(ancre);
  if (vue === "semaine") d.setDate(d.getDate() + 7 * sens);
  else if (vue === "mois") d.setMonth(d.getMonth() + sens);
  else d.setFullYear(d.getFullYear() + sens);
  return d;
}

export function libellePeriode(vue: VuePlanning, ancre: Date): string {
  if (vue === "semaine") {
    const { debut, fin } = periode(vue, ancre);
    const dernierJour = new Date(fin);
    dernierJour.setDate(dernierJour.getDate() - 1);
    const memesMois = debut.getMonth() === dernierJour.getMonth();
    const moisLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(dernierJour);
    return memesMois
      ? `Semaine du ${debut.getDate()} au ${dernierJour.getDate()} ${moisLabel}`
      : `Semaine du ${debut.getDate()} ${new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(debut)} au ${dernierJour.getDate()} ${moisLabel}`;
  }
  if (vue === "mois") {
    const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(ancre);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return String(ancre.getFullYear());
}

/** Palette de couleurs par module (jamais le rouge, réservé aux statuts d'action/absence). */
const PALETTE_MODULES = [
  "#1B4C9A", // bleu AFPI
  "#1C7A4B", // vert
  "#29ABE2", // bleu ciel
  "#7B4FA3", // violet
  "#B36B00", // ambre
  "#0E7A7A", // sarcelle
  "#8C4A3B", // terracotta
  "#5B6470", // ardoise
];

export function couleurModule(moduleId: number): string {
  return PALETTE_MODULES[moduleId % PALETTE_MODULES.length];
}
