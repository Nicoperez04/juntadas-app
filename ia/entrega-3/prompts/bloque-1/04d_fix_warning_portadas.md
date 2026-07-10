# Prompt 04d — Fix WARNING portadas meetup-covers en delete-account

## Contexto
Rama actual: feature/bloque-1-deuda-tecnica
La Edge Function delete-account lanza WARNING:
"No se pudieron listar portadas en Storage: Invalid schema: storage"

El helper listUserCoverPaths usa admin.schema('storage').from('objects')
que no está disponible via PostgREST en Edge Functions con service_role.
Resultado: las portadas del usuario en meetup-covers no se eliminan.

La solución es reemplazar la query al schema storage por una consulta
a meetups.cover_url en el schema public, que sí es accesible.
La URL pública contiene el path: extraerlo con el mismo patrón que
usa getCoverFilePath en EditMeetupScreen.

Patrón de URL: .../meetup-covers/{meetupId}/{userId}/{timestamp}.jpg
Marker para extraer path: '/meetup-covers/'

## Tarea 1 — Análisis previo
Sin tocar ningún archivo, reportá:

1. En delete-account/index.ts, función listUserCoverPaths
   (líneas 157-180):
   ¿Cómo filtra exactamente que el userId sea el segundo
   segmento del path? ¿Solo filtra por LIKE o también
   valida en JS?

2. En meetups, ¿cover_url puede ser null? ¿Qué valor tiene
   si la juntada no tiene portada?

3. ¿El usuario eliminado puede tener portadas en juntadas
   que NO era organizador (por ejemplo juntadas transferidas
   donde había subido la portada antes de transferir)?
   Esto determina si alcanza con filtrar por created_by
   o hay que buscar por el userId en la URL.

No tocar ningún archivo, solo reportar.

## Tarea 2 — Reemplazar listUserCoverPaths
En supabase/functions/delete-account/index.ts:

Reemplazar la función listUserCoverPaths completa por esta
implementación que consulta meetups.cover_url en public:

/**
 * Obtiene paths de portadas subidas por el usuario en meetup-covers
 * consultando cover_url en la tabla meetups (schema public).
 * Solo considera portadas activas (cover_url NOT NULL).
 * Portadas reemplazadas (paths viejos) no se recuperan — limitación
 * aceptada porque no hay registro de portadas históricas.
 */
const listUserCoverPaths = async (
  admin: SupabaseClient,
  userId: string,
): Promise<string[]> => {
  const marker = '/meetup-covers/';
  // Buscar juntadas con cover_url que contenga el userId en el path
  const { data, error } = await admin
    .from('meetups')
    .select('cover_url')
    .not('cover_url', 'is', null)
    .like('cover_url', `%/${userId}/%`);
  if (error) {
    console.warn('No se pudieron listar portadas:', error.message);
    return [];
  }
  return (data ?? [])
    .map((row) => {
      const url = (row as { cover_url: string }).cover_url;
      const index = url.indexOf(marker);
      if (index === -1) return null;
      return url.substring(index + marker.length);
    })
    .filter((path): path is string => path !== null)
    .filter((path) => path.split('/')[1] === userId);
};

No modificar ninguna otra función.
No hacer commits.
Archivos esperados:
- supabase/functions/delete-account/index.ts

## Tarea 3 — Documentar este prompt
Crear el archivo:
ia/entrega-3/prompts/bloque-1/04d_fix_warning_portadas.md
con el contenido completo de este prompt.
Actualizar ia/entrega-3/indice_ia.md agregando:
04d - Fix WARNING portadas meetup-covers: reemplazar
      query schema storage por consulta a meetups.cover_url

No hacer commits.

## Reglas generales
- Comentarios en español
- Sin TypeScript any
- No hacer commits
- Si algo es ambiguo, preguntar antes de asumir

## Al finalizar reportar
1. Archivos modificados
2. Cómo quedó listUserCoverPaths exactamente
3. Limitación documentada sobre portadas históricas
4. Cómo probarlo:
   - supabase functions deploy delete-account
   - Cuenta de prueba con juntada que tenga portada subida
   - Eliminar cuenta
   - Verificar en Supabase Storage → meetup-covers que
     no quedan archivos del usuario
   - Verificar que no aparece WARNING en los logs de
     la Edge Function
