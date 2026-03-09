# Deploy: GitHub + Vercel

Sigue estos pasos en tu PC (en la carpeta del proyecto, con Git instalado).

## 1. Subir a GitHub

Abre terminal en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Barra: app lista para producción"
```

Crea un repositorio nuevo en GitHub (sin README, sin .gitignore). Luego:

```bash
git remote add origin https://github.com/TU_USUARIO/barra.git
git branch -M main
git push -u origin main
```

(Sustituye `TU_USUARIO` por tu usuario de GitHub.)

## 2. Deploy en Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión (con GitHub).
2. **Add New** → **Project**.
3. Importa el repo **barra** desde GitHub.
4. Deja **Framework Preset: Next.js** y **Root Directory** por defecto. Pulsa **Deploy**.
5. Si usas variables de entorno (Firebase, etc.), en el proyecto → **Settings** → **Environment Variables** añade las mismas que en `.env.local` (no subas `.env.local` a GitHub).

Tras el primer deploy, cada `git push` a `main` generará un nuevo deploy automático.

## Comandos útiles

```bash
pnpm run build   # comprobar build local
pnpm run lint    # comprobar ESLint
```
