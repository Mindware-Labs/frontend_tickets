# Configuración de Variables de Entorno

## ⚠️ Problema Común

Si tienes `BACKEND_API_URL=http://0.0.0.0:3001`, esto **NO funcionará** porque:

1. **`0.0.0.0` no es accesible desde el navegador** - Solo funciona para que el servidor escuche en todas las interfaces
2. **El frontend necesita `NEXT_PUBLIC_API_URL`** - No `BACKEND_API_URL` (esa es solo para rutas del servidor)

## ✅ Solución Correcta

### Para Desarrollo Local:

Crea un archivo `.env.local` en la raíz del proyecto `Frontend-Tickets-hut`:

```env
# URL del backend - REQUERIDO para que funcione
# Usa localhost o 127.0.0.1 (NO uses 0.0.0.0)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Opcional: Para rutas del servidor (Next.js API routes)
BACKEND_API_URL=http://localhost:3001
```

### Para Producción:

```env
# URL del backend en producción
NEXT_PUBLIC_API_URL=https://tu-backend-url.com

# Opcional: Para rutas del servidor
BACKEND_API_URL=https://tu-backend-url.com
```

## 📝 Explicación

### ¿Por qué `NEXT_PUBLIC_API_URL`?

- Las variables que empiezan con `NEXT_PUBLIC_` son accesibles desde el navegador (cliente)
- El código del frontend hace fetch directamente desde el navegador, por eso necesita `NEXT_PUBLIC_API_URL`
- `BACKEND_API_URL` solo se usa en rutas del servidor (`app/api/*`)

### ¿Por qué no `0.0.0.0`?

- `0.0.0.0` significa "escuchar en todas las interfaces" - solo para el servidor
- El navegador no puede hacer fetch a `0.0.0.0` - debe ser `localhost`, `127.0.0.1`, o una URL real

## 🔧 Pasos para Corregir

1. **Crea/edita `.env.local`** en `Frontend-Tickets-hut`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

2. **Reinicia el servidor de desarrollo**:
   ```bash
   # Detén el servidor (Ctrl+C)
   # Luego reinicia:
   npm run dev
   ```

3. **Verifica que funciona**:
   - Abre la aplicación en el navegador
   - Abre la consola (F12)
   - Ve a la pestaña Network
   - Verifica que las peticiones vayan a `http://localhost:3001`

## 📋 Resumen de Variables

| Variable | Uso | Dónde |
|----------|-----|-------|
| `NEXT_PUBLIC_API_URL` | **REQUERIDO** - Llamadas desde el navegador | `.env.local` o variables de entorno del hosting |
| `BACKEND_API_URL` | Opcional - Solo para rutas del servidor | `.env.local` o variables de entorno del hosting |

## 🚀 Para Producción (Vercel/Netlify)

1. Ve a tu proyecto en el dashboard
2. Settings → Environment Variables
3. Agrega:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://tu-backend-url.com` (sin `/api` al final)
4. Reinicia el deployment




















































