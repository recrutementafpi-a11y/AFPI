# AFPI — Espace stagiaires (prototype)

Prototype de démonstration pour dématérialiser :

- le **planning** des stagiaires (aujourd'hui consulté via Sowesign ou des exports NetYparéo) ;
- la **feuille de présence / émargement** (aujourd'hui sur papier).

Ce prototype est autonome (base SQLite locale), pensé pour être testé puis présenté
à la direction avant toute décision d'intégration au site officiel ou de connexion
aux vrais outils (NetYparéo, Sowesign).

## Lancer la démo en local

```bash
npm install
npm run seed   # crée la base data/afpi.db avec des comptes de démonstration
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

### Comptes de démonstration

| Rôle       | Email                              | Mot de passe    |
|------------|-------------------------------------|-----------------|
| Admin      | admin@afpi-formation.com            | Admin123!       |
| Formateur  | formateur@afpi-formation.com        | Formateur123!   |
| Stagiaire  | lea.bernard@example.com             | Stagiaire123!   |
| Stagiaire  | karim.saidi@example.com             | Stagiaire123!   |
| Stagiaire  | chloe.roux@example.com              | Stagiaire123!   |

## Déployer la démo en ligne (sans rien installer sur son PC)

Le projet est prêt à être déployé sur [Render](https://render.com) (offre gratuite) :

- **Build Command** : `npm install && npm run build && npm run seed`
- **Start Command** : `npm start`
- Variable d'environnement à ajouter : `SESSION_SECRET` (une chaîne aléatoire d'au
  moins 32 caractères — Render propose un bouton "Generate" pour ça).

Render fournit alors une URL publique (ex: `https://xxxx.onrender.com`) à ouvrir dans
n'importe quel navigateur, sans rien installer localement. Sur l'offre gratuite, le
service se met en veille après 15 min d'inactivité : la première ouverture après une
pause peut prendre 30 à 60 secondes.

⚠️ La base SQLite est réinitialisée à chaque redéploiement (elle n'est pas persistée) :
c'est voulu pour un prototype de démonstration, pas adapté à un usage réel.

## Fonctionnalités du prototype

- **Connexion** par email / mot de passe (sessions chiffrées via cookie).
- **Planning** : chaque stagiaire voit les séances de son groupe ; formateur/admin voient
  toutes les séances.
- **Émargement** : le stagiaire signe (tactile ou souris) chaque séance passée depuis son
  propre compte ; le formateur/admin suit en temps réel qui a signé, et peut exporter la
  feuille de présence d'une séance en CSV.
- **Administration** : création de groupes, de comptes stagiaires et de séances
  (interface minimale, pour la démo — à terme, ces données viendraient d'un import
  NetYparéo plutôt que d'une saisie manuelle).

## Ce qui n'est volontairement PAS fait dans ce prototype

- Pas de connexion réelle à NetYparéo ou Sowesign (les séances sont saisies manuellement
  ou importées à la main — une intégration au flux iCal NetYparéo est un axe clair pour
  la suite).
- Pas d'envoi d'email (création de compte, mot de passe oublié).
- Pas de déploiement production (base SQLite locale, secrets en dur pour la démo — à
  remplacer avant toute mise en ligne réelle).
- Pas de conformité RGPD/archivage légal des émargements formalisée (à cadrer avec la
  direction si le projet est validé : durée de conservation, valeur probante de la
  signature électronique, etc.).

## Stack technique

Next.js (App Router) + TypeScript + Tailwind CSS + SQLite (better-sqlite3).
Choisi pour prototyper vite et pouvoir démontrer un flux complet, pas pour un usage en
production tel quel.
