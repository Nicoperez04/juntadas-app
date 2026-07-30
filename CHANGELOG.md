# Changelog — Ronda App

Todos los cambios relevantes del proyecto están documentados
en este archivo. El formato sigue la convención
[Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [3.0.0] - Entrega 3 - Julio 2026

### Agregado
- Gestión completa de Grupos: crear, unirse por código, listar, ver detalle y miembros
- Roles de grupo (admin/member), expulsar miembros y transferir administración
- Invitar a todo el grupo a una juntada nueva con una sola acción
- Historial de juntadas del grupo (activas, finalizadas, canceladas) con filtros por estado, rol y rango de fechas
- Sistema de notificaciones de grupo: unión, expulsión, transferencia de admin, salida, invitación a juntada de grupo
- Ubicación GPS en juntadas: selector de punto en el mapa al crear/editar, visualización en el detalle con botón "Cómo llegar"
- Catálogo de juegos nuevo: Anotador de Truco, Anotador de Generala, Sorteador, Generador de Ligas (Round Robin), Generador de Torneos (eliminación directa)
- Estadísticas de juntadas individuales: registro automático de resultados, resumen e historial completo
- Estadísticas por grupo: vista consolidada de resultados de todas las juntadas del grupo
- Auto-refresh en tiempo real por tipo de notificación, pull-to-refresh en Home y Detalle, skeletons con shimmer
- Suite de tests unitarios: 51 tests (authService, meetupService)
- Animaciones de entrada y feedback táctil en listados de juntadas (Home y Grupos)

### Modificado
- Hard delete de cuenta: transferencia automática de organizador, limpieza de Storage, anonimización de partidas de Impostor
- `leave_group` y `expel_group_member` gestionan juntadas activas del grupo afectadas (transferencia de organización o cancelación automática)
- Notificaciones de grupo con deep-link directo a la pantalla correspondiente
- `join_group_by_code` migrado a función `SECURITY DEFINER`, validación de código server-side
- Skeleton de detalle de juntada y pulido visual general (paddings, truncamiento de texto, animaciones)

### Corregido
- Vulnerabilidad: policy de `groups` permitía listar todos los grupos del sistema sin conocer el código de invitación
- Vulnerabilidad: policy de `group_members` permitía insertar membresías directas sin validar código
- Vulnerabilidad: funciones de grupo sin `REVOKE EXECUTE FROM PUBLIC`
- Bug de privilegio escalado en verificación de rol admin
- Bug de RLS todo-o-nada al notificar salida de grupo
- Bug de shadowing de variable en PL/pgSQL (`RETURNS TABLE`), presente en 3 funciones distintas
- API key de Google Maps expuesta en el código fuente, migrada a variable de entorno
- Restricción de SHA-1 desactualizada en Google Cloud Console, impedía la carga del mapa
- Race condition en el toggle de notificaciones push
- `meetup_participants.role` no se actualizaba al transferir organizador
- Error silencioso al cargar participantes y subida parcial de fotos sin feedback al usuario

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
