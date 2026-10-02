# MyHotel

Application hôtelière Expo (web + mobile) avec API MySQL.

## Comptes de démonstration

Mot de passe : `password123`

| Rôle | E-mail |
| --- | --- |
| Réception | `receptioniste@gmail.com` |
| Gérant | `gerant@gmail.com` |
| Entretien | `entretien@gmail.com` |
| Gouvernante | `gouvernante@gmail.com` |
| Propriétaire | `proprietaire@gmail.com` |

## Développement local

```bash
npm install
npm run api
npx expo start --web
```

L’API écoute sur `http://localhost:3847`.

## GitHub

Dépôt : [https://github.com/MAKUI237/myhotel](https://github.com/MAKUI237/myhotel)

## Hébergement Vercel

1. Importer [MAKUI237/myhotel](https://github.com/MAKUI237/myhotel) sur [vercel.com/new](https://vercel.com/new).
2. Framework Preset : **Other**.
3. Build Command : `npx expo export -p web`
4. Output Directory : `dist`
5. Root Directory : `.` (la racine du dépôt, pas un sous-dossier).
6. Dans **Settings → Environment Variables**, ajoutez la connexion MySQL distante :
   - `MYSQL_URL` = `mysql://USER:PASSWORD@HOST:3306/NOM_BASE`
   - `MYHOTEL_MYSQL_SSL` = `1` si l’hébergeur MySQL exige SSL
7. Attendez le statut **Ready**, puis ouvrez l’URL **Production** (pas un lien Preview expiré).

L’API Vercel (`/api`) a besoin d’un MySQL accessible depuis Internet (pas `127.0.0.1`). Créez la base à l’avance si l’utilisateur n’a pas le droit `CREATE DATABASE`.

`DEPLOYMENT_NOT_FOUND` apparaît si le build a échoué ou si l’URL n’est pas celle du dernier déploiement Ready. Dans Vercel : Project → Deployments → ouvrir le déploiement vert.
