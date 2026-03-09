# MiBarra

Aplicación web para gestión de inventario de botellas y cervezas en bares.

## Tecnologías

- Next.js 14
- React 18
- TypeScript
- Firebase (Auth + Firestore)
- Tailwind CSS
- Framer Motion

## Instalación

```bash
pnpm install
```

## Desarrollo

```bash
pnpm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Deploy (GitHub + Vercel)

Ver **[DEPLOY.md](./DEPLOY.md)** para subir el proyecto a GitHub y desplegarlo en Vercel.

## Configuración de Firebase

1. Crea un proyecto en Firebase Console
2. Habilita Authentication (Email/Password)
3. Crea una base de datos Firestore
4. Copia las credenciales a `.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```
