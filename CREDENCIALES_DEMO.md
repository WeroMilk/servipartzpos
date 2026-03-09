# 🔧 Credenciales de Prueba - Modo DEMO

## Usuarios Predefinidos

La aplicación está funcionando en **modo DEMO** (sin Firebase configurado). Puedes usar cualquiera de estos usuarios para probar:

### Usuario de Prueba
- **Email:** `demo@mibarra.com`
- **Contraseña:** `MiBarraDemo1!`
- **Nombre:** Gerente

### Contraseña de Gerente
- **Contraseña:** `gerente123` (para editar inventario, cambiar porciones, etc.)

## Cómo Usar

1. Ve a `http://localhost:3000`
2. En la pantalla de login, verás un panel con los usuarios de prueba
3. Haz clic en cualquier usuario para autocompletar las credenciales
4. O escribe manualmente el email y contraseña
5. Haz clic en "Iniciar Sesión"

## Flujo Completo

1. **Login** → Usa las credenciales de arriba
2. **Seleccionar Botellas** → Elige las botellas que maneja tu bar
3. **Conectar SoftRestaurant** → Ingresa nombre de bar y código (ej: `SOFT123`)
4. **Barra Virtual** → Navega entre botellas con scroll horizontal

## Nota

- El modo DEMO funciona completamente sin Firebase
- Los datos se guardan en localStorage del navegador
- Al cerrar el navegador, la sesión se mantiene hasta hacer logout
- Para producción, configura Firebase real en `.env.local`
