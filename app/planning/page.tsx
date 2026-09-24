import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import AppHeader from "@/app/components/AppHeader";
import { estVuePlanning, periode, decaler, libellePeriode, couleurModule, type VuePlanning } from "@/lib/planning";

interface SessionRow {
  id: number;
  module_id: number;
  module_nom: string;
  creneau: "matin" | "apres-midi";
  lieu: string | null;
  debut: string;
  fin: string;
  groupe_nom: string;
  formateur_prenom: string | null;
  formateur_nom: string | null;
  ma_signature: number | null;
  mon_statut: "present" | "absent" | null;
}

const CRENEAU_LABEL: Record<SessionRow["creneau"], string> = {
  matin: "Matin · 8h-12h",
  "apres-midi": "Après-midi · 13h-16h",
};

const VUE_LABEL: Record<VuePlanning, string> = {
  semaine: "Semaine",
  mois: "Mois",
  annee: "Année",
};

function isoJour(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; date?: string }>;
}) {
  const session = await getSession();
  if (!session.userId || !session.role) redirect("/login");

  const sp = await searchParams;
  const vue: VuePlanning = estVuePlanning(sp.vue) ? sp.vue : "semaine";
  const aujourdhui = new Date();
  const ancre = sp.date && !Number.isNaN(Date.parse(sp.date)) ? new Date(sp.date) : aujourdhui;
  const { debut: debutPeriode, fin: finPeriode } = periode(vue, ancre);

  let rows: SessionRow[];
  if (session.role === "stagiaire") {
    const user = db.prepare("SELECT groupe_id FROM users WHERE id = ?").get(session.userId) as
      | { groupe_id: number | null }
      | undefined;
    rows = db
      .prepare(
        `SELECT s.id, s.module_id, m.nom as module_nom, s.creneau, s.lieu, s.debut, s.fin, g.nom as groupe_nom,
                u.prenom as formateur_prenom, u.nom as formateur_nom,
                (SELECT COUNT(*) FROM emargements e WHERE e.session_id = s.id AND e.stagiaire_id = ?) as ma_signature,
                (SELECT p.statut FROM presences p WHERE p.session_id = s.id AND p.stagiaire_id = ?) as mon_statut
         FROM sessions_formation s
         JOIN groupes g ON g.id = s.groupe_id
         JOIN modules m ON m.id = s.module_id
         LEFT JOIN users u ON u.id = s.formateur_id
         WHERE s.groupe_id = ? AND s.debut >= ? AND s.debut < ?
         ORDER BY s.debut ASC`
      )
      .all(
        session.userId,
        session.userId,
        user?.groupe_id ?? -1,
        debutPeriode.toISOString(),
        finPeriode.toISOString()
      ) as SessionRow[];
  } else {
    rows = db
      .prepare(
        `SELECT s.id, s.module_id, m.nom as module_nom, s.creneau, s.lieu, s.debut, s.fin, g.nom as groupe_nom,
                u.prenom as formateur_prenom, u.nom as formateur_nom,
                NULL as ma_signature, NULL as mon_statut
         FROM sessions_formation s
         JOIN groupes g ON g.id = s.groupe_id
         JOIN modules m ON m.id = s.module_id
         LEFT JOIN users u ON u.id = s.formateur_id
         WHERE s.debut >= ? AND s.debut < ?
         ORDER BY s.debut ASC`
      )
      .all(debutPeriode.toISOString(), finPeriode.toISOString()) as SessionRow[];
  }

  const now = aujourdhui.getTime();
  const todayKey = aujourdhui.toDateString();
  const grouped = new Map<string, SessionRow[]>();
  for (const r of rows) {
    const day = new Date(r.debut).toDateString();
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(r);
  }

  const modulesPresents = new Map<number, string>();
  for (const r of rows) modulesPresents.set(r.module_id, r.module_nom);

  const precedent = decaler(vue, ancre, -1);
  const suivant = decaler(vue, ancre, 1);

  return (
    <>
      <AppHeader prenom={session.prenom!} nom={session.nom!} role={session.role} />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Mon planning</h1>
        <p className="text-slate-500 text-sm mb-6">Séances de formation à venir et passées.</p>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="inline-flex bg-slate-100 rounded-lg p-1">
            {(["semaine", "mois", "annee"] as VuePlanning[]).map((v) => (
              <Link
                key={v}
                href={`/planning?vue=${v}&date=${isoJour(ancre)}`}
                className={`text-sm font-bold px-4 py-1.5 rounded-md transition-colors ${
                  v === vue ? "bg-white text-afpi-navy shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {VUE_LABEL[v]}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/planning?vue=${vue}&date=${isoJour(precedent)}`}
              aria-label="Période précédente"
              className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <span className="text-sm font-bold text-slate-800 min-w-[220px] text-center">
              {libellePeriode(vue, ancre)}
            </span>
            <Link
              href={`/planning?vue=${vue}&date=${isoJour(suivant)}`}
              aria-label="Période suivante"
              className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
            <Link
              href={`/planning?vue=${vue}&date=${isoJour(aujourdhui)}`}
              className="text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Aujourd&apos;hui
            </Link>
          </div>
        </div>

        {modulesPresents.size > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-6">
            {[...modulesPresents.entries()].map(([id, nom]) => (
              <span key={id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: couleurModule(id) }}
                />
                {nom}
              </span>
            ))}
          </div>
        )}

        {rows.length === 0 && (
          <p className="text-slate-500 bg-white border border-slate-200 rounded-2xl p-8 text-center">
            Aucune séance sur cette période.
          </p>
        )}

        <div className="space-y-7">
          {[...grouped.entries()].map(([day, sessions]) => {
            const isToday = day === todayKey;
            return (
              <div key={day} className="flex gap-6">
                <div className="w-20 shrink-0 flex flex-col items-center pt-1">
                  <span
                    className={`text-xs uppercase tracking-wide font-bold ${
                      isToday ? "text-afpi-red" : "text-slate-400"
                    }`}
                  >
                    {isToday
                      ? "Aujourd'hui"
                      : new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(new Date(sessions[0].debut))}
                  </span>
                  <span className={`text-2xl font-extrabold ${isToday ? "text-afpi-navy" : "text-slate-900"}`}>
                    {new Date(sessions[0].debut).getDate()}
                  </span>
                  {vue !== "semaine" && (
                    <span className="text-[11px] text-slate-400">
                      {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(new Date(sessions[0].debut))}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-2.5">
                  {sessions.map((s) => {
                    const isPast = new Date(s.fin).getTime() < now;
                    const isFuture = new Date(s.debut).getTime() > now;
                    const isCurrentToday = isToday && !isPast;

                    let label: string;
                    let badgeClass: string;

                    if (session.role !== "stagiaire") {
                      label = isPast ? "Terminée" : isCurrentToday ? "En cours" : "À venir";
                      badgeClass = isCurrentToday
                        ? "bg-afpi-red-tint text-afpi-red-dark"
                        : "bg-slate-100 text-slate-500";
                    } else if (isFuture) {
                      label = "À venir";
                      badgeClass = "bg-slate-100 text-slate-500";
                    } else if (s.mon_statut === "absent") {
                      label = "Absence enregistrée";
                      badgeClass = "bg-afpi-red-tint text-afpi-red-dark";
                    } else if (s.mon_statut === "present") {
                      label = "Présence validée";
                      badgeClass = "bg-afpi-green-tint text-afpi-green";
                    } else if (s.ma_signature) {
                      label = "Signée · en attente de validation";
                      badgeClass = "bg-afpi-sky-tint text-[#0b7bae]";
                    } else if (isCurrentToday) {
                      label = "En cours · à émarger";
                      badgeClass = "bg-afpi-red-tint text-afpi-red-dark";
                    } else {
                      label = "Non signée";
                      badgeClass = "bg-afpi-red-tint text-afpi-red-dark";
                    }

                    return (
                      <Link
                        key={s.id}
                        href={`/emargement/${s.id}`}
                        className={`flex items-center gap-4 bg-white rounded-xl p-4 transition-shadow ${
                          isCurrentToday && session.role === "stagiaire" && !s.ma_signature && !s.mon_statut
                            ? "border-[1.5px] border-afpi-red shadow-[0_2px_10px_rgba(226,0,26,0.08)]"
                            : "border border-slate-200"
                        } ${isPast && session.role !== "stagiaire" ? "opacity-70" : ""}`}
                      >
                        <span
                          className="w-1 self-stretch rounded-full shrink-0"
                          style={{ backgroundColor: couleurModule(s.module_id) }}
                        />
                        <span className="w-28 shrink-0 text-sm font-bold text-slate-700">
                          {CRENEAU_LABEL[s.creneau]}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold text-slate-900 truncate">{s.module_nom}</span>
                          <span className="block text-sm text-slate-500 truncate">
                            {s.formateur_nom ? `Formateur : ${s.formateur_prenom} ${s.formateur_nom}` : ""}
                            {s.lieu ? ` · ${s.lieu}` : ""}
                            {session.role !== "stagiaire" ? ` · Groupe ${s.groupe_nom}` : ""}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${badgeClass}`}
                        >
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
