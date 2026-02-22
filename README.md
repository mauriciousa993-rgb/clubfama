# Club FAMA VALLE - Sistema de Gestión

Aplicación de gestión para club de baloncesto desarrollada con Node.js, Express, MongoDB y desplegada en Render + Vercel.

## 🚀 Stack Tecnológico

- **Backend:** Node.js con Express
- **Frontend:** HTML, CSS, JavaScript vanilla
- **Base de Datos:** MongoDB Atlas (Mongoose)
- **Autenticación:** JWT (JSON Web Tokens)
- **Subida de Archivos:** Multer + Cloudinary (o almacenamiento local)
- **Seguridad:** bcryptjs, cors
- **Despliegue:** Render (Backend) + Vercel (Frontend)

## 📁 Estructura del Proyecto

```
club-fama-valle/
├── backend/
│   ├── config/
│   │   ├── db.js              # Configuración de MongoDB
│   │   ├── cloudinary.js      # Configuración de Cloudinary
│   │   └── cloudinaryProfiles.js
│   ├── controllers/
│   │   ├── authController.js      # Lógica de autenticación
│   │   └── paymentController.js   # Lógica de pagos
│   ├── middleware/
│   │   └── auth.js            # Middleware de autenticación JWT
│   ├── models/
│   │   ├── User.js            # Modelo de usuarios
│   │   └── Payment.js         # Modelo de pagos
│   ├── routes/
│   │   ├── authRoutes.js      # Rutas de autenticación
│   │   └── paymentRoutes.js   # Rutas de pagos
│   ├── server.js              # Punto de entrada del backend
│   └── package.json           # Dependencias del backend
├── frontend/
│   └── public/
│       ├── index.html         # Página de login
│       ├── css/               # Estilos
│       ├── js/                # Scripts
│       ├── pages/             # Páginas HTML
│       └── images/            # Imágenes
├── uploads/                   # Archivos subidos (local)
├── .env.example               # Ejemplo de variables de entorno
├── .gitignore                 # Archivos ignorados por git
├── vercel.json                # Configuración de Vercel
├── render.yaml                # Configuración de Render
└── README.md                  # Documentación
```


## 🔧 Instalación Local

1. **Clonar el repositorio:**
```bash
git clone <url-del-repositorio>
cd club-fama-valle
```

2. **Instalar dependencias del backend:**
```bash
cd backend
npm install
```

3. **Configurar variables de entorno:**
Copiar `.env.example` a `.env` y configurar:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
NODE_ENV=development
PORT=8080
MONGODB_URI=mongodb://localhost:27017/club_fama_valle
JWT_SECRET=tu_secreto_jwt_super_seguro
# Opcional: Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

4. **Iniciar el servidor:**
```bash
# Desde la carpeta backend
npm start
```

5. **Abrir el frontend:**
Abrir `frontend/public/index.html` en el navegador o usar Live Server.

## 🚀 Despliegue en Producción

### 1. MongoDB Atlas (Base de Datos)

1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crear un nuevo cluster (gratis)
3. En "Database Access", crear un usuario con contraseña
4. En "Network Access", agregar IP: `0.0.0.0/0` (acceso desde cualquier lugar)
5. En "Databases", hacer clic en "Connect" → "Drivers" → "Node.js"
6. Copiar la URI de conexión (reemplazar `<password>` con la contraseña real)

### 2. Render (Backend)

1. Crear cuenta en [Render](https://render.com)
2. Crear nuevo "Web Service"
3. Conectar con tu repositorio de GitHub
4. Configurar:
   - **Name:** `club-fama-valle-api`
   - **Runtime:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
5. En "Environment Variables", agregar:
   ```
   NODE_ENV=production
   MONGODB_URI=tu_uri_de_mongodb_atlas
   JWT_SECRET=tu_secreto_jwt_super_seguro
   FRONTEND_URL=https://club-fama-valle.vercel.app
   ```
6. En "Disks", agregar:
   - **Name:** `uploads`
   - **Mount Path:** `/opt/render/project/src/uploads`
   - **Size:** 1 GB
7. Deploy!

### 3. Vercel (Frontend)

1. Crear cuenta en [Vercel](https://vercel.com)
2. Importar proyecto desde GitHub
3. Configurar:
   - **Framework Preset:** `Other`
   - **Root Directory:** `./` (raíz del proyecto)
4. El archivo `vercel.json` ya está configurado
5. Deploy!

6. **Actualizar URL del backend:**
   - Copiar la URL de Render (ej: `https://club-fama-valle-api.onrender.com`)
   - Editar `frontend/public/js/auth.js`:
   ```javascript
   const RENDER_API_URL = 'https://tu-url-de-render.onrender.com/api';
   ```
   - Hacer commit y push → Vercel redeployará automáticamente

### 4. Configuración Final

1. En Render, actualizar `FRONTEND_URL` con la URL real de Vercel
2. En Vercel, verificar que el frontend puede conectarse al backend
3. Probar el flujo completo: registro → login → subir comprobante


## 📚 API Endpoints

### Health Check
- `GET /api/health` - Verificar estado del servidor

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (requiere autenticación)
- `GET /api/auth/users` - Listar todos los usuarios (Admin)

### Pagos
- `POST /api/payments` - Subir comprobante de pago (Jugador) - **Soporta archivos hasta 10MB**
- `GET /api/payments/my-payments` - Ver mis pagos (Jugador)
- `GET /api/payments/pending` - Ver pagos pendientes (Admin)
- `GET /api/payments` - Ver todos los pagos (Admin)
- `PUT /api/payments/:id/status` - Aprobar/Rechazar pago (Admin)


## 👥 Roles de Usuario

- **Admin:** Acceso total al sistema, puede aprobar/rechazar pagos
- **Player:** Puede subir comprobantes y ver sus propios pagos

## 🔒 Seguridad

- Autenticación mediante JWT
- Contraseñas encriptadas con bcryptjs
- Protección de rutas según roles
- Validación de datos de entrada

## 📝 Funcionalidades

1. **Gestión de Usuarios:** Registro y autenticación con roles (Admin/Jugador)
2. **Perfiles de Jugadores:** Información personal, contacto de emergencia, categoría
3. **Subida de Comprobantes:** Soporte para PDF e imágenes (JPG/PNG) hasta 10MB
4. **Aprobación de Pagos:** Sistema de aprobación/rechazo por administradores
5. **Estado de Deuda:** Actualización automática según pagos aprobados
6. **Historial de Pagos:** Visualización de pagos por usuario
7. **Calendario de Eventos:** Próximos entrenamientos y torneos
8. **Reportes:** Estadísticas de jugadores y pagos

## 🔧 Solución de Problemas

### Error "File too large" (MulterError)
- **Solución:** El límite es de 10MB. Comprimir imágenes o usar PDF.

### Error 500 al subir comprobante
- **Causa:** Cloudinary no configurado
- **Solución:** El sistema usa almacenamiento local automáticamente. Los archivos se guardan en `/uploads/payments/`.

### No se muestra el nombre del jugador en pagos
- **Solución:** Verificar que el backend haga `populate('player_ref')` al obtener pagos.

### CORS errors en producción
- **Solución:** Verificar que `FRONTEND_URL` en Render coincida con la URL de Vercel.

## 📱 Acceso desde Móvil

La aplicación es responsive y funciona en dispositivos móviles. Para acceso local en la misma red:

1. Obtener IP de la computadora: `ipconfig` (Windows) o `ifconfig` (Mac/Linux)
2. En `auth.js`, cambiar `LOCAL_API_URL` a: `http://192.168.1.X:8080/api`
3. Acceder desde el móvil usando la misma IP


## 🌐 URLs de Producción

Una vez desplegado:

- **Frontend (Vercel):** `https://club-fama-valle.vercel.app`
- **Backend (Render):** `https://club-fama-valle-api.onrender.com`
- **API Docs:** `https://club-fama-valle-api.onrender.com/api/health`

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 🆘 Soporte

¿Problemas con el despliegue?
- Revisar logs en Render Dashboard
- Verificar variables de entorno
- Comprobar CORS en el navegador (F12 → Console)
- Asegurar que MongoDB Atlas permite conexiones desde 0.0.0.0/0

---

Desarrollado con ❤️ para Club FAMA VALLE
