# Conversación Bloque 3 — Historial mejorado

**Herramienta:** Cursor Agent  
**Rama:** feature/bloque-3-historial-mejorado

## Resumen

### Lo que se implementó

- Instalación y setup de @gorhom/bottom-sheet v5 con react-native-reanimated
  y react-native-gesture-handler; babel.config.js creado desde cero;
  App.tsx envuelto con GestureHandlerRootView > BottomSheetModalProvider
- Migración 008_meetup_hidden.sql: tabla meetup_hidden con RLS
- meetupService: getAllUserMeetups, hideMeetup, deleteMeetupForAll, reactivateMeetup
- useMeetups: useAllUserMeetups, useHideMeetup, useDeleteMeetupForAll, useReactivateMeetup
- MeetupHistoryScreen rediseñada: búsqueda en tiempo real, bottom sheet de filtros
  con enableDynamicSizing, chips activos horizontales con wrap, swipe actions,
  selección múltiple de estados, filtro de rol y rango de fechas
- MeetupDetailScreen: zona destructiva al final con ocultar/eliminar según rol
- MeetupOrganizerActions: botón reactivar juntada con advertencia si tiene reseñas
- Toasts y haptics en todas las acciones nuevas

### Decisiones tomadas

- enableDynamicSizing en lugar de snap points fijos (v5 lo soporta)
- pointerEvents="box-none" en contenedor del buscador para no interceptar toques
- keyboardShouldPersistTaps="handled" en FlatList del historial
- Selección múltiple solo en estado (rol sigue siendo único)
- Hard delete para organizador, soft hide para participante
- Navegación diferida tras ocultar/eliminar desde detalle: toast → goBack()
- getFinishedMeetups conservado por compatibilidad, historial usa useAllUserMeetups

### Problemas encontrados y resueltos

- Buscador bloqueado por wrapper que interceptaba toques — resuelto con
  pointerEvents="box-none" y TextInput directamente tocable
- Bottom sheet cortaba botones al abrir — resuelto con enableDynamicSizing
  y reemplazo de BottomSheetScrollView por BottomSheetView
- Chips de filtros apilados verticalmente — resuelto con flexWrap row
- Bottom sheet no mostraba todo el contenido en snap point inicial —
  resuelto con enableDynamicSizing que ajusta al contenido real
- Buscador no permitía escribir tras corrección de layout — resuelto con TextInput
  a ancho completo e íconos en position absolute (sin competir por el área táctil)
- Focus del buscador no se cerraba al tocar fuera — resuelto con blurSearch(),
  overlay transparente sobre la lista y cierre al deslizar o abrir filtros
- Espaciado muy compacto entre secciones del bottom sheet — ajustado con
  márgenes theme.spacing.sm/md manteniendo botones fijos al pie

### Deuda técnica documentada

- Vista de juntadas ocultas (solo se pueden ocultar, no ver/recuperar)
- Paginación del historial para usuarios con muchas juntadas (E3)
- Swipe actions solo funciona en Android de forma estable;
  puede necesitar ajustes en iOS en producción