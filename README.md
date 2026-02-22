# Club FAMA VALLE - Sistema de Gestión

Aplicación de gestión para club de baloncesto desarrollada con Node.js, Express y MongoDB.

## 🚀 Stack Tecnológico

- **Backend:** Node.js con Express
- **Base de Datos:** MongoDB Atlas (Mongoose)
- **Autenticación:** JWT (JSON Web Tokens)
- **Subida de Archivos:** Multer + Cloudinary
- **Seguridad:** bcryptjs, cors

## 📁 Estructura del Proyecto

```
club-fama-valle/
├── config/
│   ├── db.js          # Configuración de MongoDB
│   └── cloudinary.js  # Configuración de Cloudinary
├── controllers/
│   ├── authController.js    # Lógica de autenticación
│   └── paymentController.js # Lógica de pagos
├── middleware/
│   └── auth.js        # Middleware de autenticación JWT
├── models/
│   ├── User.js        # Modelo de usuarios
│   └── Payment.js     # Modelo de pagos
├── routes/
│   ├── authRoutes.js  # Rutas de autenticación
│   └── paymentRoutes.js # Rutas de pagos
├── .env               # Variables de entorno
├── .gitignore         # Archivos ignorados por git
├── package.json       # Dependencias del proyecto
├── server.js          # Punto de entrada
└── README.md          # Documentación
```

## 🔧 Instalación

1. **Clonar el repositorio:**
```bash
git clone <url-del-repositorio>
cd club-fama-valle
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
Crear archivo `.env` con las siguientes variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/club-fama-valle
JWT_SECRET=tu-secreto-jwt
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

4. **Iniciar el servidor:**
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (requiere autenticación)

### Pagos
- `POST /api/payments` - Subir comprobante de pago (Jugador)
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

1. **Gestión de Usuarios:** Registro y autenticación con roles
2. **Subida de Comprobantes:** Soporte para PDF e imágenes (JPG/PNG)
3. **Aprobación de Pagos:** Sistema de aprobación por administradores
4. **Estado de Deuda:** Actualización automática según pagos aprobados
5. **Historial de Pagos:** Visualización de pagos por usuario

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

---

Desarrollado con ❤️ para Club FAMA VALLE
