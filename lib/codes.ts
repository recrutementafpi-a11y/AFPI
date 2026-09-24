export function genererCodeInscription(nomGroupe: string): string {
  const initiales = nomGroupe
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
    .map((mot) => mot.slice(0, 3))
    .slice(0, 2)
    .join("-");

  const suffixe = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${initiales || "GRP"}-${suffixe}`;
}
