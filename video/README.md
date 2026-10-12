# Vidéo motion design – AFPI Région Dunkerquoise

Projet éditable (HTML/CSS/JS déterministe, 1920×1080, ≈ 3 min 04 s) + export MP4 (Playwright + ffmpeg). Aucun son.

## Où mettre vos fichiers
| Dossier | Contenu | Nom des fichiers |
|---|---|---|
| `video/assets/photos/` | photos (JPG/PNG/WebP, paysage, idéalement ≥ 1920×1080) | `S02_dunkerque`, `S02_gravelines`, `S02_cantine`, `S03_soudage`, `S03_tertiaire`, `S08_hall`, `S10_01` … `S10_12` (toute photo `S10_*` est utilisée en mosaïque, réutilisée en boucle s'il y en a moins de 12) |
| `video/assets/logos/` | logos de certification | `cert_qualiopi.png`, `cert_cqpm.png`, `cert_tosa.png`, `cert_toeic.png`… (tout `cert_*` apparaît en cascade) |
| `video/assets/logos/logo-afpi.png` | logo AFPI (copie de `public/logo-afpi.png`) | à remplacer par la version SVG/PNG transparente de référence |

Tant qu'un fichier manque, un cadre hachuré indique son nom exact. Les extensions sont libres (le nom sans extension fait foi).

## Fenêtres vidéo
Cadres gris neutres nommés par scène (`V03a_maintenance`, `V03b_securite`, `V06_parking`, `V07_epi`, `V09_evacuation`), avec volets d'entrée/sortie. Minutages exacts : `fenetres-video.md` (regénérer : `node render.mjs --windows`). `?labels=0` / `--labels 0` masque les inscriptions pour un fond uni.

## Synchronisation avec le SRT
Les minutages sont dans `timing.json` (début/fin de chaque scène + 2 intertitres). Modifiez-les d'après le SRT : les animations de la scène sont étirées pour tenir dans la nouvelle durée, et `fenetres-video.md` se recalcule.

## Commandes
```
node video/serve.mjs                     # aperçu : http://localhost:5180/  (?t=75 fige un instant)
node video/render.mjs                    # → video/afpi-dunkerque.mp4 (30 i/s)
node video/render.mjs --fps 15 --out brouillon.mp4
node video/render.mjs --still 120 --o image.png
node video/render.mjs --windows          # → fenetres-video.md
```
Prérequis : Node 20+, ffmpeg, Playwright (Chromium). Modifier les textes/animations : `scenes.js` ; pictogrammes : `icons.js` ; couleurs/typo : `style.css`.

## À vérifier avant diffusion
Le site afpi-formation.com n'était pas joignable depuis l'environnement de création : chiffres (95 % / 95 %, « Données 2025 »), horaires, arrêt « Pont Loby – 100 m », DK Bus gratuit, téléphone, adresses et cantine sont repris tels que dans le brief et n'ont pas été recoupés avec le site.
