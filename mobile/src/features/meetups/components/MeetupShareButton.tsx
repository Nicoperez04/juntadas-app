/**
 * Botón de compartir juntada — disponible para TODOS los miembros
 * (organizador y participantes).
 *
 * Al presionarlo abre un bottom sheet con tres opciones:
 *   1. Copiar código: copia join_code al clipboard con expo-clipboard
 *   2. Compartir por WhatsApp: abre WhatsApp con un mensaje pre-armado
 *      usando el scheme whatsapp://send (sin deep links propios)
 *   3. Compartir con otra app: abre el selector nativo del sistema (Share API)
 *
 * El feedback (toast de éxito o error) se delega a la pantalla padre vía
 * onFeedback, para reutilizar el Toast que ya orquesta MeetupDetailScreen
 * y no apilar dos modales de feedback distintos.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';

/** Props del botón de compartir */
interface MeetupShareButtonProps {
  /** Título de la juntada para el mensaje de invitación */
  meetupTitle: string;
  /** Código de 6 caracteres para unirse a la juntada */
  joinCode: string;
  /** Notifica a la pantalla padre para mostrar el toast correspondiente */
  onFeedback: (message: string, type: 'success' | 'error') => void;
}

/**
 * Arma el mensaje de invitación con el formato acordado para WhatsApp.
 *
 * @param title - Título de la juntada
 * @param joinCode - Código de ingreso
 * @returns Texto plano del mensaje de invitación
 */
const buildInviteMessage = (title: string, joinCode: string): string =>
  `Te invito a ${title} en Juntadas 🎉\nEl código para unirte es: ${joinCode}\n¡Nos vemos!`;

export const MeetupShareButton = ({
  meetupTitle,
  joinCode,
  onFeedback,
}: MeetupShareButtonProps) => {
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  /**
   * Copia el código al clipboard, cierra el sheet y confirma con toast.
   */
  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(joinCode);
    setIsSheetVisible(false);
    onFeedback('Código copiado', 'success');
  };

  /**
   * Abre WhatsApp con el mensaje pre-armado vía su scheme nativo.
   *
   * Se intenta openURL directamente en lugar de consultar canOpenURL:
   * en iOS y Android modernos canOpenURL devuelve falsos negativos si el
   * scheme no está declarado en la configuración nativa (que no se puede
   * modificar en este bloque). Si WhatsApp no está instalado, openURL
   * lanza y se informa con un toast de error claro.
   */
  const handleShareWhatsApp = async () => {
    const message = buildInviteMessage(meetupTitle, joinCode);
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(url);
      setIsSheetVisible(false);
    } catch {
      setIsSheetVisible(false);
      onFeedback(
        'No se pudo abrir WhatsApp. Verificá que esté instalado.',
        'error',
      );
    }
  };

  /**
   * Abre el selector nativo de compartir del sistema operativo.
   * Usa el mismo mensaje de invitación que WhatsApp para mantener consistencia.
   */
  const handleShareNative = async () => {
    const message = buildInviteMessage(meetupTitle, joinCode);

    try {
      await Share.share({ message });
      setIsSheetVisible(false);
    } catch {
      setIsSheetVisible(false);
      onFeedback('No se pudo compartir la invitación', 'error');
    }
  };

  return (
    <>
      {/* Botón disparador del bottom sheet */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => setIsSheetVisible(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Compartir juntada"
      >
        <Ionicons
          name="share-social-outline"
          size={18}
          color={theme.colors.primary}
        />
        <Text style={styles.shareButtonText}>Compartir</Text>
      </TouchableOpacity>

      {/* Bottom sheet con las opciones de compartir */}
      <Modal
        transparent
        animationType="fade"
        visible={isSheetVisible}
        onRequestClose={() => setIsSheetVisible(false)}
      >
        {/* Tocar el fondo oscuro cierra el sheet */}
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setIsSheetVisible(false)}
        >
          {/* Pressable vacío evita que el toque dentro del sheet lo cierre */}
          <Pressable style={styles.sheetCard} onPress={() => undefined}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Compartir juntada</Text>
            <Text style={styles.sheetSubtitle}>
              Invitá a tus amigos con el código {joinCode}
            </Text>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => void handleCopyCode()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Copiar código de la juntada"
            >
              <View style={[styles.sheetOptionIcon, styles.sheetOptionIconCopy]}>
                <Ionicons
                  name="copy-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.sheetOptionTextBox}>
                <Text style={styles.sheetOptionLabel}>Copiar código</Text>
                <Text style={styles.sheetOptionHint}>
                  Copia el código al portapapeles
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.textDisabled}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => void handleShareWhatsApp()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Compartir por WhatsApp"
            >
              <View
                style={[styles.sheetOptionIcon, styles.sheetOptionIconWhatsApp]}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={22}
                  color={theme.colors.success}
                />
              </View>
              <View style={styles.sheetOptionTextBox}>
                <Text style={styles.sheetOptionLabel}>
                  Compartir por WhatsApp
                </Text>
                <Text style={styles.sheetOptionHint}>
                  Envía la invitación con el código
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.textDisabled}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => void handleShareNative()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Compartir con otra app"
            >
              <View
                style={[styles.sheetOptionIcon, styles.sheetOptionIconShare]}
              >
                <Ionicons
                  name="share-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.sheetOptionTextBox}>
                <Text style={styles.sheetOptionLabel}>
                  Compartir con otra app
                </Text>
                <Text style={styles.sheetOptionHint}>
                  Telegram, Mail, Instagram y más
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.textDisabled}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setIsSheetVisible(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cerrar opciones de compartir"
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
  },
  shareButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  sheetTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionIconCopy: {
    backgroundColor: theme.colors.primaryLight,
  },
  sheetOptionIconWhatsApp: {
    backgroundColor: theme.colors.successLight,
  },
  sheetOptionIconShare: {
    backgroundColor: theme.colors.primaryLight,
  },
  sheetOptionTextBox: {
    flex: 1,
  },
  sheetOptionLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  sheetOptionHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sheetCancelBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  sheetCancelText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
});
