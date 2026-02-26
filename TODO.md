# TODO: Agregar campos al perfil del jugador y cambiar categoría femenino por infantil

## Campos nuevos a agregar:
- [x] Fecha de expedición del documento (document_issue_date)
- [x] Lugar de expedición (document_issue_place)
- [x] Nacionalidad (nationality)
- [x] Departamento de nacimiento (birth_department)
- [x] Municipio de nacimiento (birth_municipality)
- [x] Género (gender): masculino, femenino, otro
- [x] Estatura (height)
- [x] Peso (weight)
- [x] EPS (eps)
- [x] Tipo de sangre (blood_type)

## Cambiar "femenino" por "infantil" en toda la app:

### Backend:
- [x] backend/models/User.js - Enum y nuevos campos
- [x] backend/models/Formation.js - Enum
- [x] backend/models/Event.js - Enum
- [x] backend/controllers/authController.js - allowedFields

### Frontend:
- [x] frontend/public/pages/player-profile.html - Formulario y categoría
- [x] frontend/public/pages/players.html - Categoría
- [x] frontend/public/js/players.js - Categoría default y visualización de nuevos campos
- [x] frontend/public/pages/reports.html - Categoría
- [x] frontend/public/js/reports.js - Array y nombres
- [x] frontend/public/pages/formations.html - Categoría

## Nueva Página de Cumpleaños:
- [x] frontend/public/pages/birthdays.html - Página HTML creada
- [x] frontend/public/css/birthdays.css - Estilos creados
- [x] frontend/public/js/birthdays.js - Funcionalidad JavaScript
- [x] frontend/public/pages/dashboard.html - Enlace agregado al menú
- [x] frontend/public/pages/players.html - Enlace agregado al menú
- [x] frontend/public/pages/payments.html - Enlace agregado al menú
- [x] frontend/public/pages/calendar.html - Enlace agregado al menú
- [x] frontend/public/pages/formations.html - Enlace agregado al menú
- [x] frontend/public/pages/reports.html - Enlace agregado al menú
- [x] frontend/public/pages/player-dashboard.html - Enlace agregado al menú
- [x] frontend/public/pages/player-profile.html - Enlace agregado al menú
- [x] frontend/public/pages/player-calendar.html - Enlace agregado al menú
- [x] frontend/public/pages/player-formations.html - Enlace agregado al menú

## Progreso:
✅ COMPLETADO - Todos los cambios implementados exitosamente



### Resumen de cambios realizados:

**Backend (Modelos):**
- User.js: Agregados 10 nuevos campos al esquema y cambiado enum de 'femenino' a 'infantil'
- Formation.js: Actualizado enum team_category
- Event.js: Actualizado enum team_category

**Backend (Controladores):**
- authController.js: Actualizados allowedFields en updateProfile y updateUser, y objetos de respuesta

**Frontend (Perfil del Jugador):**
- player-profile.html: Nuevos campos de documento (fecha/lugar expedición), información de nacimiento (nacionalidad, departamento, municipio), género, estatura, peso, EPS, tipo de sangre. Categoría cambiada a "infantil"

**Frontend (Administración):**
- players.html: Dropdowns de categoría actualizados
- players.js: Categoría default cambiada y vista de perfil actualizada con nuevos campos
- reports.html: Filtro de categoría actualizado
- reports.js: Array de categorías y nombres actualizados
- formations.html: Dropdowns de categoría actualizados
