/**
 * Utilidades de fecha/hora para juntadas.
 *
 * Supabase entrega date como YYYY-MM-DD y time como HH:MM o HH:MM:SS.
 * Se combinan en ISO local para comparar con el momento actual del dispositivo.
 */

/**
 * Indica si la fecha y hora de inicio de la juntada ya ocurrieron.
 *
 * @param date - Fecha en formato YYYY-MM-DD (o DD/MM/YYYY desde formularios)
 * @param time - Hora en formato HH:MM o HH:MM:SS
 * @returns true si el instante de inicio ya pasó o es ahora
 */
export const isPastMeetup = (date: string, time: string): boolean => {
  const normalizedDate = date.includes('/')
    ? (() => {
        const [day, month, year] = date.split('/').map(Number);
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      })()
    : date;

  const meetupDateTime = new Date(`${normalizedDate}T${time}`);
  return new Date() >= meetupDateTime;
};
