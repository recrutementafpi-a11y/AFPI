// Génère LivretFormation-AFPI-Gravelines.docx (A3 paysage, polices Anton/Roboto intégrées)
const fs = require("fs");
const D = require("docx");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, WidthType,
  ShadingType, BorderStyle, AlignmentType, VerticalAlign, HeightRule, PageOrientation,
  CharacterSet, TableLayoutType, SectionType } = D;

const IMG = "word_img/", FONT = "polices/";
const INK = "231F20", GREY = "D2D2D2", LIGHT = "F2F2F2", BLUE = "008AD0", RED = "FF0000";
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NB = { top: none, bottom: none, left: none, right: none };
const W = 23811, HALF = 11905, H = 16700;           // A3 paysage en twips
const px = (pt) => Math.round(pt * 4 / 3);

const run = (t, o = {}) => new TextRun({ text: t, font: o.font || "Roboto", size: (o.size || 12) * 2,
  color: o.color || INK, ...(o.extra || {}) });
const para = (t, o = {}) => new Paragraph({
  alignment: o.align, spacing: { before: o.before || 0, after: o.after || 0, line: o.line },
  indent: o.indent, border: o.border, run: { size: (o.size || 12) * 2 },
  children: Array.isArray(t) ? t : [run(t, o)] });
const anton = (t, size = 40, o = {}) => para(t, { font: "Anton", size, ...o });
const bold = (t, size = 12, o = {}) => para(t, { font: "Roboto Bold", size, ...o });
const ital = (t, size = 12, o = {}) => para(t, { font: "Roboto Italic", size, ...o });
const empty = (after = 0) => para("", { size: 1, after });
const img = (file, wpt, hpt, type) => new Paragraph({ alignment: AlignmentType.CENTER, children: [
  new ImageRun({ type, data: fs.readFileSync(IMG + file), transformation: { width: px(wpt), height: px(hpt) } })] });
const imgLeft = (file, wpt, hpt, type) => new Paragraph({ children: [
  new ImageRun({ type, data: fs.readFileSync(IMG + file), transformation: { width: px(wpt), height: px(hpt) } })] });

const cell = (children, w, o = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA }, borders: NB, children: children.length ? children : [empty()],
  verticalAlign: o.v || VerticalAlign.TOP, columnSpan: o.span, rowSpan: o.rowSpan,
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: "auto" } : undefined,
  margins: o.margins || { top: 0, bottom: 0, left: o.left ?? 0, right: o.right ?? 0 } });
const row = (cells, h) => new TableRow({ cantSplit: true, children: cells,
  height: h ? { value: h, rule: HeightRule.EXACT } : undefined });
const table = (rows, widths, o = {}) => new Table({ width: { size: widths.reduce((a, b) => a + b), type: WidthType.DXA },
  columnWidths: widths, layout: TableLayoutType.FIXED, rows, indent: o.indent && { size: o.indent, type: WidthType.DXA },
  borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none } });
const pt = (n) => Math.round(n * 20);
const grey = (wpt, hpt, label = "") => table([row([cell(label ? [para(label, { size: 9, color: "7A7A7A", align: AlignmentType.CENTER })] : [],
  pt(wpt), { fill: GREY, v: VerticalAlign.CENTER })], pt(hpt))], [pt(wpt)]);
const rule = (color = BLUE) => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 36, color, space: 0 } },
  spacing: { after: 0 }, children: [] });
const LOREM = "Ellab ipidunt aut et dis inullame volorias dolore es modigen iandae. Neque si re aborepe rchilit et accum eos alia cupta dit doles il eliquam facium et re dolore et exerori ssitate velis aut eius recti dolenientios explaudis nonesent volora vel eost, tem debitissus nus eatusae pratias et qui atium et quam ipici cus est acerum aut re, unt, sed ut as apererit rest, eumendi blautem. Nem soluptur, simpostore, si berum sam dolorro magnit aut offici rernam dolut reium et maiossit quaturis in prepudit repudit iatiam num corruptaspe nisqui consenis cus voluptio. Et voluptas mo estia simint eumquia vernate mporehenia quam volorro tem erem laborero omnistios alit asitaes tiorrov idellabo.";
const LOREM2 = "Ullut pra doluptusam harum cuscipid utemquid qui to cus as aut quosti te voluptaqui restiberum harunt qui optat harci blantur";

const page = (children, first) => ({
  properties: { type: SectionType.NEXT_PAGE, page: { size: { width: 16838, height: 23811, orientation: PageOrientation.LANDSCAPE },
    margin: { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0 } } }, children });
const full = (left, right, o = {}) => table([row([cell(left, o.lw || HALF, { left: pt(o.pl ?? 28), right: pt(o.pr ?? 28), margins: o.lm }),
  cell(right, W - (o.lw || HALF), { left: pt(o.pl2 ?? 28), right: pt(o.pr2 ?? 28) })], H)], [o.lw || HALF, W - (o.lw || HALF)]);

// ------------------------------------------------------------------ page 1
const p1 = page([full(
  [empty(pt(14)), img("logo_haut.png", 135, 88, "png"), empty(pt(10)), img("carte.png", 446, 294, "png"),
   para("Les centres de formations sur le territoire", { size: 8, align: AlignmentType.CENTER, before: pt(8) }),
   empty(pt(36)), anton("Mission Emploi Formation Gravelines", 16, { align: AlignmentType.CENTER }),
   para("9 Rue de l’industrie , Gravelines, France, 59820", { size: 8.5, align: AlignmentType.CENTER, before: pt(8) }),
   para("a.cossart@ville-gravelines.fr", { size: 8.5, align: AlignmentType.CENTER }),
   empty(pt(205)), rule(), empty(pt(14)),
   para("mentions légales, crédits, etc....", { size: 8, align: AlignmentType.CENTER })],
  [empty(pt(26)), anton("Livret", 40, { after: 0, line: 340 }), anton("Formation", 40),
   empty(pt(10)),
   table([row([cell([empty(pt(180)), ...["Logistique", "Commerce", "Industrie", "Tertiaire", "BTP", "...", "..."]
     .map((t) => para(t, { size: 14, align: AlignmentType.RIGHT, right: 0, line: 300, indent: { right: pt(4) } }))], pt(426),
     { fill: GREY })], pt(405))], [pt(426)], { indent: pt(60) }),
   empty(pt(110)), rule(), empty(pt(18)), img("logo_bas.png", 132, 85, "png")], { pl: 20 })]);

// ------------------------------------------------------------------ page 2
const sommaire = [["Se former à Gravelines", 1], ["Les centres de formation", 1], ["BTP CFA"], ["Laho Formation"],
  ["Afpi Région Dunkerquoise"], ["Afpi Alternance"], ["Trihom"], ["Onet"], ["Groupe Pascal"], ["Carte et contact", 1]];
const p2 = page([table([row([
  cell([empty(pt(24)), table([row([cell([empty()], pt(86), { fill: GREY }),
      cell([anton("Edito", 40, { align: AlignmentType.RIGHT }), para(LOREM, { size: 8.5, align: AlignmentType.JUSTIFIED, before: pt(4), line: 245 })],
        pt(260), { left: pt(10) })], pt(140))], [pt(86), pt(260)]),
    para(LOREM.slice(150) + " " + LOREM2, { size: 8.5, align: AlignmentType.JUSTIFIED, line: 245, before: pt(6) }),
    bold("Nom Prénom", 8, { align: AlignmentType.RIGHT, before: pt(18) }), ital("fonction, etc...", 8, { align: AlignmentType.RIGHT }),
    empty(pt(24)), grey(374, 120)], HALF, { left: pt(30), right: pt(30) }),
  cell([empty(pt(100)), anton("Sommaire", 32, { before: pt(40) }), empty(pt(10)),
    ...sommaire.map(([t, b]) => (b ? bold(t, 10) : para(t, { size: 10 })))], 9300, { left: pt(30) }),
  cell([empty()], W - HALF - 9300, { fill: GREY })], H)], [HALF, 9300, W - HALF - 9300])]);

// ------------------------------------------------------------------ page 3
const legend = [["CAP", "CERTIFICAT D’APTITUDE PROFESSIONNELLE", "CQP", "CERTIFICAT DE QUALIFICATION PROFESSIONNELLE"],
  ["BP", "BREVET PROFESSIONNEL", "", ""], ["TP", "TITRE PROFESSIONNEL", "", ""], ["CS", "CERTIFICATS DE SPECIALISATION", "", ""]];
const chip = (t) => cell([para(t, { font: "Roboto Medium", size: 8, align: AlignmentType.CENTER })], pt(30), { fill: GREY, v: VerticalAlign.CENTER });
const gap = (w) => cell([empty()], w);
const legRow = (r) => row([chip(r[0]), cell([para(r[1], { size: 7.5, line: 200 })], pt(120), { left: pt(5), v: VerticalAlign.CENTER }),
  r[2] ? chip(r[2]) : cell([empty()], pt(30), { fill: GREY }), cell([para(r[3], { size: 7.5, line: 200 })], pt(120), { left: pt(5), v: VerticalAlign.CENTER })], pt(26));
const p3 = page([table([row([
  cell([table([row([cell([empty()], pt(167), { fill: GREY, rowSpan: 2 }), cell([anton("Se former à Gravelines", 28)], pt(400), { left: pt(8) })], pt(200)),
      row([cell([bold("Titre", 15, { after: pt(8) }), para(LOREM + " " + LOREM2, { size: 8, line: 240 })], pt(400), { left: pt(8) })], pt(220))],
      [pt(167), pt(400)]),
    empty(pt(24)), bold("Ellab ipidunt aut et dis inullame volorias dolore es modigen iandae. Neque si re aborepe rchilit et accum eos alia cupta dit doles.", 10, { indent: { left: pt(10) } })],
    HALF, { left: pt(20) }),
  cell([table([row([cell([para("infos à compléter :", { font: "Roboto Bold", size: 7, color: RED }),
        ...["Comment se former, se reconvertir ?", "Accompagnement et Financement", "Contacts utiles concernant la formation", "Orientation Professionelle", "Transition Pro", "service emploi, ect…"]
          .map((t) => para(t, { font: "Roboto Bold", size: 7, color: RED }))], pt(260)),
      cell([grey(178, 100), empty(pt(12)), grey(178, 100), empty(pt(12)), grey(178, 100)], pt(178), { left: pt(20) })], pt(330))],
      [pt(260), pt(190)]),
    empty(pt(100)),
    table([row([cell([anton("Guide et légendes", 20, { before: pt(4) }), empty(pt(6)),
      table(legend.map(legRow), [pt(30), pt(120), pt(30), pt(120)]),
      empty(pt(6))], pt(400), { fill: "E4E4E4", left: pt(12) })], pt(160))], [pt(400)]),
    para("Nomenclature des formation par niveau avec code couleur", { font: "Roboto Medium", size: 7, color: RED, align: AlignmentType.CENTER, before: pt(4) })],
    W - HALF, { left: pt(30) })], H)], [HALF, W - HALF])]);

// ------------------------------------------------------------------ page 4 (fiche AFPI Gravelines)
const tag = (t, w) => cell([bold(t, 8.5, { align: AlignmentType.CENTER })], pt(w), { fill: GREY, v: VerticalAlign.CENTER });
const sp = (w) => cell([empty()], pt(w));
const chiffre = (v, l) => [cell([empty()], pt(42), { fill: GREY }),
  cell([bold(v, 16), bold(l, 12)], pt(190), { left: pt(10) })];
const fig = (a, b) => row([...chiffre(...a), sp(10), ...chiffre(...b)], pt(41));
const ens = (txt) => row([cell([empty()], pt(41), { fill: GREY }), cell([para(txt, { size: 9, line: 230 })], pt(260), { left: pt(14) })], pt(50));
const body4 = "L'antenne des Rives de l'Aa est un site de 1 700 m² de l'AFPI Région Dunkerquoise, implanté à Gravelines. Elle accueille 70 à 90 stagiaires par jour autour de plateaux techniques dédiés : maintenance (machines tournantes, robinetterie), chaudronnerie blanche et soudage sur inox et thermoplastiques, conduite d'engins de chantier et amiante.";
const body4b = "Côté tertiaire : bureautique, vente, comptabilité-gestion, langues, assistant(e) de direction, ressources humaines, qualité-sécurité-environnement et développement personnel.";
const body4c = "L'AFPI fait partie du réseau Pôle Formation des Industries Technologiques et est certifiée Qualiopi.";
const metiers = ["Chaudronnier, soudeur", "Tuyauteur", "Électricien", "Agent de maintenance", "Conducteur d'engins de chantier", "Désamiantage", "Assistant(e) de direction", "Comptabilité, gestion, RH"];
const p4 = page([table([row([
  cell([imgLeft("haut.jpg", 595, 220, "jpg"), empty(pt(8)),
    anton("AFPI - Antenne de Gravelines", 40, { before: pt(0), indent: { left: pt(28) } }), empty(pt(8)),
    table([row([sp(28), tag("INDUSTRIE", 119), sp(17), tag("TERTIAIRE", 155), sp(17), tag("SÉCURITÉ", 169)], pt(26))],
      [pt(28), pt(119), pt(17), pt(155), pt(17), pt(169)]),
    empty(pt(36)),
    bold("Se former à l'industrie et au tertiaire à Gravelines", 12, { indent: { left: pt(147) }, after: pt(4) }),
    para(body4, { size: 9, indent: { left: pt(147), right: pt(25) }, line: 260 }),
    para(body4b, { size: 9, indent: { left: pt(147), right: pt(25) }, line: 260, before: pt(4) }),
    para(body4c, { size: 9, indent: { left: pt(147), right: pt(25) }, line: 260, before: pt(4) }),
    empty(pt(50)),
    table([fig(["1 700 m²", "de centre de formation"], ["70 à 90", "stagiaires accueillis par jour"]), row([sp(1)], pt(40)),
      fig(["500 m²", "d'atelier chaudronnerie, soudage"], ["2 000 m²", "d'aire extérieure engins"])],
      [pt(42), pt(190), pt(10), pt(42), pt(190)], { indent: pt(147) })], HALF),
  cell([empty(pt(23)),
    table([row([cell([bold("Enseignement", 12), empty(pt(8)),
        table([ens("[Enseignement : texte à compléter]"), row([cell([empty()], pt(41))], pt(16)), ens("[Enseignement : texte à compléter]"), row([cell([empty()], pt(41))], pt(16)), ens("[Enseignement : texte à compléter]")], [pt(41), pt(260)]),
        empty(pt(24)), bold("Vie quotidienne", 12), empty(pt(8)),
        table([ens("[Vie quotidienne : texte à compléter]"), row([cell([empty()], pt(41))], pt(16)), ens("[Vie quotidienne : texte à compléter]")], [pt(41), pt(260)])], pt(310)),
      cell([img("a.jpg", 187, 199, "jpg"), empty(pt(29)), img("b.jpg", 186, 144, "jpg")], pt(200), { left: pt(10) })], pt(430))],
      [pt(310), pt(200)], { indent: pt(26) }),
    table([row([cell([empty(pt(29)), img("c.jpg", 210, 322, "jpg")], pt(240), { left: pt(0) }),
      cell([anton("Les métiers", 40, { color: "9A9A9A", indent: { left: pt(50) }, extra: undefined }), empty(pt(20)),
        ...metiers.map((t) => para([run("•   ", { font: "Roboto Medium", size: 11 }), run(t, { font: "Roboto Medium", size: 11 })], { indent: { left: pt(50) }, after: pt(1) }))],
        pt(347), { fill: LIGHT })], pt(379))], [pt(240), pt(347)])],
    W - HALF, { left: 0 })], H)], [HALF, W - HALF])]);

// ------------------------------------------------------------------ page 5
const pill = (t, w, h) => cell([bold(t, 8, { align: AlignmentType.CENTER })], pt(w), { fill: GREY, v: VerticalAlign.CENTER });
const card = () => table([row([
  cell([grey(108, 108)], pt(117)),
  cell([bold("[Intitulé de la formation]", 12, { before: pt(4) }), ital("[Descriptif de la formation, 3 à 4 lignes]", 9, { before: pt(4), line: 230 })], pt(325), { left: pt(8) }),
  cell([table([row([pill("[Dipl.]", 50), cell([empty()], pt(8)), pill("[Dipl.]", 50)], pt(27))], [pt(50), pt(8), pt(50)]), empty(pt(8)),
    table([row([pill("[APPRENTISSAGE]", 107)], pt(26))], [pt(107)]), empty(pt(8)),
    table([row([pill("[Durée]", 107)], pt(26))], [pt(107)])], pt(126), { left: pt(4) })], pt(109))], [pt(117), pt(325), pt(126)]);
const spacer = (h) => empty(pt(h));
const cards = (n) => Array.from({ length: n }).flatMap((_, i) => [card(), spacer(i < n - 1 ? 40 : 0)]);
const p5 = page([table([row([
  cell([anton("Les Formations", 40, { before: pt(10) }), empty(pt(14)), ...cards(5)], HALF, { left: pt(28) }),
  cell([empty(pt(41)), ...cards(4), spacer(18),
    table([row([cell([anton("Contact", 40, { color: "FFFFFF", before: pt(2) }), empty(pt(2)),
      bold("AFPI Région Dunkerquoise", 9), para("Antenne des Rives de l'Aa", { size: 9 }),
      para("Zone de la Leurette, Route du développement", { size: 9 }), para("59820 GRAVELINES", { size: 9 }), empty(pt(6)),
      para("03 28 65 59 66", { size: 9 }), para("accueil@afpi-formation.com", { size: 9 }), para("www.afpi-formation.com", { size: 9 })], pt(400), { fill: GREY, left: pt(28) }),
      cell([empty(pt(80)), table([row([cell([para("QR code", { size: 8, align: AlignmentType.CENTER, color: "7A7A7A" })], pt(86), { fill: "FFFFFF", v: VerticalAlign.CENTER })], pt(86))], [pt(86)])], pt(171), { fill: GREY })], pt(227))],
      [pt(400), pt(171)], { indent: 0 })], W - HALF, { left: pt(28), right: pt(28) })], H)], [HALF, W - HALF])]);

const font = (name, file) => ({ name, data: fs.readFileSync(FONT + file), characterSet: CharacterSet.ANSI });
const doc = new Document({
  title: "Livret Formation – Gravelines",
  fonts: [font("Anton", "Anton-Regular.ttf"), font("Roboto", "Roboto-Regular.ttf"), font("Roboto Medium", "Roboto-Medium.ttf"),
    font("Roboto Bold", "Roboto-Bold.ttf"), font("Roboto Italic", "Roboto-Italic.ttf")],
  styles: { default: { document: { run: { font: "Roboto", size: 24, color: INK } } } },
  sections: [p1, p2, p3, p4, p5] });
Packer.toBuffer(doc).then((b) => { fs.writeFileSync("LivretFormation-AFPI-Gravelines.docx", b); console.log("ok", b.length); });
