/**
 * Tipos del módulo de grupos.
 *
 * Define las entidades y roles que circulan entre pantallas, el hook de
 * grupos y el servicio de Supabase. Se mantienen separados de los tipos
 * nativos de Supabase para desacoplar la UI del SDK, siguiendo el mismo
 * criterio que src/features/meetups/types.ts.
 */

/** Rol del usuario dentro de un grupo específico */
export type GroupRole = 'admin' | 'member' | 'guest';

/** Entidad principal que representa un grupo */
export interface Group {
  id: string;
  name: string;
  /** Descripción opcional del grupo */
  description: string | null;
  /** URL pública de la portada; null si el grupo no tiene portada */
  coverUrl: string | null;
  /** Código único de 6 caracteres alfanuméricos para unirse al grupo */
  joinCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Miembro de un grupo, usado para armar el preview de avatares en las cards */
export interface GroupMemberPreview {
  userId: string;
  /** Iniciales derivadas de full_name, listas para mostrar en el avatar */
  initials: string;
}

/**
 * Grupo enriquecido con datos agregados para la lista "Mis grupos":
 * rol del usuario autenticado, conteos y preview de miembros.
 */
export interface GroupWithRole extends Group {
  /** Rol del usuario autenticado dentro de este grupo */
  userRole: GroupRole;
  /** Cantidad de miembros activos (left_at IS NULL) */
  memberCount: number;
  /** Cantidad de juntadas activas asociadas a este grupo */
  activeMeetupCount: number;
  /** Hasta 3 miembros para el stack de avatares de la card */
  memberPreview: GroupMemberPreview[];
  /** Miembros que exceden el preview (memberCount - memberPreview.length) */
  memberOverflow: number;
}

/**
 * Grupo enriquecido con los datos que necesita la pantalla de detalle:
 * rol del usuario y conteos, sin el preview de avatares (eso es solo
 * para las cards de la lista).
 */
export interface GroupDetail extends Group {
  userRole: GroupRole;
  memberCount: number;
  activeMeetupCount: number;
}

/** Miembro de un grupo con su perfil, para GroupMembersScreen */
export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  profile: {
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
}

/**
 * Datos del formulario de creación de grupo.
 * Inferido desde createGroupSchema para que Zod sea la única fuente de verdad.
 */
export type { CreateGroupSchema as CreateGroupFormData } from './schemas/groupSchemas';

/** Datos del formulario para unirse a un grupo por código */
export interface JoinGroupFormData {
  joinCode: string;
}
