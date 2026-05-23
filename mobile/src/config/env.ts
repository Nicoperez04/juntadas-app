export const env = {
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    },
  } as const;

//Este archivo es basicamente para manejar las variables de entorno de la app, en este caso, la url de Supabase y la clave anonima de Supabase.