/**
 * Edge Function: delete-account
 *
 * Elimina permanentemente la cuenta del usuario autenticado siguiendo
 * el orden acordado en D26. Usa service_role para bypassear RLS.
 *
 * Seguridad:
 *   - Requiere JWT válido en Authorization; solo puede eliminar su propia cuenta.
 *   - Auth se elimina al final para que un fallo intermedio permita reintentar.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Cabeceras CORS — mismo patrón que send-push-notification */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MEMORIES_BUCKET = 'memories';
const AVATARS_BUCKET = 'avatars';
const COVERS_BUCKET = 'meetup-covers';

/** Respuesta de error con número de paso para debugging */
interface StepErrorResponse {
  error: string;
  step: number;
}

/** Fila mínima de participante para transferencia de organizador */
interface ParticipantRow {
  user_id: string;
}

/** Fila mínima de recuerdo para borrar archivos en Storage */
interface MemoryFileRow {
  file_path: string;
}

/** Objeto de Storage listado desde el schema storage */
interface StorageObjectRow {
  name: string;
}

/**
 * Construye una Response JSON de error etiquetada con el paso que falló.
 */
const stepError = (step: number, message: string, status = 500): Response =>
  new Response(
    JSON.stringify({ error: message, step } satisfies StepErrorResponse),
    {
      status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    },
  );

/**
 * PASO 1 — Transfiere juntadas organizadas o las elimina si no hay
 * participantes confirmados activos distintos del organizador.
 */
const transferOrDeleteOrganizedMeetups = async (
  admin: SupabaseClient,
  userId: string,
): Promise<Response | null> => {
  const { data: meetups, error: fetchError } = await admin
    .from('meetups')
    .select('id')
    .eq('created_by', userId);

  if (fetchError) {
    return stepError(1, `No se pudieron listar las juntadas: ${fetchError.message}`);
  }

  for (const meetup of meetups ?? []) {
    const { data: successor, error: participantError } = await admin
      .from('meetup_participants')
      .select('user_id')
      .eq('meetup_id', meetup.id)
      .neq('user_id', userId)
      .eq('attendance_status', 'confirmed')
      .is('left_at', null)
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (participantError) {
      return stepError(
        1,
        `No se pudo buscar sucesor para la juntada ${meetup.id}: ${participantError.message}`,
      );
    }

    if (successor) {
      const successorUserId = (successor as ParticipantRow).user_id;

      const { error: transferError } = await admin
        .from('meetups')
        .update({ created_by: successorUserId })
        .eq('id', meetup.id);

      if (transferError) {
        return stepError(
          1,
          `No se pudo transferir la juntada ${meetup.id}: ${transferError.message}`,
        );
      }

      // La app usa meetup_participants.role para isOrganizer, no solo created_by
      const { error: promoteError } = await admin
        .from('meetup_participants')
        .update({ role: 'organizer' })
        .eq('meetup_id', meetup.id)
        .eq('user_id', successorUserId);

      if (promoteError) {
        return stepError(
          1,
          `No se pudo actualizar el rol del nuevo organizador en ${meetup.id}: ${promoteError.message}`,
        );
      }
    } else {
      const { error: deleteError } = await admin
        .from('meetups')
        .delete()
        .eq('id', meetup.id);

      if (deleteError) {
        return stepError(
          1,
          `No se pudo eliminar la juntada ${meetup.id}: ${deleteError.message}`,
        );
      }
    }
  }

  return null;
};

/**
 * Elimina paths de un bucket ignorando errores (p. ej. archivo inexistente).
 */
const removeStoragePathsSilent = async (
  admin: SupabaseClient,
  bucket: string,
  paths: string[],
): Promise<void> => {
  if (paths.length === 0) return;

  const { error } = await admin.storage.from(bucket).remove(paths);
  if (error) {
    console.warn(`Storage ${bucket}: no se pudieron eliminar algunos archivos:`, error.message);
  }
};

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

/**
 * PASO 2 — Elimina archivos físicos del usuario en Storage:
 * memories (tabla memories), avatar (avatars) y portadas (meetup-covers).
 */
const deleteUserStorageFiles = async (
  admin: SupabaseClient,
  userId: string,
): Promise<Response | null> => {
  const { data: memories, error: fetchError } = await admin
    .from('memories')
    .select('file_path')
    .eq('uploaded_by', userId);

  if (fetchError) {
    return stepError(2, `No se pudieron listar recuerdos: ${fetchError.message}`);
  }

  const memoryPaths = (memories ?? [])
    .map((row) => (row as MemoryFileRow).file_path)
    .filter((path) => path.length > 0);

  if (memoryPaths.length > 0) {
    const { error: memoryStorageError } = await admin.storage
      .from(MEMORIES_BUCKET)
      .remove(memoryPaths);

    if (memoryStorageError) {
      return stepError(
        2,
        `No se pudieron eliminar fotos de recuerdos: ${memoryStorageError.message}`,
      );
    }
  }

  // Avatar: puede no existir si el usuario nunca subió foto de perfil
  await removeStoragePathsSilent(admin, AVATARS_BUCKET, [`${userId}/avatar.jpg`]);

  // Portadas huérfanas tras transferir juntadas (path con userId en posición 2)
  const coverPaths = await listUserCoverPaths(admin, userId);
  await removeStoragePathsSilent(admin, COVERS_BUCKET, coverPaths);

  return null;
};

/**
 * PASO 3 — Anonimiza referencias del usuario en impostor_games.
 * Requiere migración 011 (created_by nullable).
 */
const anonymizeImpostorGames = async (
  admin: SupabaseClient,
  userId: string,
): Promise<Response | null> => {
  const { error: createdByError } = await admin
    .from('impostor_games')
    .update({ created_by: null })
    .eq('created_by', userId);

  if (createdByError) {
    return stepError(
      3,
      `No se pudo anonimizar created_by: ${createdByError.message}`,
    );
  }

  const { error: impostorNullError } = await admin
    .from('impostor_games')
    .update({ impostor_user_id: null })
    .eq('impostor_user_id', userId);

  if (impostorNullError) {
    return stepError(
      3,
      `No se pudo anonimizar impostor_user_id: ${impostorNullError.message}`,
    );
  }

  return null;
};

/**
 * PASO 4 — Elimina registros del usuario respetando el orden de foreign keys.
 */
const deleteUserRecords = async (
  admin: SupabaseClient,
  userId: string,
): Promise<Response | null> => {
  const deletions: Array<{ table: string; column: string }> = [
    { table: 'meetup_reviews', column: 'user_id' },
    { table: 'meetup_participants', column: 'user_id' },
    { table: 'meetup_hidden', column: 'user_id' },
    { table: 'notifications', column: 'user_id' },
    { table: 'memories', column: 'uploaded_by' },
  ];

  for (const { table, column } of deletions) {
    const { error } = await admin.from(table).delete().eq(column, userId);

    if (error) {
      return stepError(4, `Error al eliminar en ${table}: ${error.message}`);
    }
  }

  return null;
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return stepError(0, 'No autorizado: falta el header Authorization', 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return stepError(0, 'No autorizado: token inválido o expirado', 401);
    }

    const userId = user.id;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const step1 = await transferOrDeleteOrganizedMeetups(supabaseAdmin, userId);
    if (step1) return step1;

    const step2 = await deleteUserStorageFiles(supabaseAdmin, userId);
    if (step2) return step2;

    const step3 = await anonymizeImpostorGames(supabaseAdmin, userId);
    if (step3) return step3;

    const step4 = await deleteUserRecords(supabaseAdmin, userId);
    if (step4) return step4;

    // PASO 5 — Limpiar push_token antes de borrar el perfil
    const { error: pushError } = await supabaseAdmin
      .from('profiles')
      .update({ push_token: null })
      .eq('id', userId);

    if (pushError) {
      return stepError(5, `No se pudo limpiar push_token: ${pushError.message}`);
    }

    // PASO 6 — Eliminar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      return stepError(6, `No se pudo eliminar el perfil: ${profileError.message}`);
    }

    // PASO 7 — Eliminar usuario de Auth (siempre el último paso)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId,
    );

    if (authDeleteError) {
      return stepError(
        7,
        `No se pudo eliminar el usuario de Auth: ${authDeleteError.message}`,
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error general en delete-account:', mensaje);
    return stepError(0, 'Error interno del servidor');
  }
});

