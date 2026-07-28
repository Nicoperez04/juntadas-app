/**
 * LocationCard — RF-40: Visualización de la ubicación exacta de la juntada.
 *
 * Muestra un mapa interactivo (react-native-maps) con un Marker centrado en
 * las coordenadas GPS de la juntada. Gestiona tres estados:
 *   - Carga: esqueleto animado con shimmer (expo-linear-gradient)
 *   - Vacío: icono + texto cuando no hay coordenadas definidas
 *   - Datos: MapView + Marker + botón "Cómo llegar"
 *
 * Los estilos usan exclusivamente tokens del design system (theme.ts).
 * No usa `any` de TypeScript en ningún punto.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';

/** Alto fijo del mapa dentro de la card */
const MAPA_HEIGHT = 170;

/** Delta de zoom por defecto — cubre aprox. 1 km alrededor del punto */
const DELTA_ZOOM = 0.008;

/** Props del componente */
interface LocationCardProps {
  /** Texto legible de la dirección (ej: "Av. Corrientes 1234, Piso 3") */
  locationText: string;
  /** Latitud GPS; null/undefined si el organizador aún no definió ubicación */
  latitude?: number | null;
  /** Longitud GPS; null/undefined si el organizador aún no definió ubicación */
  longitude?: number | null;
}

/**
 * Abre la app nativa de mapas con las coordenadas o la dirección de texto.
 * En Android usa Google Maps; en iOS usa Apple Maps como fallback.
 */
const abrirNavegacion = (
  lat: number,
  lng: number,
  label: string,
): void => {
  const scheme = Platform.select({
    ios: `maps://0,0?q=${label}@${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`,
  });
  if (scheme) {
    void Linking.openURL(scheme);
  }
};

/**
 * Esqueleto de carga animado con shimmer.
 * Reutiliza el mismo patrón de MeetupCardSkeleton del proyecto.
 */
const LocationCardSkeleton = () => (
  <View style={styles.card}>
    {/* Cabecera del skeleton */}
    <View style={styles.skeletonRow}>
      <View style={styles.skeletonIconBox} />
      <View style={styles.skeletonLabel} />
    </View>
    {/* Bloque del mapa shimmer */}
    <LinearGradient
      colors={[theme.colors.border, theme.colors.background, theme.colors.border]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.skeletonMapa}
    />
    {/* Líneas de dirección */}
    <View style={styles.skeletonLineWide} />
    <View style={styles.skeletonLineNarrow} />
  </View>
);

/**
 * Estado vacío: se muestra cuando latitude/longitude son null o undefined.
 * El diseño sigue el mismo empty state de la pantalla de creación del mockup.
 */
const LocationCardEmpty = ({ locationText }: { locationText: string }) => (
  <View style={styles.card}>
    {/* Encabezado de sección */}
    <View style={styles.encabezado}>
      <View style={styles.iconoBox}>
        <Ionicons name="location" size={18} color={theme.colors.secondary} />
      </View>
      <Text style={styles.encabezadoLabel}>Ubicación</Text>
    </View>

    {/* Cuerpo del estado vacío */}
    <View style={styles.vacioCuerpo}>
      <View style={styles.vacioIconoCirculo}>
        <Ionicons name="map-outline" size={28} color={theme.colors.textDisabled} />
      </View>
      <Text style={styles.vacioTitulo}>Aún no hay una ubicación definida</Text>
      {locationText ? (
        <Text style={styles.vacioSubtitulo} numberOfLines={2}>
          {locationText}
        </Text>
      ) : (
        <Text style={styles.vacioSubtitulo}>
          El organizador todavía no indicó dónde se llevará a cabo la juntada.
        </Text>
      )}
    </View>
  </View>
);

/**
 * Componente principal: muestra el mapa si hay coordenadas, skeleton durante
 * la carga del tile, y el estado vacío si no hay datos de GPS.
 */
export const LocationCard = ({
  locationText,
  latitude,
  longitude,
}: LocationCardProps) => {
  /** true mientras el MapView aún está cargando los tiles del mapa */
  const [cargandoMapa, setCargandoMapa] = useState(true);

  /**
   * Timeout defensivo: si onMapReady no dispara en 8 s (tiles sin cargar,
   * red lenta o fallo silencioso del SDK), se quita el shimmer igual para
   * no bloquear la UI con el skeleton superpuesto indefinidamente.
   */
  useEffect(() => {
    const timer = setTimeout(() => setCargandoMapa(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  /* Sin coordenadas — mostrar empty state */
  if (latitude == null || longitude == null) {
    return <LocationCardEmpty locationText={locationText} />;
  }

  const region = {
    latitude,
    longitude,
    latitudeDelta: DELTA_ZOOM,
    longitudeDelta: DELTA_ZOOM,
  };

  return (
    <View style={styles.card}>
      {/* Encabezado de sección */}
      <View style={styles.encabezado}>
        <View style={styles.iconoBox}>
          <Ionicons name="location" size={18} color={theme.colors.secondary} />
        </View>
        <Text style={styles.encabezadoLabel}>Ubicación</Text>
      </View>

      {/* Contenedor del mapa con shimmer de carga superpuesto */}
      <View style={styles.mapaContenedor}>
        {cargandoMapa && (
          /* Shimmer superpuesto mientras se cargan los tiles */
          <LinearGradient
            colors={[theme.colors.border, theme.colors.background, theme.colors.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <MapView
          style={styles.mapa}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          onMapReady={() => setCargandoMapa(false)}
          accessibilityLabel="Mapa de ubicación de la juntada"
        >
          <Marker
            coordinate={{ latitude, longitude }}
            title={locationText}
            pinColor={theme.colors.primary}
          />
        </MapView>
      </View>

      {/* Pie de la card: dirección + botón de navegación */}
      <View style={styles.pie}>
        <View style={styles.pieTexto}>
          <Text style={styles.pieDir} numberOfLines={1}>
            {locationText}
          </Text>
          <Text style={styles.pieSubDir} numberOfLines={1}>
            Toca "Cómo llegar" para abrir en mapas
          </Text>
        </View>

        {/* Botón "Cómo llegar" — abre la app nativa de mapas */}
        <TouchableOpacity
          style={styles.botonNavegar}
          onPress={() => abrirNavegacion(latitude, longitude, locationText)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cómo llegar a la juntada"
        >
          <Ionicons name="navigate" size={16} color={theme.colors.surface} />
          <Text style={styles.botonNavegarTexto}>Cómo llegar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ── Card contenedora ─────────────────────────────────────────────── */
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.md,
  },

  /* ── Encabezado de sección ────────────────────────────────────────── */
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  iconoBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  encabezadoLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* ── Mapa ─────────────────────────────────────────────────────────── */
  mapaContenedor: {
    height: MAPA_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  mapa: {
    flex: 1,
  },

  /* ── Pie de la card ───────────────────────────────────────────────── */
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  pieTexto: {
    flex: 1,
  },
  pieDir: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  pieSubDir: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  botonNavegar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  botonNavegarTexto: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },

  /* ── Estado vacío ─────────────────────────────────────────────────── */
  vacioCuerpo: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  vacioIconoCirculo: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacioTitulo: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  vacioSubtitulo: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* ── Skeleton / shimmer ───────────────────────────────────────────── */
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  skeletonIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.border,
  },
  skeletonLabel: {
    width: 80,
    height: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.border,
  },
  skeletonMapa: {
    height: MAPA_HEIGHT,
    width: '100%',
  },
  skeletonLineWide: {
    height: 14,
    width: '60%',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.border,
    margin: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  skeletonLineNarrow: {
    height: 12,
    width: '40%',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
});

// Exportación nombrada ya realizada — no se agrega default para respetar
// el patrón de exportaciones del resto de componentes del módulo meetups.
