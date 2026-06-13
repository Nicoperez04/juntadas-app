/**
 * Edge Function: send-push-notification
 *
 * Responsabilidad dual: persiste la notificación in-app en Supabase y,
 * si el destinatario tiene token registrado, envía la push via Expo Push API.
 *
 * La separación de responsabilidades es intencional: si la push falla
 * (dispositivo sin conexión, token vencido, etc.) la notificación in-app
 * ya fue insertada, por lo que el usuario la verá al abrir la app.
 *
 * Seguridad:
 *   - Requiere el header Authorization con el JWT del usuario autenticado.
 *   - Usa service_role_key para insertar en notifications (RLS bloqueada para
 *     INSERT con usuario autenticado) y leer push_token de profiles.
 *   - El cliente nunca puede insertar notificaciones directamente.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ----------------------------------------------------------------
// Tipos del request y constantes
// ----------------------------------------------------------------

/** Tipos de notificación alineados con el enum de la base de datos */
type NotificationType =
  | 'joined'
  | 'transferred'
  | 'review_enabled'
  | 'reminder';

/** Cuerpo esperado del POST */
interface NotificationRequestBody {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  body: string;
  meetupId?: string;
}

/** Cabeceras CORS para permitir llamadas desde la app móvil */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** URL de la Expo Push API */
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

// ----------------------------------------------------------------
// Handler principal
// ----------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // Responde al preflight CORS enviado por los navegadores y la app antes del POST real
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // ----------------------------------------------------------------
    // 1. Verificar autenticación: el JWT debe estar presente en el header
    // ----------------------------------------------------------------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: falta el header Authorization' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ----------------------------------------------------------------
    // 2. Validar el JWT con el cliente de usuario (sin service role)
    //    para confirmar que el llamador está autenticado en Supabase.
    // ----------------------------------------------------------------
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: token inválido o expirado' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ----------------------------------------------------------------
    // 3. Parsear y validar el cuerpo del request
    // ----------------------------------------------------------------
    let body: NotificationRequestBody;
    try {
      body = await req.json() as NotificationRequestBody;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Cuerpo del request inválido: se espera JSON' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const { recipientUserId, type, title, body: notifBody, meetupId } = body;

    // Campos obligatorios
    if (!recipientUserId || !type || !title || !notifBody) {
      return new Response(
        JSON.stringify({
          error: 'Faltan campos requeridos: recipientUserId, type, title, body',
        }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Validar que el tipo sea uno de los permitidos
    const tiposValidos: NotificationType[] = [
      'joined',
      'transferred',
      'review_enabled',
      'reminder',
    ];
    if (!tiposValidos.includes(type)) {
      return new Response(
        JSON.stringify({ error: `Tipo de notificación inválido: ${type}` }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ----------------------------------------------------------------
    // 4. Crear cliente con service_role para operaciones privilegiadas
    //    (INSERT en notifications, SELECT push_token de profiles)
    // ----------------------------------------------------------------
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // ----------------------------------------------------------------
    // 5. Insertar la notificación in-app (siempre, independientemente de push)
    // ----------------------------------------------------------------
    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: recipientUserId,
        type,
        title,
        body: notifBody,
        meetup_id: meetupId ?? null,
        read: false,
      });

    if (insertError) {
      console.error('Error al insertar notificación:', insertError.message);
      return new Response(
        JSON.stringify({ error: 'No se pudo guardar la notificación' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ----------------------------------------------------------------
    // 6. Leer el push_token del destinatario
    // ----------------------------------------------------------------
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('push_token')
      .eq('id', recipientUserId)
      .single();

    if (profileError) {
      // Si no se puede leer el perfil, la notificación in-app ya fue insertada;
      // retornamos éxito parcial para no bloquear al llamador.
      console.error('Error al leer push_token:', profileError.message);
      return new Response(
        JSON.stringify({ success: true, push: false }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const pushToken: string | null = profileData?.push_token ?? null;

    // ----------------------------------------------------------------
    // 7. Enviar push notification si el destinatario tiene token
    // ----------------------------------------------------------------
    if (pushToken) {
      try {
        const pushResponse = await fetch(EXPO_PUSH_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: pushToken,
            title,
            body: notifBody,
            sound: 'default',
            data: {
              type,
              meetupId: meetupId ?? null,
            },
          }),
        });

        if (!pushResponse.ok) {
          // Error en la push: se loguea pero no se falla — la notificación in-app ya existe
          const errorText = await pushResponse.text();
          console.error('Error en Expo Push API:', pushResponse.status, errorText);
        }
      } catch (pushError) {
        // Error de red u otro error inesperado al llamar a Expo: no afecta el resultado
        console.error('Excepción al enviar push:', pushError);
      }
    }

    // ----------------------------------------------------------------
    // 8. Respuesta exitosa
    // ----------------------------------------------------------------
    return new Response(
      JSON.stringify({ success: true, push: !!pushToken }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    // Error inesperado no capturado en los bloques anteriores
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error general en la Edge Function:', mensaje);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
