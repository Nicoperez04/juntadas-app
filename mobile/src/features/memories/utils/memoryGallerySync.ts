/**
 * Sincronización entre MemoryViewerScreen y MemoriesGalleryScreen.
 *
 * React Navigation no permite funciones en route.params (warning de valores
 * no serializables). Este registro efímero conecta ambas pantallas mientras
 * la galería está montada, sin persistir callbacks en el navigation state.
 */

type MemoryDeletedHandler = (memoryId: string) => void;

/** Handler activo registrado por la galería montada */
let activeHandler: MemoryDeletedHandler | null = null;

/**
 * Registra el callback de la galería y lo limpia al desmontar.
 *
 * @param handler - Función que actualiza el grid al eliminar desde el viewer
 * @returns Función de cleanup para el useEffect de la galería
 */
export const registerMemoryDeletedHandler = (
  handler: MemoryDeletedHandler,
): (() => void) => {
  activeHandler = handler;
  return () => {
    if (activeHandler === handler) {
      activeHandler = null;
    }
  };
};

/**
 * Notifica a la galería que una foto fue eliminada en el viewer.
 *
 * @param memoryId - UUID de la memoria eliminada
 */
export const notifyMemoryDeleted = (memoryId: string): void => {
  activeHandler?.(memoryId);
};
