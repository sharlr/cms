# Concours National de Logique

Plateforme de gestion du Concours National de Logique (Women in STEM, Djibouti) :
inscription des candidats, mode entrainement, concours de sélection chronométré,
classement automatique et administration complète.

Implémente le cahier des charges fonctionnel *logique WSD Cahier des charges Appli*.
L'interface est en français et responsive du téléphone au grand écran.

## Démarrer

Avec Docker (PostgreSQL inclus) :

```bash
docker compose up -d --build
```

En local (PostgreSQL doit tourner, voir `.env.example`) :

```bash
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

Comptes créés par le seed :

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Administration | `admin@concourslogique.org` | `admin1234` |
| Candidate | `candidate@example.com` | `demo1234` |

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm test` | Suite de tests (Vitest) |
| `npm run lint` | ESLint |

## Architecture

- **Next.js 16** (App Router, Server Components, Server Actions) + **React 19**
- **Prisma 7** sur **PostgreSQL** (`@prisma/adapter-pg`)
- **Tailwind CSS 4** — système visuel dans `src/app/globals.css`
- Session par **JWT** en cookie `httpOnly` (`jose`), mots de passe **bcrypt**

### Le chronomètre fait autorité côté serveur

`src/lib/contest.ts` est le cœur du produit. Le serveur enregistre l'instant où
chaque question est servie (`Attempt.questionServedAt`) et arbitre seul le temps
imparti : une horloge client avancée ne donne aucun avantage.

- Le rendu serveur de la page **n'arme pas** le chrono (`startClock: false`) ;
  c'est la requête émise par le client au montage qui le déclenche, pour que les
  30 s du candidat et celles du serveur commencent au même instant.
- Une réponse reçue jusqu'à 2 s après l'échéance est acceptée (tolérance réseau) ;
  au-delà, la question est comptée non répondue.
- Si le candidat ferme l'application, les questions dont le temps a expiré
  pendant son absence sont enregistrées comme non répondues à son retour.
- Le retour en arrière est impossible : seule la position courante est acceptée.

### Classement

`src/lib/ranking.ts` — nombre de bonnes réponses décroissant, puis temps total
croissant à égalité. Les ex æquo stricts partagent le rang et le suivant saute
d'autant. En entrainement, seule la meilleure tentative d'un candidat est classée.

### Programmation des épreuves

`src/lib/availability.ts` — `Contest.startsAt` porte l'heure officielle. Avant
elle, le concours de sélection est verrouillé et l'écran affiche un compte à
rebours qui rafraîchit la page à échéance ; le bouton s'active alors de lui-même.
`opensAt`/`closesAt` encadrent la période d'accès, `isActive` coupe l'accès.

## Fonctionnalités

**Candidat** — inscription (nom, sexe, date de naissance, ville, niveau scolaire,
téléphone, e-mail, mot de passe, acceptation du règlement), connexion par e-mail
ou téléphone, entrainement rejouable, concours de sélection à participation
unique, épreuve chronométrée (QCM A–D ou réponse libre), résultats avec verdict
et tableau récapitulatif, classement, historique, messages privés, certificat de
participation imprimable.

**Administration** — tableau de bord statistique (inscrits, répartition par
niveau / genre / ville, taux de réussite, temps moyen), liste des candidats avec
recherche et filtres, gestion des concours et de la banque de questions (création,
réordonnancement, import Excel), participations et classement, actualités, pages
éditoriales (règlement, contact, récompenses), partenaires, diffusion de messages.

### Import de questions

`/admin/concours/[id]/questions/import` accepte un classeur `.xlsx` dont la
première feuille suit l'ordre de colonnes : Type, Énoncé, Réponse A–D, Bonne
réponse, Points. Un modèle est téléchargeable depuis l'écran. L'import est
appliqué en totalité ou pas du tout.

### Export Excel

Les exports respectent les colonnes du cahier des charges et sont triés du
meilleur au moins bon (`/admin/concours/[id]/participants/export`).

## Configuration

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion Prisma |
| `AUTH_SECRET` | Signature des sessions — **à changer en production** |
| `MAIL_WEBHOOK_URL` | Point d'envoi des courriels (facultatif) |

Sans `MAIL_WEBHOOK_URL`, les messages sont délivrés dans l'application seule et
l'envoi du courriel jumeau est journalisé sans être effectué.

## Tests

57 tests couvrent la correction des réponses, le moteur de chronométrage
(armement, tolérance, reprise après abandon, interdiction du retour en arrière),
la disponibilité des concours, le classement et l'import Excel. Ils s'exécutent
sur une base PostgreSQL `cms_test` dédiée, recréée à chaque lancement.
