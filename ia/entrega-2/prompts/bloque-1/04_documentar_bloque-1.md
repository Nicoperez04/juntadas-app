# Documentación — Cierre del Bloque 1: Mejoras de Juntada

## Tarea
Organizá la evidencia del Bloque 1 dentro de `ia/entrega-2/`.

## 1. Creá `ia/entrega-2/conversaciones/bloque-1/cursor-bloque-1-completo.md`

# Conversación Bloque 1 — Mejoras de Juntada

**Herramienta:** Cursor Agent  
**Rama:** feature/bloque-1-mejoras-juntada

## Resumen

### Lo que se implementó
- Migración 005_meetup_cover.sql: columna cover_url en meetups,
  bucket meetup-covers (public: true), 4 políticas RLS de Storage,
  fix de política UPDATE en meetups para transferencia de organizador
- Migración 006_update_expired_meetups.sql: descartada (ver decisiones)
- Tipo Meetup actualizado con cover_url?: string | null
- meetupService: métodos uploadMeetupCover, removeMeetupCover, transferOrganizer
- useMeetups: hooks useUploadMeetupCover, useRemoveMeetupCover, useTransferOrganizer
- CreateMeetupScreen: sección de portada opcional con preview 16:9
- EditMeetupScreen: portada actual con opciones cambiar/quitar
- MeetupDetailHeader: banner de portada 200dp si hay cover_url
- MeetupHomeScreen: thumbnail 60dp en cards con portada
- MeetupShareButton: bottom sheet con copiar código, WhatsApp y compartir nativo
- MeetupOrganizerActions: transferencia de organizador con modal de pasos
- Fix parpadeo modal: un solo Modal con pasos internos (closed → list → confirm)
- Feedback de éxito con toast ✓ y triggerSuccessHaptic() en todas las acciones nuevas
- Fix bug UX: botón "Ver historial" agregado al empty state del home

### Decisiones tomadas
- Bucket public: true (igual que avatars y memories) para permitir render en Image
- role = 'participant' en lugar de 'member' (el enum no admite 'member')
- Finalización automática de juntadas por hora DESCARTADA: el estado
  finished/cancelled es exclusivamente manual accionado por el organizador,
  porque la juntada puede estar en curso más allá de su hora estimada
- WhatsApp con Linking.openURL directo sin canOpenURL (scheme no declarado en config nativa)
- Modal único con pasos para transferencia (evita doble parpadeo)
- Toast diferido con pendingToastRef para no superponer con cierre de modal
- Share nativo con API Share de React Native (sin librerías nuevas)

### Problemas encontrados y resueltos
- Bucket privado vs URL pública — resuelto eligiendo public: true
- Política RLS faltante para UPDATE en transferencia — agregada en migración 005
- Enum 'member' inexistente — corregido a 'participant'
- Función update_expired_meetups() finalizó juntadas de hoy por diferencia UTC/Argentina
  — función eliminada de Supabase, decisión de no automatizar documentada
- Juntadas reactivadas manualmente en SQL Editor
- Bug UX: "Ver historial" no aparecía en empty state — corregido en MeetupHomeScreen

### Deuda técnica documentada
- Archivos huérfanos en Storage al reemplazar portada (mejora futura)
- CoverPickerSection duplicado en Create/Edit (candidato a componente compartido)
- Picker 16:9 no fuerza recorte en iOS (limitación de la plataforma)

## Conversación completa
[Pegar acá la conversación exportada de Cursor]

## 2. Creá `ia/entrega-2/prompts/bloque-1/` con los siguientes archivos vacíos
(el contenido lo pegás vos desde esta conversación)

ia/entrega-2/prompts/bloque-1/
├── 01_mejoras_juntada.md
├── 02_correctivo_mejoras_juntada.md
├── 03_correctivo_expired_meetups.md
└── 04_documentar_bloque-1.md   ← este prompt

## 3. Actualizá `ia/entrega-2/indice_ia.md`

Agregá las siguientes entradas:

07 - Foto de portada de juntada (Storage, upload, preview, thumbnail en home)
08 - Compartir juntada por WhatsApp, copiar código y share nativo
09 - Transferencia de organizador con modal de pasos
10 - Fix parpadeo modal transferencia y feedback de éxito con haptics
11 - Decisión: finalización automática de juntadas descartada (manual only)
12 - Fix bug UX: Ver historial en empty state del home

## Restricciones
- No tocar ningún archivo de código
- No hacer commits
- Solo crear o modificar archivos dentro de ia/entrega-2/

## Al finalizar reportá
1. Archivos creados o modificados
2. Cualquier inconsistencia encontrada
