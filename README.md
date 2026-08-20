# La Planche — les menus de la semaine

Application de gestion des menus familiaux (planning, pool de plats, liste de courses),
partageable entre deux iPhones.

## Déploiement (GitHub + Vercel)

1. Pousser tous ces fichiers dans le dépôt GitHub.
2. Sur vercel.com : **Add New → Project → Import** le dépôt.
3. Vercel détecte Vite automatiquement. Laisser les réglages par défaut → **Deploy**.
4. À chaque commit, Vercel redéploie tout seul.

## Installer l'app sur l'iPhone

1. Ouvrir l'URL Vercel dans **Safari**.
2. Bouton Partager → **Sur l'écran d'accueil**.
3. L'icône « La Planche » apparaît comme une vraie app.

Après une mise à jour, forcer le rechargement (fermer l'app puis la rouvrir).

## Activer le partage entre les deux iPhones (Supabase)

Par défaut, chaque appareil garde ses données en local. Pour synchroniser :

1. Créer un projet gratuit sur supabase.com.
2. Dans **SQL Editor**, exécuter :

   ```sql
   create table menus (id text primary key, data jsonb, updated_at timestamptz default now());
   alter table menus enable row level security;
   create policy "foyer" on menus for all using (true) with check (true);
   insert into menus (id, data) values ('foyer', '{}');
   ```

3. Dans **Settings → API**, copier **Project URL** et la clé **anon public**.
4. Les coller en haut de `src/App.jsx` :

   ```js
   const SUPABASE_URL = "https://xxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGc...";
   ```

5. Commit → Vercel redéploie. Le badge en haut passe de « Cet appareil » à « Partagé ».

## Structure

- `src/App.jsx` — toute l'application (données + interface).
- `src/main.jsx` — point d'entrée.
- `public/` — icônes et favicon.
- `vite.config.js` — configuration + PWA.
