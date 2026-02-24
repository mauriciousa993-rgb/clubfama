# Variables de Entorno para Render

## Configuración del Servicio

### Build Command
```
cd backend && npm install
```

### Start Command
```
cd backend && npm start
```

## Variables de Entorno Requeridas

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Modo producción |
| `PORT` | `8080` | Puerto del servidor |
| `MONGODB_URI` | `mongodb+srv://...` | URI de MongoDB Atlas |
| `JWT_SECRET` | `tu_secreto_jwt` | Clave secreta para tokens |
| `JWT_EXPIRE` | `1d` | Expiración del token JWT |
| `CLOUDINARY_CLOUD_NAME` | `tu_cloud_name` | Nombre de Cloudinary |
| `CLOUDINARY_API_KEY` | `tu_api_key` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | `tu_api_secret` | API Secret de Cloudinary |
| `FRONTEND_URL` | `https://tu-frontend.vercel.app` | URL del frontend |

## Notas Importantes

- **NO se usa Disk**: Todos los archivos (comprobantes de pago) se guardan en Cloudinary
- **MongoDB Atlas**: La base de datos está en la nube, no local
- **Cloudinary**: Almacenamiento de imágenes en la nube

## Configuración MongoDB Atlas

1. Ve a [cloud.mongodb.com](https://cloud.mongodb.com)
2. Network Access → Add IP Address
3. Selecciona **Allow Access from Anywhere** (0.0.0.0/0)
4. Esto permite que Render se conecte a tu base de datos

## Configuración Cloudinary

1. Ve a [cloudinary.com](https://cloudinary.com)
2. Dashboard → Copy API Environment Variable
3. Extrae los valores para las variables de entorno
