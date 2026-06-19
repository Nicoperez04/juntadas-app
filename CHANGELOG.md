# Changelog — Ronda App

Todos los cambios relevantes del proyecto están documentados
en este archivo. El formato sigue la convención
[Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [2.0.0] — Entrega 2 — Junio 2026

### Agregado
- Foto de portada para juntadas (cámara o galería)
- Compartir juntada por WhatsApp, copiar código y share nativo
- Transferencia de organizador a otro participante confirmado
- Sistema de reseñas post-juntada: habilitación por organizador,
  puntaje 1-5 estrellas, comentario opcional, promedio en detalle
- Historial completo con búsqueda en tiempo real y filtros
  combinables (estado, rol, rango de fechas) via bottom sheet
- Ocultar juntadas del historial individual sin afectar al resto
- Hub de juegos rediseñado en grid con dos secciones
- Juego "¿Qué soy?" con 6 categorías en modo landscape
- Preguntas para el grupo (100 preguntas en 5 categorías)
- Anotador genérico con puntaje objetivo configurable
- Temporizador (cuenta regresiva y cronómetro)
- Equipos aleatorios con animación de mezclar
- Notificaciones push (FCM V1) e in-app en tiempo real
- Banner flotante de notificaciones con Supabase Realtime
- Panel de notificaciones con historial paginado y swipe
- Badge de no leídas en campana del home
- Toggle de notificaciones push desde el perfil
- Recordatorio local 2 horas antes de cada juntada confirmada
- Edge Function send-push-notification en Supabase
- Recuperación de contraseña por deep link (rondaapp://reset-password)
- Cambio de contraseña desde el perfil estando autenticado
- Eliminación de cuenta con doble confirmación
- Animación de éxito global (SuccessAnimation) en todas las pantallas
- Animación de error global (ErrorAnimation) en todas las pantallas
- Skeleton de carga en el Home
- Accesibilidad WCAG AA: fuentes mínimo 14sp, áreas táctiles 48dp
- Ícono real de la app en el launcher de Android
- EAS Build configurado con perfiles development/preview/production

### Modificado
- Finalización de juntada ahora habilita opción de reseñas
- Historial muestra todas las juntadas (activas, finalizadas
  y canceladas), no solo las finalizadas
- Foto de perfil se guarda únicamente al confirmar con "Guardar"
- Selector de foto ahora ofrece cámara y galería en todos
  los contextos (portada, recuerdos, perfil)
- El organizador puede eliminar fotos de cualquier participante
- Salir de "Modificar asistencia" sin cambios ya no recarga
  la pantalla de detalle
- Impostor accesible directamente desde el hub sin pantalla
  intermedia de instrucciones
- Botones "Cerrar sesión" y "Eliminar cuenta" diferenciados
  visualmente por peso y color
- TanStack Query actualizado a v5 con hook useCurrentUser
  centralizado

### Corregido
- Bug crítico: juntadas finalizaban automáticamente en horario
  incorrecto por diferencia UTC vs Argentina (UTC-3)
- Mensajes de error de Supabase Auth traducidos al español
- Área táctil de botones icónicos aumentada a mínimo 48dp
- Versión sincronizada a 2.0.0 en app.json, package.json
  y appConfig.ts

---

## [1.0.0] — Entrega 1 — Abril 2026

### Agregado
- Autenticación completa con Supabase Auth
- Creación y gestión de juntadas con código de unión único
- Unirse a juntada por código
- Gestión de asistencia por participante
- Abandono de juntada
- Juego El Impostor integrado con roles ocultos
- Galería de recuerdos fotográficos por juntada
- Historial de juntadas finalizadas y canceladas
- Perfil de usuario con avatar y estadísticas
- Roles diferenciados: Organizador y Participante
- Navegación tipada con React Navigation
- Base de datos PostgreSQL en Supabase con RLS

---
