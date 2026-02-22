# Variables de Entorno para Render

Copia y pega estas variables en tu Web Service de Render:
Settings → Environment → Add Environment Variable

## Variables Obligatorias

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `MONGODB_URI` | `mongodb+srv://clubfama01:clubfama01@clubfama01.gfztvnu.mongodb.net/club_fama_valle?retryWrites=true&w=majority` |
| `JWT_SECRET` | `club_fama_valle_secret_key_2024_secure_token` |
| `FRONTEND_URL` | `https://club-fama-valle.vercel.app` |

## Variables Opcionales (Cloudinary)

Si quieres usar Cloudinary en lugar de almacenamiento local:

| Variable | Valor |
|----------|-------|
| `CLOUDINARY_CLOUD_NAME` | `tu_cloud_name` |
| `CLOUDINARY_API_KEY` | `tu_api_key` |
| `CLOUDINARY_API_SECRET` | `tu_api_secret` |

## Configuración del Build

En tu Web Service de Render, configura:

**Build Command:**
```bash
cd backend && npm install
```

**Start Command:**
```bash
cd backend && npm start
```

## Configuración de Disco (Para archivos locales)

Si NO usas Cloudinary, agrega un disco:

1. Go to **Disks** en tu servicio de Render
2. Click **Add Disk**
3. **Name:** `uploads`
4. **Mount Path:** `/opt/render/project/src/uploads`
5. **Size:** 1 GB (suficiente para comprobantes)

## Pasos en Render:

1. Crear **New Web Service**
2. Conectar tu repositorio de GitHub
3. Configurar **Build Command** y **Start Command** (arriba)
4. Agregar las **Environment Variables** (tabla de arriba)
5. (Opcional) Agregar **Disk** para archivos locales
6. Click **Create Web Service**

## Después de desplegar:

1. Copiar la URL de Render (ej: `https://club-fama-valle.onrender.com`)
2. Actualizar `FRONTEND_URL` en Vercel si es diferente
3. Actualizar `RENDER_API_URL` en `frontend/public/js/auth.js`
