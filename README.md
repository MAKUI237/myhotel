# MyHotel

Application hôtelière Expo (web + mobile) avec API SQLite.

## Comptes de démonstration

Mot de passe : `password123`

| Rôle | E-mail |
| --- | --- |
| Réception | `reception@myhotel.test` |
| Gérant | `gerant@myhotel.test` |
| Entretien | `entretien@myhotel.test` |
| Propriétaire | `proprio@myhotel.test` |

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
6. Attendez le statut **Ready**, puis ouvrez l’URL **Production** (pas un lien Preview expiré).

`DEPLOYMENT_NOT_FOUND` apparaît si le build a échoué ou si l’URL n’est pas celle du dernier déploiement Ready. Dans Vercel : Project → Deployments → ouvrir le déploiement vert.
