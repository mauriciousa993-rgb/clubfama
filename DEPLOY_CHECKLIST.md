# 🚀 Checklist de Despliegue - Club FAMA VALLE

## ✅ Pre-Despliegue (Local)

- [ ] Todas las funcionalidades funcionan en local
- [ ] Subida de comprobantes de pago (hasta 10MB)
- [ ] Aprobación/rechazo de pagos desde admin
- [ ] Visualización correcta de datos del jugador
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en la terminal del servidor

## ✅ Configuración MongoDB Atlas

- [ ] Cuenta creada en MongoDB Atlas
- [ ] Cluster creado (M0 gratis)
- [ ] Usuario de base de datos creado
- [ ] Contraseña del usuario guardada
- [ ] IP 0.0.0.0/0 agregada a Network Access
- [ ] URI de conexión copiada

## ✅ Configuración Render (Backend)

- [ ] Cuenta creada en Render (render.com)
- [ ] Repositorio de GitHub conectado
- [ ] Web Service creado
- [ ] Build Command: `cd backend && npm install`
- [ ] Start Command: `cd backend && npm start`
- [ ] Variables de entorno configuradas:
  - [ ] `NODE_ENV=production`
  - [ ] `MONGODB_URI` (URI de Atlas)
  - [ ] `JWT_SECRET` (secreto seguro)
  - [ ] `FRONTEND_URL` (URL de Vercel, temporalmente `https://club-fama-valle.vercel.app`)
- [ ] Disk creado:
  - [ ] Name: `uploads`
  - [ ] Mount Path: `/opt/render/project/src/uploads`
  - [ ] Size: 1 GB
- [ ] Deploy ejecutado sin errores
- [ ] Health check funciona: `https://tu-api.onrender.com/api/health`

## ✅ Configuración Vercel (Frontend)

- [ ] Cuenta creada en Vercel (vercel.com)
- [ ] Repositorio de GitHub importado
- [ ] Framework Preset: `Other`
- [ ] Root Directory: `./`
- [ ] Deploy ejecutado sin errores
- [ ] URL del frontend copiada

## ✅ Post-Despliegue (Conexión)

- [ ] Actualizar `FRONTEND_URL` en Render con URL real de Vercel
- [ ] Actualizar `RENDER_API_URL` en `frontend/public/js/auth.js` con URL real de Render
- [ ] Hacer commit y push de los cambios
- [ ] Verificar que Vercel redeploya automáticamente
- [ ] Probar flujo completo:
  - [ ] Registro de nuevo usuario
  - [ ] Login
  - [ ] Subir comprobante de pago
  - [ ] Ver comprobante en panel de admin
  - [ ] Aprobar/rechazar pago
  - [ ] Verificar que el estado de deuda se actualiza

## ✅ Verificación Final

- [ ] No hay errores CORS en la consola del navegador
- [ ] Los archivos subidos se pueden ver correctamente
- [ ] El nombre del jugador aparece en los pagos
- [ ] El mes del pago se muestra correctamente
- [ ] Los botones de aprobar/rechazar funcionan
- [ ] La aplicación es responsive en móvil

## 🆘 Solución de Problemas Comunes

### Error: "Cannot connect to MongoDB"
- Verificar que la URI de Atlas esté correcta
- Verificar que la contraseña no tenga caracteres especiales sin encodear
- Verificar que IP 0.0.0.0/0 esté en Network Access

### Error: "CORS policy"
- Verificar que `FRONTEND_URL` en Render coincida exactamente con la URL de Vercel
- Incluir `https://` en la URL
- No incluir `/` al final de la URL

### Error: "File too large"
- Verificar que el archivo sea menor a 10MB
- Comprimir imágenes antes de subir

### Error: "Cannot GET /uploads/..."
- Verificar que el Disk en Render esté configurado correctamente
- Verificar que `mountPath` sea exactamente: `/opt/render/project/src/uploads`

### Error: "User not found" en pagos
- Verificar que el backend haga `populate('player_ref')` en `getAllPayments`
- Verificar que el usuario exista en la base de datos

## 📞 Contacto y Soporte

Si tienes problemas:
1. Revisar logs en Render Dashboard (Logs tab)
2. Revisar consola del navegador (F12 → Console)
3. Verificar Network tab para ver las requests
4. Comparar configuración con `.env.example`

---

¡Listo para desplegar! 🚀
