# Bloque 1 — Prompt correctivo

## Contexto
Estamos en la rama `feature/bloque-1-mejoras-juntada`.
El Bloque 1 principal está implementado pero hay correcciones necesarias
antes de mergear. Este prompt resuelve 4 problemas identificados en testing.

## Stack relevante
- React Native + Expo SDK 55 + TypeScript
- Supabase (Auth + PostgreSQL + Storage)
- TanStack Query v5
- Design tokens en src/shared/constants/theme.ts
- Comentarios en español, sin TypeScript any

---

### Corrección 1 — Doble parpadeo en modal de transferir organizador

Problema:
Al abrir el modal de transferencia de organizador hay un doble parpadeo
visible en la transición de apertura.

Alcance:
- Revisá cómo se monta el modal en MeetupOrganizerActions.tsx
- El problema típico es un estado booleano que se actualiza dos veces
  antes de que el modal termine de montarse, o una animación que
  conflictúa con el render inicial
- Corregí el timing o la secuencia de estados para que la apertura
  sea una transición limpia y sin parpadeo
- Si el modal usa el componente Modal de React Native, verificá que
  animationType sea 'fade' o 'slide' consistente con el resto de la app

No hacer:
- No cambiar la lógica de negocio de la transferencia
- No cambiar el diseño visual del modal

Archivos esperados:
- src/features/meetups/components/MeetupOrganizerActions.tsx (corregido)

---

### Corrección 2 — Animaciones de éxito en acciones nuevas

Problema:
Las acciones nuevas del Bloque 1 no tienen feedback visual de éxito
consistente con el resto de la app.

Alcance:
Revisá cómo se manejan las animaciones/feedback de éxito en acciones
existentes (por ejemplo al crear juntada, al modificar asistencia)
y replicá el mismo patrón en:

1. Subida de portada exitosa (en CreateMeetupScreen y EditMeetupScreen)
2. Eliminación de portada exitosa (en EditMeetupScreen)
3. Transferencia de organizador exitosa (en MeetupOrganizerActions)

El feedback debe ser consistente: mismo tipo de toast, misma duración,
mismo estilo que el resto de la app. No inventar un patrón nuevo.

No hacer:
- No cambiar la lógica de negocio
- No instalar librerías de animación nuevas

Archivos esperados:
- src/features/meetups/screens/CreateMeetupScreen.tsx (feedback de éxito en portada)
- src/features/meetups/screens/EditMeetupScreen.tsx (feedback en subir/quitar portada)
- src/features/meetups/components/MeetupOrganizerActions.tsx (feedback en transferencia)

---

### Corrección 3 — Agregar compartir por sistema nativo

Problema:
Al reemplazar los botones de compartir anteriores por MeetupShareButton,
se perdió la opción de compartir por cualquier app del sistema
(Instagram, Telegram, Mail, etc.). Solo quedaron WhatsApp y copiar código.

Alcance:
En MeetupShareButton.tsx agregar una tercera opción en el bottom sheet:
"Compartir con otra app"

- Usar la API Share de React Native (import { Share } from 'react-native')
- No instalar ninguna librería nueva
- El mensaje compartido es el mismo que el de WhatsApp:
  "Te invito a [nombre de la juntada] en Juntadas 🎉
   El código para unirte es: [join_code]
   ¡Nos vemos!"
- Si Share.share falla, mostrar toast de error
- El orden de opciones en el bottom sheet queda:
  1. Copiar código
  2. Compartir por WhatsApp
  3. Compartir con otra app

No hacer:
- No cambiar las opciones existentes de copiar y WhatsApp
- No modificar otros archivos

Archivos esperados:
- src/features/meetups/components/MeetupShareButton.tsx (tercera opción agregada)

---

### Corrección 4 — Juntadas vencidas por tiempo siguen apareciendo como próximas

Problema:
Juntadas con fecha ya pasada aparecen en "próximas juntadas" en el home
en lugar de moverse al historial. El status en la DB no se actualiza
automáticamente con el paso del tiempo.

Solución: función SQL llamada desde el cliente al cargar juntadas.

Parte A — Migración SQL:
Crear supabase/migrations/006_update_expired_meetups.sql con:

1. Función update_expired_meetups():
   - Actualiza status = 'finished' en todas las juntadas donde:
     * status IN ('upcoming', 'active')
     * La combinación de date + time ya es anterior a NOW()
     * date es tipo DATE y time es tipo TIME en la tabla meetups
       (verificá los tipos reales antes de escribir el SQL)
   - La función no recibe parámetros y no retorna nada (RETURNS void)
   - Usar SECURITY DEFINER para que pueda actualizar filas de otros usuarios
   - Comentarios en español

IMPORTANTE: solo generás el archivo SQL.
La migración la ejecuta el equipo manualmente en el SQL Editor de Supabase.

Parte B — Llamar la función desde el servicio:
En meetupService.ts, en el método que obtiene las juntadas del usuario
(el que alimenta el home y el historial):
- Antes de hacer el SELECT principal, ejecutar:
  await supabase.rpc('update_expired_meetups')
- Si la llamada al RPC falla, loguearlo pero NO interrumpir el flujo
  (la app sigue cargando las juntadas aunque la función falle)
- Comentario en español explicando por qué se llama antes del SELECT

No hacer:
- No crear triggers (no se disparan por el paso del tiempo)
- No crear Edge Functions ni cron jobs
- No modificar otros métodos de meetupService

Archivos esperados:
- supabase/migrations/006_update_expired_meetups.sql (nuevo)
- src/features/meetups/services/meetupService.ts (llamada a RPC antes del SELECT)

---

## Reglas generales
- No instalar dependencias adicionales
- No tocar android/ ni ios/
- No hacer commits
- Comentarios en español
- Sin TypeScript any
- Seguir tokens de src/shared/constants/theme.ts
- Reportar archivos modificados y decisiones al finalizar cada corrección
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar
Resumen con:
1. Archivos modificados por corrección
2. Decisiones tomadas
3. Cosas a probar en dispositivo
