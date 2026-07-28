# Prompt 01 — Bloque 8: Skeleton Loader en Detalle de Juntadas y Ajustes Visuales

## Contexto de la tarea
Estamos iniciando el Bloque 8 (Pulido Visual), el último bloque del proyecto. 
El objetivo de esta tarea es implementar un componente Skeleton en `MeetupDetailScreen.tsx` para mejorar la experiencia de carga y corregir un detalle de alineación/padding en las tarjetas de enfrentamientos de la liga.

## Tareas de Implementación
1. **Ajuste de Layout en Enfrentamientos de Liga**:
   - Corregir el espaciado/padding del título "Enfrentamientos de la Fecha X" en `LeagueGameScreen.tsx` para que no quede pegado al borde izquierdo del contenedor blanco.
2. **Implementación de Skeleton en MeetupDetailScreen**:
   - Diseñar y desarrollar un componente de carga tipo Skeleton (`MeetupDetailSkeleton.tsx`) que simule el layout completo de la pantalla de detalle de una juntada (portada/imagen, título, fecha, hora, ubicación, lista de participantes).
   - Usar animaciones suaves de opacidad (fade/shimmer) usando `Animated` de React Native.
   - Integrar este Skeleton en `MeetupDetailScreen.tsx` reemplazando los indicadores de carga (spinners o pantallas en blanco) cuando `isLoading` sea true.

## Restricciones explícitas
- Código en TypeScript estricto.
- Comentarios y documentación estrictamente en español.
- NO realizar ningún `git commit` automático.
