"""Rend les pages 4 et 5 du livret Gravelines remplissables (champs AcroForm).

Usage : python3 -I make_fillable.py <livret-source.pdf> <sortie.pdf>
Pages 1 à 3 inchangées. Texte factice et visuels BTP CFA retirés des pages 4-5.
"""
import sys
import pymupdf

SRC, OUT = sys.argv[1], sys.argv[2]
INK = (0.137, 0.122, 0.125)
GREY = (0.82, 0.82, 0.82)
d = pymupdf.open(SRC)
R = pymupdf.Rect


def wipe(p, rects, fill=False, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE,
         images=pymupdf.PDF_REDACT_IMAGE_NONE):
    for r in rects:
        p.add_redact_annot(R(r), fill=fill)
    p.apply_redactions(images=images, graphics=graphics)


def text(p, name, rect, tip, size=0, font="Helv", multi=False, center=False):
    w = pymupdf.Widget()
    w.field_type = pymupdf.PDF_WIDGET_TYPE_TEXT
    w.field_name = name
    w.field_label = tip
    w.rect = R(rect)
    w.text_font = font
    w.text_fontsize = size
    w.text_color = INK
    w.border_width = 0
    w.border_color = None
    w.fill_color = None
    if multi:
        w.field_flags = pymupdf.PDF_TX_FIELD_IS_MULTILINE
    a = p.add_widget(w)
    if center:
        d.xref_set_key(a.xref, "Q", "1")


def photo(p, name, rect, tip):
    """Emplacement image : clic dans Adobe Acrobat/Reader pour importer."""
    w = pymupdf.Widget()
    w.field_type = pymupdf.PDF_WIDGET_TYPE_BUTTON
    w.field_flags = pymupdf.PDF_BTN_FIELD_IS_PUSHBUTTON
    w.field_name = name
    w.field_label = tip
    w.rect = R(rect)
    w.border_width = 0
    w.border_color = None
    w.fill_color = None
    w.script = "event.target.buttonImportIcon();"
    a = p.add_widget(w)
    d.xref_set_key(a.xref, "MK", "<</TP 1/IF <</SW /A/S /P/A [0.5 0.5]>>>>")


# ---------------------------------------------------------------- page 4
p = d[3]
wipe(p, [(0, 0, 595, 220)], images=pymupdf.PDF_REDACT_IMAGE_REMOVE)  # photo + logo BTP
wipe(p, [
    (28, 229, 560, 298),
    (36, 316, 140, 336), (172, 316, 312, 336), (344, 316, 498, 336),
    (147, 383, 575, 404), (147, 407, 575, 628),
    (196, 665, 380, 710), (434, 665, 580, 710),
    (196, 746, 380, 791), (434, 746, 580, 791),
    (678, 52, 962, 102), (678, 111, 962, 160),
    (678, 176, 962, 225), (678, 275, 962, 324), (678, 333, 962, 382),
    (850, 510, 1130, 690),
])
text(p, "centre_nom", (28, 229, 580, 298), "Nom du centre (ex. : AFPI Région Dunkerquoise)",
     size=34, font="HeBo")
for i, r in enumerate([(28, 313, 147, 339), (164, 313, 319, 339), (336, 313, 505, 339)], 1):
    text(p, f"centre_tag{i}", r, "Étiquette (ex. : APPRENTISSAGE)", size=11, font="HeBo", center=True)
text(p, "centre_accroche", (147, 381, 575, 405), "Titre d'accroche", size=14, font="HeBo")
text(p, "centre_presentation", (147, 407, 575, 630), "Texte de présentation du centre",
     size=11, multi=True)
for i, (x, y) in enumerate([(147, 668), (386, 668), (147, 749), (386, 749)], 1):
    photo(p, f"chiffre{i}_icone", (x, y, x + 42, y + 41), "Pictogramme (clic = importer une image)")
    text(p, f"chiffre{i}_valeur", (x + 52, y - 3, x + 230, y + 21), "Chiffre clé (ex. : 250)",
         size=16, font="HeBo")
    text(p, f"chiffre{i}_libelle", (x + 52, y + 18, x + 230, y + 42), "Libellé du chiffre clé",
         size=12, font="HeBo")
for i, (y, ty) in enumerate([(58, 52), (116, 111), (181, 176)], 1):
    photo(p, f"enseignement{i}_icone", (624, y, 665, y + 41), "Pictogramme")
    text(p, f"enseignement{i}_texte", (680, ty, 960, ty + 50), "Enseignement", size=11, multi=True)
for i, (y, ty) in enumerate([(280, 275), (339, 333)], 1):
    photo(p, f"vie{i}_icone", (624, y, 665, y + 41), "Pictogramme")
    text(p, f"vie{i}_texte", (680, ty, 960, ty + 50), "Vie quotidienne", size=11, multi=True)
photo(p, "centre_photo_haut", (0, 0, 595, 220), "Photo principale du centre")
photo(p, "centre_photo_a", (976, 28, 1163, 227), "Photo A")
photo(p, "centre_photo_b", (976, 256, 1162, 400), "Photo B")
photo(p, "centre_photo_c", (624, 492, 834, 814), "Photo C (haute)")
photo(p, "centre_logo", (381, 17, 572, 58), "Logo du centre")
text(p, "metiers_liste", (854, 508, 1135, 692), "Liste des métiers (un par ligne, avec « • »)",
     size=13, font="HeBo", multi=True)

# ---------------------------------------------------------------- page 5
p = d[4]
LEFT_TY = [114, 263, 412, 561, 710]
RIGHT_TY = [46, 195, 344, 492]
cards = [(0, ty) for ty in LEFT_TY] + [(596, ty) for ty in RIGHT_TY]
wipe(p, [r for dx, ty in cards for r in [
    (dx + 143, ty - 3, dx + 445, ty + 90),
    (dx + 453, ty + 2, dx + 501, ty + 27), (dx + 511, ty + 2, dx + 559, ty + 27),
    (dx + 454, ty + 36, dx + 559, ty + 60), (dx + 453, ty + 69, dx + 558, ty + 93),
]])
wipe(p, [(636, 690, 1010, 805)])                                   # texte contact BTP
wipe(p, [(1050, 700, 1145, 795)], fill=GREY,
     graphics=pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED)       # QR code BTP
for n, (dx, ty) in enumerate(cards, 1):
    photo(p, f"f{n}_photo", (dx + 28, ty - 17, dx + 136, ty + 91), "Photo de la formation")
    text(p, f"f{n}_titre", (dx + 145, ty - 4, dx + 440, ty + 18), "Intitulé de la formation",
         size=14, font="HeBo")
    text(p, f"f{n}_description", (dx + 145, ty + 20, dx + 440, ty + 92),
         "Descriptif (3-4 lignes)", size=11, font="HeOb", multi=True)
    text(p, f"f{n}_diplome1", (dx + 452, ty + 1, dx + 502, ty + 28), "Diplôme (CAP, BP, TP, CQP, CS)",
         size=12, font="HeBo", center=True)
    text(p, f"f{n}_diplome2", (dx + 510, ty + 1, dx + 560, ty + 28), "2e diplôme (facultatif)",
         size=12, font="HeBo", center=True)
    text(p, f"f{n}_mode", (dx + 453, ty + 35, dx + 560, ty + 61),
         "Mode (APPRENTISSAGE / FORMATION CONTINUE)", font="HeBo", center=True)
    text(p, f"f{n}_duree", (dx + 452, ty + 68, dx + 559, ty + 94), "Durée (1 ou 2 ANS / 000 H)",
         size=11, font="HeBo", center=True)
text(p, "contact_texte", (641, 694, 1020, 805),
     "Nom, adresse, téléphone, e-mail, site web", size=12, font="Helv", multi=True)
photo(p, "contact_qr", (1054, 703, 1140, 792), "QR code du centre")

d.save(OUT, garbage=3, deflate=True)
print("ok", OUT)
