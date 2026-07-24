/**
 * Servicio de grupos — única capa que interactúa con Supabase para este módulo.
 *
 * Sigue el mismo patrón { data, error } que meetupService.ts para que los
 * callers nunca necesiten capturar excepciones directamente.
 *
 * A diferencia de meetups, la membresía de admin del creador no se inserta
 * manualmente acá: la maneja el trigger trg_assign_group_creator_as_admin
 * (014_groups.sql), y la policy group_members_insert_self solo permite
 * auto-insertarse con role = 'member' (015 / fix de escalamiento de
 * privilegios), así que createGroup no necesita rollback manual como
 * createMeetup.
 */
import { supabase } from '@/lib/supabase/client';
import { notificationService } from '@/features/notifications/services/notificationService';
import { NotificationType } from '@/features/notifications/types';
import type {
  Group,
  GroupWithRole,
  GroupMemberPreview,
  GroupDetail,
  GroupMember,
  CreateGroupFormData,
} from '../types';
import type {
  Meetup,
  MeetupWithRole,
  MeetupStatus,
  ParticipantRole,
  AttendanceStatus,
} from '@/features/meetups/types';

/** Contrato de retorno uniforme de todas las operaciones del servicio */
interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/** Estructura de una fila de la tabla groups tal como la retorna Supabase */
interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  join_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Fila de group_members tal como la retorna Supabase */
interface GroupMemberRow {
  group_id: string;
  role: string;
  left_at: string | null;
}

/** Fila de group_members con el perfil anidado, usada para el preview de avatares */
interface GroupMemberWithProfileRow {
  group_id: string;
  user_id: string;
  profiles: { full_name: string } | null;
}

/** Fila de meetups reducida a lo necesario para contar juntadas activas por grupo */
interface GroupMeetupRow {
  group_id: string | null;
}

/** Fila de group_members con el perfil completo, usada por getGroupMembers */
interface GroupMemberDetailRow {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

/**
 * Fila de meetups tal como la retorna Supabase, usada por getGroupMeetups.
 * No se reusa la interfaz privada MeetupRow de meetupService.ts (no está
 * exportada, y este prompt no la toca más allá de importar tipos).
 */
interface MeetupRowForGroup {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  location: string;
  estimated_cost: number | null;
  status: string;
  join_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cover_url: string | null;
  reviews_enabled: boolean;
}

/** Fila de meetup_participants reducida, usada por getGroupMeetups para rol/conteos */
interface MeetupParticipantRowForGroup {
  meetup_id: string;
  user_id: string;
  role: string;
  attendance_status: string;
}

/**
 * Fila del retorno de expel_group_member (019_group_admin_actions_fixes.sql):
 * una por cada juntada activa del grupo que se canceló automáticamente
 * porque el expulsado era su único participante activo.
 */
interface CancelledMeetupRow {
  cancelled_meetup_id: string;
  cancelled_meetup_title: string;
}

/** Caracteres válidos para generar el código de grupo (mismo charset que meetups) */
const JOIN_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Longitud de la parte aleatoria del código; el prefijo 'G' se antepone */
const JOIN_CODE_RANDOM_LENGTH = 5;

/** Máximo de intentos para generar un código único antes de lanzar error */
const MAX_CODE_ATTEMPTS = 5;

/**
 * Convierte una fila de la base de datos al tipo de dominio Group.
 * Centraliza el mapeo snake_case → camelCase para evitar inconsistencias.
 *
 * @param row - Fila cruda de la tabla groups
 * @returns Objeto Group del dominio de la aplicación
 */
const mapGroupRow = (row: GroupRow): Group => ({
  id: row.id,
  name: row.name,
  description: row.description,
  coverUrl: row.cover_url,
  joinCode: row.join_code,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Extrae las iniciales de un nombre completo (máximo 2 caracteres).
 * Misma lógica que getInitials en MeetupHomeScreen, duplicada acá porque
 * ese helper no está exportado desde el feature de meetups.
 *
 * @param name - Nombre completo del usuario
 * @returns Iniciales en mayúsculas
 */
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Convierte una fila de meetups al tipo de dominio Meetup.
 * Duplica el mapeo equivalente a meetupService.mapMeetupRow (privado a
 * ese archivo, no exportado) — el alcance de este prompt no incluye
 * tocar meetupService.ts más allá de importar tipos.
 *
 * @param row - Fila cruda de la tabla meetups
 * @returns Objeto Meetup del dominio de la aplicación
 */
const mapMeetupRowForGroup = (row: MeetupRowForGroup): Meetup => ({
  id: row.id,
  title: row.title,
  description: row.description,
  date: row.date,
  time: row.time,
  location: row.location,
  estimatedCost: row.estimated_cost,
  status: row.status as MeetupStatus,
  joinCode: row.join_code,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  cancelledAt: row.cancelled_at,
  cover_url: row.cover_url ?? null,
  reviews_enabled: row.reviews_enabled ?? false,
});

/**
 * Genera un código alfanumérico de 6 caracteres (prefijo 'G' + 5 al azar)
 * y verifica que no exista ya en la tabla groups antes de retornarlo.
 * Lanza un error si no logra generar un código único en MAX_CODE_ATTEMPTS intentos.
 *
 * @returns Código único de 6 caracteres listo para usarse
 */
const generateJoinCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const randomPart = Array.from({ length: JOIN_CODE_RANDOM_LENGTH }, () =>
      JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)],
    ).join('');
    const code = `G${randomPart}`;

    const { data, error } = await supabase
      .from('groups')
      .select('id')
      .eq('join_code', code)
      .maybeSingle();

    if (!error && !data) {
      return code;
    }
  }
  throw new Error('No se pudo generar un código único después de varios intentos');
};

/**
 * Trae los user_id de los miembros activos de un grupo, excluyendo a uno.
 *
 * Usa el RPC get_group_member_ids (021_get_group_member_ids.sql, SECURITY
 * DEFINER) en vez de un SELECT directo: la policy group_members_select
 * es un gate de todo o nada sobre si auth.uid() (quien pregunta) sigue
 * siendo miembro activo, no un filtro fila por fila. En notifyGroupMemberLeft
 * eso rompía en silencio — leave_group() ya había dado de baja a quien
 * pregunta antes de este SELECT, así que RLS bloqueaba la lectura completa
 * (0 filas, sin error) y la notificación se enviaba a una lista vacía.
 * Se unifica acá para notifyGroupMemberJoined también, aunque ahí sí
 * funcionaba (quien pregunta todavía es miembro activo) — evita tener
 * dos caminos distintos resolviendo lo mismo y que un futuro cambio de
 * RLS rompa uno de los dos otra vez sin avisar.
 *
 * @param groupId - UUID del grupo
 * @param excludedUserId - UUID a excluir de la lista
 * @returns Lista de user_id de miembros activos, sin incluir al excluido
 */
const getOtherActiveMemberIds = async (
  groupId: string,
  excludedUserId: string,
): Promise<string[]> => {
  const { data, error } = await supabase.rpc('get_group_member_ids', {
    p_group_id: groupId,
    p_excluded_user_id: excludedUserId,
  });

  if (error) {
    // No es el camino esperado: un RPC fallido acá deja la notificación
    // sin destinatarios en vez de fallar ruidosamente. Se loguea para
    // no repetir el patrón de fallos de RPC silenciosos ya visto en
    // este bloque (RLS bloqueando el SELECT directo, y el bug de
    // shadowing de 021) — el [] es un fallback ante error, no el
    // resultado normal.
    console.error('[get_group_member_ids] Error en el RPC:', error);
    return [];
  }

  return ((data ?? []) as { user_id: string }[]).map((row) => row.user_id);
};

/**
 * Notifica a los demás miembros activos del grupo que alguien se unió
 * (fire-and-forget: un fallo acá no afecta el resultado de joinGroupByCode).
 *
 * @param groupId - UUID del grupo
 * @param joinedUserId - UUID de quien se acaba de unir
 */
export const notifyGroupMemberJoined = async (
  groupId: string,
  joinedUserId: string,
): Promise<void> => {
  try {
    const [{ data: profile }, recipientIds] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', joinedUserId).single(),
      getOtherActiveMemberIds(groupId, joinedUserId),
    ]);

    const username = profile?.username ?? 'Alguien';

    await Promise.allSettled(
      recipientIds.map((recipientId) =>
        notificationService.sendNotification({
          recipientUserId: recipientId,
          type: NotificationType.GroupMemberJoined,
          title: 'Nuevo miembro 🎉',
          body: `${username} se unió al grupo`,
          groupId,
        }),
      ),
    );
  } catch {
    // Error en las notificaciones: no afecta el flujo principal
  }
};

/**
 * Notifica a los demás miembros activos del grupo que alguien lo abandonó
 * (fire-and-forget: un fallo acá no afecta el resultado de leaveGroup).
 *
 * @param groupId - UUID del grupo
 * @param leftUserId - UUID de quien acaba de salir
 */
const notifyGroupMemberLeft = async (
  groupId: string,
  leftUserId: string,
): Promise<void> => {
  try {
    const [{ data: profile }, recipientIds] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', leftUserId).single(),
      getOtherActiveMemberIds(groupId, leftUserId),
    ]);

    const username = profile?.username ?? 'Alguien';

    await Promise.allSettled(
      recipientIds.map((recipientId) =>
        notificationService.sendNotification({
          recipientUserId: recipientId,
          type: NotificationType.GroupMemberLeft,
          title: 'Un miembro se fue 👋',
          body: `${username} salió del grupo`,
          groupId,
        }),
      ),
    );
  } catch {
    // Error en las notificaciones: no afecta el flujo principal
  }
};

export const groupService = {
  /**
   * Crea un nuevo grupo. El trigger trg_assign_group_creator_as_admin
   * inserta automáticamente al creador como admin en group_members.
   *
   * @param userId - UUID del usuario autenticado que crea el grupo
   * @param formData - Datos del formulario de creación
   * @returns El grupo creado o un mensaje de error en español
   */
  async createGroup(
    userId: string,
    formData: CreateGroupFormData,
  ): Promise<ServiceResult<Group>> {
    try {
      const joinCode = await generateJoinCode();

      const { data: newGroup, error } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          description: formData.description || null,
          join_code: joinCode,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      if (!newGroup) throw new Error('No se obtuvo el grupo recién creado');

      return { data: mapGroupRow(newGroup as GroupRow), error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return {
        data: null,
        error: message.includes('No se pudo generar')
          ? message
          : 'Ocurrió un error inesperado — intentá de nuevo',
      };
    }
  },

  /**
   * Busca un grupo por su código de ingreso.
   * La policy "groups_select_by_join_code" (015) habilita esta lectura
   * para cualquier usuario autenticado, sea miembro o no.
   *
   * @param joinCode - Código de 6 caracteres en mayúsculas
   * @returns El grupo encontrado, null si no existe, o error
   */
  async findGroupByJoinCode(joinCode: string): Promise<ServiceResult<Group | null>> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('join_code', joinCode)
        .maybeSingle();

      if (error) throw error;
      return { data: data ? mapGroupRow(data as GroupRow) : null, error: null };
    } catch {
      return { data: null, error: 'Grupo no encontrado o código inválido' };
    }
  },

  /**
   * Une a un usuario a un grupo mediante su código de ingreso.
   *
   * Si el usuario ya tuvo una fila en group_members para este grupo
   * (salió antes), rejoin_group() la reactiva vía RPC en vez de insertar
   * una fila nueva — evita duplicados históricos para el mismo usuario+
   * grupo. No puede reactivarse con un UPDATE directo del cliente porque
   * no existe una policy de UPDATE genérica sobre la propia fila (ver
   * 016_rejoin_group.sql). Si rejoin_group() devuelve false (nunca fue
   * miembro), se sigue con el INSERT normal como 'member'.
   *
   * @param joinCode - Código del grupo
   * @returns UUID del grupo y si fue una reactivación, o mensaje de error específico
   */
  async joinGroupByCode(
    joinCode: string,
  ): Promise<ServiceResult<{ groupId: string; isReactivation: boolean }>> {
    try {
      // Única forma de unirse: validación en el servidor via RPC
      const { data, error } = await supabase.rpc('join_group_by_code', {
        p_join_code: joinCode,
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No se pudo procesar la unión al grupo');
      }

      const result = data[0];
      return {
        data: {
          groupId: result.group_id,
          isReactivation: result.is_reactivation,
        },
        error: null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { data: null, error: message || 'Error al unirse al grupo' };
    }
  },

  /**
   * Obtiene todos los grupos donde el usuario tiene membresía activa,
   * con su rol, conteo de miembros, juntadas activas asociadas y un
   * preview de hasta 3 miembros para el stack de avatares.
   *
   * @param userId - UUID del usuario autenticado
   * @returns Lista de grupos con rol del usuario o mensaje de error
   */
  async getMyGroups(userId: string): Promise<ServiceResult<GroupWithRole[]>> {
    try {
      // Paso 1: membresías activas del usuario para conocer su rol
      const { data: myMemberships, error: memError } = await supabase
        .from('group_members')
        .select('group_id, role, left_at')
        .eq('user_id', userId)
        .is('left_at', null);

      if (memError) throw memError;
      if (!myMemberships || myMemberships.length === 0) {
        return { data: [], error: null };
      }

      const groupIds = (myMemberships as GroupMemberRow[]).map((m) => m.group_id);

      // Paso 2: datos de esos grupos, más recientes primero
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;
      if (!groupsData || groupsData.length === 0) {
        return { data: [], error: null };
      }

      // Paso 3: todos los miembros activos de esos grupos, con perfil, para conteo y preview
      const { data: allMembers, error: allMembersError } = await supabase
        .from('group_members')
        .select('group_id, user_id, profiles:user_id (full_name)')
        .in('group_id', groupIds)
        .is('left_at', null);

      if (allMembersError) throw allMembersError;

      // Paso 4: juntadas activas por grupo, para el conteo de "juntadas activas"
      const { data: activeMeetups, error: meetupsError } = await supabase
        .from('meetups')
        .select('group_id')
        .in('group_id', groupIds)
        .eq('status', 'active');

      if (meetupsError) throw meetupsError;

      const safeMembers = (allMembers ?? []) as unknown as GroupMemberWithProfileRow[];
      const safeMeetups = (activeMeetups ?? []) as GroupMeetupRow[];
      const safeMemberships = myMemberships as GroupMemberRow[];

      const result: GroupWithRole[] = (groupsData as GroupRow[]).map((groupRow) => {
        const myMembership = safeMemberships.find((m) => m.group_id === groupRow.id);
        const membersForGroup = safeMembers.filter((m) => m.group_id === groupRow.id);
        const activeMeetupCount = safeMeetups.filter(
          (m) => m.group_id === groupRow.id,
        ).length;

        const memberPreview: GroupMemberPreview[] = membersForGroup
          .slice(0, 3)
          .map((m) => ({
            userId: m.user_id,
            initials: getInitials(m.profiles?.full_name ?? '?'),
          }));

        return {
          ...mapGroupRow(groupRow),
          userRole: (myMembership?.role ?? 'member') as GroupWithRole['userRole'],
          memberCount: membersForGroup.length,
          activeMeetupCount,
          memberPreview,
          memberOverflow: Math.max(membersForGroup.length - memberPreview.length, 0),
        };
      });

      return { data: result, error: null };
    } catch {
      return { data: null, error: 'Error al obtener los grupos' };
    }
  },

  /**
   * Obtiene el detalle de un grupo: datos del grupo, rol del usuario
   * autenticado (vía RPC get_user_group_role, 014_groups.sql) y conteos
   * de miembros activos y juntadas activas asociadas.
   *
   * Verifica la membresía PRIMERO, antes de las otras 3 lecturas. Las
   * policies de `groups`/`group_members`/`meetups` no se comportan igual
   * ante un no-miembro: el SELECT de `groups` con `.single()` sí falla
   * explícitamente (0 filas visibles), pero los `count` de miembros y
   * juntadas activas son SELECTs de múltiples filas — RLS los filtra en
   * silencio y devuelven 0 como resultado "exitoso", indistinguible de un
   * grupo real con 0 miembros. get_user_group_role es SECURITY DEFINER
   * (bypasea RLS) y devuelve NULL de forma confiable si el usuario no
   * tiene una fila activa — por eso se usa acá como el único gate real,
   * y se corta la ejecución antes de disparar las otras 3 queries que
   * no distinguirían "bloqueado por RLS" de "dato real en 0".
   *
   * @param groupId - UUID del grupo
   * @param userId - UUID del usuario autenticado
   * @returns El detalle del grupo; error 'NOT_MEMBER' si ya no es miembro
   *   activo (código distinguible, no mensaje genérico); u otro error
   */
  async getGroupDetail(
    groupId: string,
    userId: string,
  ): Promise<ServiceResult<GroupDetail>> {
    try {
      const { data: role, error: roleError } = await supabase.rpc(
        'get_user_group_role',
        { p_group_id: groupId, p_user_id: userId },
      );

      if (roleError) throw roleError;

      if (!role) {
        return { data: null, error: 'NOT_MEMBER' };
      }

      const { data: groupRow, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      if (!groupRow) {
        return { data: null, error: 'Grupo no encontrado' };
      }

      const { count: memberCount, error: memberCountError } = await supabase
        .from('group_members')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .is('left_at', null);

      if (memberCountError) throw memberCountError;

      const { count: activeMeetupCount, error: meetupCountError } = await supabase
        .from('meetups')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (meetupCountError) throw meetupCountError;

      return {
        data: {
          ...mapGroupRow(groupRow as GroupRow),
          userRole: role as GroupDetail['userRole'],
          memberCount: memberCount ?? 0,
          activeMeetupCount: activeMeetupCount ?? 0,
        },
        error: null,
      };
    } catch {
      return { data: null, error: 'Error al obtener el detalle del grupo' };
    }
  },

  /**
   * Obtiene los miembros activos de un grupo con su perfil público,
   * ordenados por rol (admin primero, ya que 'admin' < 'guest' < 'member'
   * alfabéticamente no garantiza ese orden, así que se ordena en el cliente).
   *
   * @param groupId - UUID del grupo
   * @returns Lista de miembros con perfil o mensaje de error
   */
  async getGroupMembers(groupId: string): Promise<ServiceResult<GroupMember[]>> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(
          `
          id,
          group_id,
          user_id,
          role,
          joined_at,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `,
        )
        .eq('group_id', groupId)
        .is('left_at', null);

      if (error) throw error;

      const rows = (data ?? []) as unknown as GroupMemberDetailRow[];

      // admin primero, después member, después guest
      const ROLE_ORDER: Record<string, number> = { admin: 0, member: 1, guest: 2 };
      const sorted = [...rows].sort(
        (a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3),
      );

      const members: GroupMember[] = sorted.map((row) => ({
        id: row.id,
        groupId: row.group_id,
        userId: row.user_id,
        role: row.role as GroupMember['role'],
        joinedAt: row.joined_at,
        profile: {
          fullName: row.profiles?.full_name ?? '',
          username: row.profiles?.username ?? '',
          avatarUrl: row.profiles?.avatar_url ?? null,
        },
      }));

      return { data: members, error: null };
    } catch {
      return { data: null, error: 'Error al obtener los miembros del grupo' };
    }
  },

  /**
   * Obtiene las juntadas activas asociadas a un grupo, con el rol del
   * usuario autenticado y los conteos de participantes de cada una —
   * mismo criterio de 3 pasos que meetupService.getUserMeetups, pero
   * filtrando por group_id en vez de por las participaciones propias.
   *
   * Solo trae juntadas con status = 'active': la policy "meetups: select
   * by join_code" (002_fix_rls_circular.sql) permite leer cualquier
   * juntada activa a cualquier usuario autenticado, así que no hace
   * falta RLS nueva para este filtro. Las juntadas canceladas o
   * finalizadas de un grupo no son visibles acá para miembros que se
   * unieron después de que ocurrieron — caso reportado y confirmado en
   * el análisis previo, fuera de alcance de este prompt.
   *
   * @param groupId - UUID del grupo
   * @param userId - UUID del usuario autenticado
   * @returns Lista de juntadas del grupo con rol del usuario o error
   */
  async getGroupMeetups(
    groupId: string,
    userId: string,
  ): Promise<ServiceResult<MeetupWithRole[]>> {
    try {
      const { data: meetupsData, error: meetupsError } = await supabase
        .from('meetups')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'active')
        .order('date', { ascending: true });

      if (meetupsError) throw meetupsError;
      if (!meetupsData || meetupsData.length === 0) {
        return { data: [], error: null };
      }

      const meetupIds = (meetupsData as MeetupRowForGroup[]).map((m) => m.id);

      const { data: allParticipants, error: participantsError } = await supabase
        .from('meetup_participants')
        .select('meetup_id, user_id, role, attendance_status')
        .in('meetup_id', meetupIds);

      if (participantsError) throw participantsError;

      const safeParticipants = (allParticipants ?? []) as MeetupParticipantRowForGroup[];

      const result: MeetupWithRole[] = (meetupsData as MeetupRowForGroup[]).map(
        (meetupRow) => {
          const participantsForMeetup = safeParticipants.filter(
            (p) => p.meetup_id === meetupRow.id,
          );
          const myParticipation = participantsForMeetup.find(
            (p) => p.user_id === userId,
          );

          return {
            ...mapMeetupRowForGroup(meetupRow),
            userRole: (myParticipation?.role ?? 'participant') as ParticipantRole,
            attendanceStatus: (myParticipation?.attendance_status ??
              'pending') as AttendanceStatus,
            participantCount: participantsForMeetup.length,
            confirmedCount: participantsForMeetup.filter(
              (p) => p.attendance_status === 'confirmed',
            ).length,
            leftAt: null,
          };
        },
      );

      return { data: result, error: null };
    } catch {
      return { data: null, error: 'Error al obtener las juntadas del grupo' };
    }
  },

  /**
   * Elimina un grupo por completo. La policy "groups_delete" (014_groups.sql)
   * ya restringe esta operación a admins — no se valida el rol acá de nuevo.
   *
   * @param groupId - UUID del grupo a eliminar
   * @returns null en data si fue exitoso; mensaje de error en caso contrario
   */
  async deleteGroup(groupId: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase.from('groups').delete().eq('id', groupId);
      if (error) throw error;
      return { data: null, error: null };
    } catch {
      return { data: null, error: 'No se pudo eliminar el grupo' };
    }
  },

  /**
   * Wrapper del RPC leave_group (014_groups.sql, cambia de firma en
   * 023_leave_group_meetup_cleanup.sql). Si el usuario es admin, la
   * función lanza una excepción específica que se debe mostrar tal cual
   * al usuario: es un comportamiento esperado (el admin debe transferir su
   * rol primero — función que llega en 4.5), no un error genérico a ocultar.
   *
   * Desde 023, si quien sale organizaba alguna juntada activa del grupo y
   * era su único participante activo, la función SQL la cancela
   * automáticamente y la retorna en el resultado — misma lógica que ya
   * tenía expel_group_member (019) para el caso de expulsión, ahora
   * replicada acá para no dejar asimétrica la salida voluntaria.
   *
   * @param groupId - UUID del grupo del que se quiere salir
   * @returns las juntadas canceladas automáticamente, o mensaje de error
   */
  async leaveGroup(
    groupId: string,
  ): Promise<ServiceResult<{ cancelledMeetups: { id: string; title: string }[] }>> {
    try {
      const { data, error } = await supabase.rpc('leave_group', { p_group_id: groupId });
      if (error) throw error;

      const cancelledMeetups = ((data ?? []) as CancelledMeetupRow[]).map((row) => ({
        id: row.cancelled_meetup_id,
        title: row.cancelled_meetup_title,
      }));

      // Notificar al resto de los miembros activos del grupo (fire-and-forget).
      // leave_group() usa auth.uid() del lado del servidor y no recibe el
      // userId como parámetro; se obtiene acá vía supabase.auth.getUser()
      // para no cambiar la firma de la función ni sus callers.
      void (async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            await notifyGroupMemberLeft(groupId, user.id);
          }
        } catch {
          // Error en la notificación: no afecta el resultado de la salida
        }
      })();

      // Notificar a los participantes restantes de cada juntada cancelada
      // automáticamente — mismo patrón fire-and-forget que expelMember:
      // la salida ya ocurrió del lado del servidor, un fallo acá no la afecta.
      if (cancelledMeetups.length > 0) {
        void (async () => {
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            for (const meetup of cancelledMeetups) {
              const { data: participants } = await supabase.rpc(
                'get_meetup_participant_ids',
                { p_meetup_id: meetup.id, p_excluded_user_id: user.id },
              );
              const recipients = (participants ?? []) as { user_id: string }[];

              await Promise.allSettled(
                recipients.map((p) =>
                  notificationService.sendNotification({
                    recipientUserId: p.user_id,
                    type: NotificationType.Cancelled,
                    title: 'Juntada cancelada 😔',
                    body: `${meetup.title} fue cancelada`,
                    meetupId: meetup.id,
                  }),
                ),
              );
            }
          } catch {
            // Error en las notificaciones: no afecta el resultado de la salida
          }
        })();
      }

      return { data: { cancelledMeetups }, error: null };
    } catch (err) {
      // No usar `instanceof Error`: el PostgrestError que lanza el RPC no
      // siempre pasa ese chequeo en Hermes/React Native, pese a tener la
      // propiedad `message` con el texto correcto. Acceso directo (duck
      // typing) en su lugar.
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : '';

      return {
        data: null,
        error: message.includes('debe transferir su rol')
          ? message
          : 'No se pudo salir del grupo',
      };
    }
  },

  /**
   * Wrapper del RPC expel_group_member (018_group_admin_actions.sql,
   * fixes en 019_group_admin_actions_fixes.sql). Solo el admin puede
   * ejecutarla; el mensaje del RPC (si es un caso conocido) se muestra
   * tal cual, igual que en leaveGroup.
   *
   * Si el expulsado organizaba alguna juntada activa del grupo y era su
   * único participante activo, la función SQL la cancela automáticamente
   * y la retorna en el resultado. Una función SQL no puede invocar la
   * Edge Function send-push-notification directamente, así que acá se
   * dispara la notificación de cancelación a los participantes restantes
   * de cada una — mismo patrón fire-and-forget que meetupService.cancelMeetup.
   *
   * @param groupId - UUID del grupo
   * @param targetUserId - UUID del miembro a expulsar
   * @param actingUserId - UUID del admin que ejecuta la expulsión (se excluye de las notificaciones)
   * @returns las juntadas canceladas automáticamente, o mensaje de error
   */
  async expelMember(
    groupId: string,
    targetUserId: string,
    actingUserId: string,
  ): Promise<ServiceResult<{ cancelledMeetups: { id: string; title: string }[] }>> {
    try {
      const { data, error } = await supabase.rpc('expel_group_member', {
        p_group_id: groupId,
        p_target_user_id: targetUserId,
      });
      if (error) throw error;

      // Notificar solo al expulsado (fire-and-forget)
      void (async () => {
        try {
          await notificationService.sendNotification({
            recipientUserId: targetUserId,
            type: NotificationType.GroupMemberExpelled,
            title: 'Fuiste removido de un grupo',
            body: 'Un administrador te expulsó del grupo',
            groupId,
          });
        } catch {
          // Error en la notificación: no afecta el resultado de la expulsión
        }
      })();

      const cancelledMeetups = ((data ?? []) as CancelledMeetupRow[]).map((row) => ({
        id: row.cancelled_meetup_id,
        title: row.cancelled_meetup_title,
      }));

      // Notificar a los participantes restantes de cada juntada cancelada
      // automáticamente (fire-and-forget: un fallo acá no afecta el
      // resultado de la expulsión, que ya ocurrió del lado del servidor).
      if (cancelledMeetups.length > 0) {
        void (async () => {
          try {
            for (const meetup of cancelledMeetups) {
              const { data: participants } = await supabase.rpc(
                'get_meetup_participant_ids',
                { p_meetup_id: meetup.id, p_excluded_user_id: actingUserId },
              );
              const recipients = (participants ?? []) as { user_id: string }[];

              await Promise.allSettled(
                recipients.map((p) =>
                  notificationService.sendNotification({
                    recipientUserId: p.user_id,
                    type: NotificationType.Cancelled,
                    title: 'Juntada cancelada 😔',
                    body: `${meetup.title} fue cancelada`,
                    meetupId: meetup.id,
                  }),
                ),
              );
            }
          } catch {
            // Error en las notificaciones: no afecta el resultado de la expulsión
          }
        })();
      }

      return { data: { cancelledMeetups }, error: null };
    } catch (err) {
      // Mismo motivo que leaveGroup: no usar `instanceof Error` con
      // PostgrestError en Hermes/React Native.
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : '';

      return {
        data: null,
        error: message || 'No se pudo expulsar al miembro',
      };
    }
  },

  /**
   * Wrapper del RPC transfer_group_admin (018_group_admin_actions.sql).
   * Atómico: degrada al admin actual y promueve al destinatario dentro
   * de la misma función SECURITY DEFINER — a diferencia de
   * meetupService.transferOrganizer (3 UPDATEs secuenciales desde el
   * cliente, sin transacción real), acá no hay riesgo de estado parcial.
   *
   * @param groupId - UUID del grupo
   * @param newAdminUserId - UUID del miembro que pasará a ser admin
   * @returns null en data si fue exitoso; mensaje de error en caso contrario
   */
  async transferAdmin(
    groupId: string,
    newAdminUserId: string,
  ): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase.rpc('transfer_group_admin', {
        p_group_id: groupId,
        p_new_admin_user_id: newAdminUserId,
      });
      if (error) throw error;

      // Notificar solo al nuevo admin (fire-and-forget)
      void (async () => {
        try {
          await notificationService.sendNotification({
            recipientUserId: newAdminUserId,
            type: NotificationType.GroupAdminTransferred,
            title: 'Ahora sos admin de un grupo 👑',
            body: 'Te transfirieron la administración del grupo',
            groupId,
          });
        } catch {
          // Error en la notificación: no afecta el resultado de la transferencia
        }
      })();

      return { data: null, error: null };
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : '';

      return {
        data: null,
        error: message || 'No se pudo transferir la administración',
      };
    }
  },
};
