/**
 * LocationPicker — Selector de ubicación GPS integrado con React Hook Form.
 *
 * Muestra un botón que, al presionarse, abre un Modal con un MapView a pantalla
 * completa. El usuario mueve el mapa o arrastra el Marker para elegir la
 * coordenada exacta. Al confirmar se persiste la latitud y longitud en el
 * estado del formulario a través de las props onChange de RHF.
 *
 * Estados del componente:
 *   - Sin coordenadas seleccionadas: botón "Agregar ubicación en mapa"
 *   - Con coordenadas: minipreview del mapa + botón "Cambiar" + botón "Quitar"
 *   - Modal abierto: MapView full-screen + Marker arrastrable + confirmar/cancelar
 *
 * Prerequisitos de ejecución:
 *   - Build nativo con EAS (react-native-maps requiere SDK nativo compilado)
 *   - Migración 029 ejecutada en Supabase (columnas latitude y longitude en meetups)
 *   - Variable de entorno EXPO_PUBLIC_GOOGLE_MAPS_API_KEY configurada en EAS
 *
 * Este componente NO reemplaza el campo de texto de dirección; los dos conviven.
 * El texto libre (location) sigue siendo requerido por Zod; las coordenadas son
 * opcionales y enriquecen el campo de ubicación con precisión GPS.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';

/** Coordenadas geográficas */
interface Coordenadas {
  latitude: number;
  longitude: number;
}

/** Delta de zoom para la región inicial — aprox. 1 km de radio */
const DELTA_ZOOM = 0.01;

/** Coordenadas del centro de Buenos Aires como posición por defecto */
const POSICION_DEFAULT: Coordenadas = {
  latitude: -34.6037,
  longitude: -58.3816,
};

const { height: ALTO_PANTALLA } = Dimensions.get('window');

/** Props del componente */
interface LocationPickerProps {
  /** Latitud actualmente guardada en el formulario; null si no hay ninguna */
  latitudActual: number | null | undefined;
  /** Longitud actualmente guardada en el formulario; null si no hay ninguna */
  longitudActual: number | null | undefined;
  /** Texto descriptivo de la dirección (campo location de RHF) */
  locationText: string;
  /** Callback al confirmar: actualiza latitude en React Hook Form */
  onChangeLatitude: (valor: number | null) => void;
  /** Callback al confirmar: actualiza longitude en React Hook Form */
  onChangeLongitude: (valor: number | null) => void;
}

/**
 * Miniatura estática del mapa para mostrar en el preview cuando ya hay
 * coordenadas seleccionadas. scrollEnabled=false evita conflictos de gestos
 * con el ScrollView padre.
 */
const MiniMapa = ({ lat, lng }: { lat: number; lng: number }) => (
  <MapView
    style={styles.miniMapa}
    provider={PROVIDER_GOOGLE}
    initialRegion={{
      latitude: lat,
      longitude: lng,
      latitudeDelta: DELTA_ZOOM,
      longitudeDelta: DELTA_ZOOM,
    }}
    scrollEnabled={false}
    zoomEnabled={false}
    rotateEnabled={false}
    pitchEnabled={false}
    pointerEvents="none"
  >
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      pinColor={theme.colors.primary}
    />
  </MapView>
);

export const LocationPicker = ({
  latitudActual,
  longitudActual,
  locationText,
  onChangeLatitude,
  onChangeLongitude,
}: LocationPickerProps) => {
  /** Controla la visibilidad del Modal con el mapa interactivo */
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * Controla si el MapView ya puede montarse.
   * Solo se vuelve true en el callback onShow del Modal, momento en que
   * la ventana nativa de Android está completamente inicializada y lista
   * para recibir una surface de mapa. Montarlo antes causa un crash nativo.
   */
  const [mapaListo, setMapaListo] = useState(false);

  /**
   * Coordenadas temporales dentro del modal — no se confirman hasta que el
   * usuario presiona "Confirmar ubicación". Si cancela, el estado del form
   * no cambia.
   */
  const [coordenadasTemp, setCoordenadasTemp] = useState<Coordenadas>(
    latitudActual != null && longitudActual != null
      ? { latitude: latitudActual, longitude: longitudActual }
      : POSICION_DEFAULT,
  );

  /** Ref al MapView para poder animar la cámara programáticamente */
  const mapRef = useRef<MapView>(null);

  /** ¿Ya hay coordenadas guardadas en el formulario? */
  const tieneCoord = latitudActual != null && longitudActual != null;

  /**
   * Abre el modal e inicializa las coordenadas temporales con lo que
   * ya está en el formulario (o Buenos Aires si no hay nada).
   */
  const abrirModal = () => {
    setCoordenadasTemp(
      latitudActual != null && longitudActual != null
        ? { latitude: latitudActual, longitude: longitudActual }
        : POSICION_DEFAULT,
    );
    setModalVisible(true);
  };

  /**
   * Persiste las coordenadas temporales en React Hook Form y cierra el modal.
   * Desmonta el MapView antes de ocultar el modal para liberar la surface.
   */
  const confirmar = () => {
    onChangeLatitude(coordenadasTemp.latitude);
    onChangeLongitude(coordenadasTemp.longitude);
    setMapaListo(false);
    setModalVisible(false);
  };

  /**
   * Cancela la selección y cierra el modal sin modificar el estado del form.
   * Desmonta el MapView antes de ocultar el modal para liberar la surface.
   */
  const cancelar = () => {
    setMapaListo(false);
    setModalVisible(false);
  };

  /**
   * Quita las coordenadas del formulario.
   * El campo location (texto libre) se mantiene intacto.
   */
  const quitar = () => {
    onChangeLatitude(null);
    onChangeLongitude(null);
  };

  /**
   * Se invoca cuando el usuario arrastra el Marker a una nueva posición.
   * Actualiza las coordenadas temporales en tiempo real.
   */
  const handleMarkerDrag = (nuevaCoord: Coordenadas) => {
    setCoordenadasTemp(nuevaCoord);
  };

  /**
   * Se invoca cuando el usuario mueve el mapa y termina de hacerlo.
   * Mueve el Marker al nuevo centro del mapa para mayor usabilidad.
   */
  const handleRegionChangeComplete = (region: Region) => {
    setCoordenadasTemp({
      latitude: region.latitude,
      longitude: region.longitude,
    });
  };

  return (
    <View style={styles.wrapper}>
      {/* Etiqueta del campo */}
      <Text style={styles.label}>Ubicación en el mapa (opcional)</Text>

      {tieneCoord && latitudActual != null && longitudActual != null ? (
        /* ── Estado con coordenadas: minipreview + acciones ── */
        <View style={styles.previewContenedor}>
          {/* Miniatura estática del mapa seleccionado */}
          <MiniMapa lat={latitudActual} lng={longitudActual} />

          {/* Coordenadas y texto de la dirección */}
          <View style={styles.previewInfo}>
            <View style={styles.previewFila}>
              <Ionicons name="location" size={14} color={theme.colors.primary} />
              <Text style={styles.previewTexto} numberOfLines={1}>
                {locationText || 'Ubicación seleccionada'}
              </Text>
            </View>
            <Text style={styles.previewCoordenadas}>
              {latitudActual.toFixed(5)}, {longitudActual.toFixed(5)}
            </Text>
          </View>

          {/* Botones Cambiar / Quitar */}
          <View style={styles.previewAcciones}>
            <TouchableOpacity
              style={styles.botonCambiar}
              onPress={abrirModal}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cambiar ubicación en el mapa"
            >
              <Ionicons name="map-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.botonCambiarTexto}>Cambiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonQuitar}
              onPress={quitar}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Quitar ubicación del mapa"
            >
              <Ionicons name="close-circle-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.botonQuitarTexto}>Quitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ── Estado vacío: botón para abrir el picker ── */
        <TouchableOpacity
          style={styles.botonAgregar}
          onPress={abrirModal}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Agregar ubicación en mapa"
        >
          <View style={styles.botonAgregarIcono}>
            <Ionicons name="map-outline" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.botonAgregarTextos}>
            <Text style={styles.botonAgregarLabel}>+ Agregar ubicación</Text>
            <Text style={styles.botonAgregarHint}>
              Seleccioná el punto exacto en el mapa
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* ── Modal con MapView interactivo ────────────────────────────────── */}
      {/*
       * Sin animationType ni statusBarTranslucent: ambas propiedades pueden
       * interferir con el ciclo de vida de la surface nativa en Android y
       * causar un crash al intentar montar el MapView.
       * El MapView se monta en onShow (no en onOpen) para garantizar que
       * la ventana nativa del Modal esté completamente lista.
       */}
      <Modal
        visible={modalVisible}
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={cancelar}
        onShow={() => setMapaListo(true)}
      >
        <SafeAreaView style={styles.modalContenedor} edges={['top', 'bottom']}>
          {/* Encabezado del modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={cancelar}
              style={styles.modalBotonHeader}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancelar selección de ubicación"
            >
              <Text style={styles.modalCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitulo}>Elegir ubicación</Text>

            <TouchableOpacity
              onPress={confirmar}
              style={[styles.modalBotonHeader, styles.modalBotonConfirmar]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Confirmar ubicación seleccionada"
            >
              <Text style={styles.modalConfirmarTexto}>Confirmar</Text>
            </TouchableOpacity>
          </View>

          {/* Instrucción de uso */}
          <View style={styles.instruccionBanner}>
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.instruccionTexto}>
              Mové el mapa para centrar el pin en la ubicación exacta
            </Text>
          </View>

          {/* Mapa interactivo con Google Maps — se monta solo cuando la
              ventana del Modal está completamente inicializada (onShow) */}
          {mapaListo && (
            <MapView
              ref={mapRef}
              style={styles.mapaCompleto}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: coordenadasTemp.latitude,
                longitude: coordenadasTemp.longitude,
                latitudeDelta: DELTA_ZOOM,
                longitudeDelta: DELTA_ZOOM,
              }}
              onRegionChangeComplete={handleRegionChangeComplete}
            >
              {/* Marker arrastrable para ajuste fino de coordenadas */}
              <Marker
                coordinate={coordenadasTemp}
                draggable
                onDragEnd={(e) => handleMarkerDrag(e.nativeEvent.coordinate)}
                pinColor={theme.colors.primary}
                title="Ubicación de la juntada"
              />
            </MapView>
          )}

          {/* Coordenadas en tiempo real */}
          <View style={styles.coordenadasBanner}>
            <Ionicons name="location" size={14} color={theme.colors.primary} />
            <Text style={styles.coordenadasTexto}>
              {coordenadasTemp.latitude.toFixed(5)},{' '}
              {coordenadasTemp.longitude.toFixed(5)}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ── Contenedor principal ─────────────────────────────────────────── */
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },

  /* ── Botón de estado vacío ────────────────────────────────────────── */
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    minHeight: theme.components.inputHeight,
  },
  botonAgregarIcono: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAgregarTextos: {
    flex: 1,
  },
  botonAgregarLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  botonAgregarHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  /* ── Preview con coordenadas seleccionadas ────────────────────────── */
  previewContenedor: {
    borderRadius: theme.radius.md,
    borderWidth: theme.components.borderWidth,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  miniMapa: {
    width: '100%',
    height: 110,
  },
  previewInfo: {
    padding: theme.spacing.sm,
    gap: 2,
  },
  previewFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  previewTexto: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  previewCoordenadas: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  previewAcciones: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    paddingTop: 0,
  },
  botonCambiar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  botonCambiarTexto: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  botonQuitar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  botonQuitarTexto: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },

  /* ── Modal ────────────────────────────────────────────────────────── */
  modalContenedor: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalBotonHeader: {
    minWidth: 70,
    paddingVertical: theme.spacing.xs,
  },
  modalBotonConfirmar: {
    alignItems: 'flex-end',
  },
  modalTitulo: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  modalCancelarTexto: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  modalConfirmarTexto: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  instruccionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  instruccionTexto: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  mapaCompleto: {
    flex: 1,
    height: ALTO_PANTALLA,
  },
  coordenadasBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  coordenadasTexto: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
});
