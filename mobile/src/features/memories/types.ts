/**
 * Tipos del módulo de recuerdos (galería de fotos por juntada).
 *
 * Desacoplan la UI del esquema snake_case de Supabase y centralizan
 * los contratos entre servicio, hooks y pantallas.
 */

/** Foto compartida en una juntada con datos del perfil de quien la subió */
export interface Memory {
  id: string;
  meetupId: string;
  uploadedBy: string;
  fileUrl: string;
  filePath: string;
  mediaType: 'photo';
  createdAt: string;
  /** Nombre completo del usuario que subió la foto */
  uploaderName: string;
  uploaderUsername: string;
  /** URL pública del avatar; null si no tiene foto de perfil */
  uploaderAvatarUrl: string | null;
}

/** Payload mínimo para subir una foto a Storage y registrarla en la tabla */
export interface UploadMemoryData {
  meetupId: string;
  imageUri: string;
  userId: string;
}
