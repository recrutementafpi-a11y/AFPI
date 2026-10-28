"""Remplit la fiche AFPI Gravelines (page 4) du livret remplissable.

Usage : python3 -I fill_afpi.py <remplissable.pdf> <images/> <sortie.pdf>
Les champs restent modifiables ; les photos sont posées sous les boutons image.
"""
import io, os, sys
import pymupdf
from PIL import Image

SRC, IMG, OUT = sys.argv[1:4]

VALUES = {
    "centre_nom": "AFPI - Antenne de Gravelines",
    "centre_tag1": "INDUSTRIE",
    "centre_tag2": "TERTIAIRE",
    "centre_tag3": "SÉCURITÉ",
    "centre_accroche": "Se former à l'industrie et au tertiaire à Gravelines",
    "centre_presentation": (
        "L'antenne des Rives de l'Aa est un site de 1 700 m² de l'AFPI Région Dunkerquoise, "
        "implanté à Gravelines. Elle accueille 70 à 90 stagiaires par jour autour de plateaux "
        "techniques dédiés : maintenance (machines tournantes, robinetterie), chaudronnerie "
        "blanche et soudage sur inox et thermoplastiques, conduite d'engins de chantier et "
        "amiante.\n"
        "Côté tertiaire : bureautique, vente, comptabilité-gestion, langues, assistant(e) de "
        "direction, ressources humaines, qualité-sécurité-environnement et développement "
        "personnel.\n"
        "L'AFPI fait partie du réseau Pôle Formation des Industries Technologiques et est "
        "certifiée Qualiopi."),
    "chiffre1_valeur": "1 700 m²", "chiffre1_libelle": "de centre de formation",
    "chiffre2_valeur": "70 à 90", "chiffre2_libelle": "stagiaires accueillis par jour",
    "chiffre3_valeur": "500 m²", "chiffre3_libelle": "d'atelier chaudronnerie, soudage",
    "chiffre4_valeur": "2 000 m²", "chiffre4_libelle": "d'aire extérieure engins",
    "metiers_liste": ("• Chaudronnier, soudeur\n• Tuyauteur\n• Électricien\n"
                      "• Agent de maintenance\n• Conducteur d'engins de chantier\n"
                      "• Désamiantage\n• Assistant(e) de direction\n"
                      "• Comptabilité, gestion, RH"),
    "contact_texte": ("AFPI Région Dunkerquoise\nAntenne des Rives de l'Aa\n"
                      "Zone de la Leurette, Route du développement\n59820 GRAVELINES\n\n"
                      "03 28 65 59 66\naccueil@afpi-formation.com\nwww.afpi-formation.com"),
}
# champ photo -> (fichier, point focal x, y en fraction)
PHOTOS = {
    "centre_photo_haut": ("1.jpg", .5, .22),
    "centre_photo_a": ("2.jpg", .5, .45),
    "centre_photo_b": ("3.jpg", .45, .5),
    "centre_photo_c": ("4.webp", .5, .5),
}

d = pymupdf.open(SRC)
p = d[3]
rects = {w.field_name: pymupdf.Rect(w.rect) for w in p.widgets()}


def cover(path, rect, fx, fy):
    im = Image.open(path).convert("RGB")
    ratio = rect.width / rect.height
    w, h = im.size
    cw, ch = (w, int(w / ratio)) if w / h < ratio else (int(h * ratio), h)
    x = min(max(int(fx * w - cw / 2), 0), w - cw)
    y = min(max(int(fy * h - ch / 2), 0), h - ch)
    buf = io.BytesIO()
    im.crop((x, y, x + cw, y + ch)).save(buf, "JPEG", quality=92)
    return buf.getvalue()


for name, (f, fx, fy) in PHOTOS.items():
    r = rects[name]
    p.insert_image(r, stream=cover(os.path.join(IMG, f), r, fx, fy), overlay=True)
for pg in (d[3], d[4]):
    for w in pg.widgets():
        if w.field_name in VALUES:
            w.field_value = VALUES[w.field_name]
            w.update()
d.save(OUT, garbage=3, deflate=True)
print("ok", OUT)
