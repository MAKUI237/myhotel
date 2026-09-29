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

1. Importer le dépôt sur [vercel.com/new](https://vercel.com/new).
2. Framework : **Other**.
3. Build Command : `npx expo export -p web` (déjà dans `vercel.json`).
4. Output Directory : `dist`.
5. Déployer.

Le site web statique est servi depuis `dist`. L’API SQLite est exposée sur `/api` (sql.js). Sur Vercel le fichier SQLite vit dans `/tmp` : les données se réinitialisent à chaque cold start.

Option CLI :

```bash
npx vercel@latest
```
