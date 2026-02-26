# Guía de Deployment

## Problema Común: "No se cargan los datos en producción"

Si los datos no se cargan en producción, es muy probable que falte la variable de entorno `NEXT_PUBLIC_API_URL`.

## Solución Rápida

### 1. Verificar Variables de Entorno

Asegúrate de tener configurada la variable `NEXT_PUBLIC_API_URL` en tu plataforma de hosting:

```env
NEXT_PUBLIC_API_URL=https://tu-backend-url.com
```

**⚠️ IMPORTANTE:**
- NO incluyas `/api` o `/api/v1` al final de la URL
- La URL debe ser accesible desde internet (no `localhost`)
- Debe usar `https://` en producción

### 2. Configurar en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://tu-backend-url.com`
   - **Environment:** Production, Preview, Development (marca todas)
5. Guarda y **reinicia el deployment**

### 3. Configurar en Netlify

1. Ve a tu proyecto en [Netlify Dashboard](https://app.netlify.com)
2. Site settings → **Environment variables**
3. Agrega:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://tu-backend-url.com`
   - **Scopes:** All scopes
4. Guarda y **reinicia el deployment**

### 4. Verificar que Funciona

Después de configurar la variable:

1. Reinicia el deployment
2. Abre la consola del navegador (F12)
3. Busca errores de red (Network tab)
4. Verifica que las peticiones vayan a la URL correcta del backend

### 5. Debugging

Si aún no funciona, verifica:

1. **Consola del navegador:** Busca errores de CORS o 404
2. **Network tab:** Verifica que las peticiones vayan a la URL correcta
3. **Backend logs:** Verifica que el backend esté recibiendo las peticiones
4. **Variables de entorno:** Verifica que `NEXT_PUBLIC_API_URL` esté configurada correctamente

### Ejemplo de URLs Correctas

✅ **Correcto:**
```
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_API_URL=https://backend-production.herokuapp.com
```

❌ **Incorrecto:**
```
NEXT_PUBLIC_API_URL=http://localhost:3001  # No funciona en producción
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api  # No incluyas /api
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1  # No incluyas /api/v1
```

## Estructura de la Aplicación

La aplicación usa un patrón BFF (Backend for Frontend):

1. **Frontend (Next.js)** → Hace peticiones a `/api/*` (rutas de Next.js)
2. **Rutas de Next.js** (`app/api/*`) → Hacen proxy al backend usando `NEXT_PUBLIC_API_URL`
3. **Backend (NestJS)** → Procesa las peticiones y devuelve datos

Por eso es crítico que `NEXT_PUBLIC_API_URL` esté configurada correctamente.

## Verificación Post-Deployment

Después de configurar las variables:

1. ✅ Abre la aplicación en producción
2. ✅ Intenta hacer login
3. ✅ Verifica que el dashboard cargue datos
4. ✅ Verifica que puedas ver tickets, campañas, etc.

Si algo falla, revisa la consola del navegador para ver errores específicos.





















































