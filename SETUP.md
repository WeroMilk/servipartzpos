# Guía de Configuración - MiBarra

## Pasos para ejecutar el proyecto

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Authentication**:
   - Ve a Authentication > Sign-in method
   - Habilita "Email/Password"
4. Crea una base de datos **Firestore**:
   - Ve a Firestore Database
   - Crea la base de datos en modo de prueba
5. Obtén las credenciales:
   - Ve a Project Settings > General
   - En "Your apps", selecciona la web app o crea una nueva
   - Copia las credenciales

### 3. Configurar variables de entorno

Copia el archivo `.env.local.example` a `.env.local`:

```bash
cp .env.local.example .env.local
```

Luego edita `.env.local` y completa con tus credenciales de Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4. Ejecutar en desarrollo

```bash
pnpm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 5. Probar la aplicación

1. **Registro/Login**: Crea una cuenta o inicia sesión
2. **Seleccionar Botellas**: Elige las botellas que maneja tu bar
3. **Conectar SoftRestaurant**: Ingresa un código (cualquier código de 6+ caracteres funciona para el MVP)
4. **Barra Virtual**: Navega entre botellas con scroll horizontal

## Estructura del Proyecto

```
MiBarra/
├── app/                    # Rutas de Next.js (App Router)
│   ├── page.tsx           # Página de login/registro
│   ├── select-bottles/    # Selección de botellas
│   ├── connect-softrestaurant/  # Conexión con SoftRestaurant
│   └── bar/               # Pantalla principal del bar
├── components/            # Componentes React
│   ├── Auth/             # Componentes de autenticación
│   └── Bar/              # Componentes del bar
├── lib/                   # Utilidades y configuraciones
│   ├── firebase.ts       # Configuración de Firebase
│   ├── types.ts          # Tipos TypeScript
│   └── bottlesData.ts    # Datos de botellas por defecto
└── hooks/                 # Custom hooks
```

## Características del MVP

✅ Autenticación con Firebase  
✅ Selección de botellas por categorías  
✅ Selección múltiple rápida (por categoría completa)  
✅ Conexión simulada con SoftRestaurant  
✅ Barra virtual con scroll horizontal  
✅ Medidores profesionales de inventario  
✅ Diseño responsive optimizado para móviles  
✅ Temática elegante de bar (madera, vino, negro, dorado)  

## Próximos Pasos (Post-MVP)

- Integración real con SoftRestaurant API
- Sincronización en tiempo real con Firestore
- Gestión de múltiples bares
- Historial de consumo
- Alertas de inventario bajo
- Exportación de reportes
- Modo offline

## Despliegue en Vercel

1. Sube el código a GitHub
2. Conecta tu repositorio con Vercel
3. Agrega las variables de entorno en Vercel
4. ¡Listo! Tu app estará en producción
