import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/shared/constants/theme';
import { ShimmerPlaceholder } from './MeetupCardSkeleton';

export const MeetupDetailSkeleton = () => {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.textDisabled} />
          </View>
          <TextPlaceholder width={80} height={16} />
          <View style={styles.rolePlaceholder} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        {/* Banner de portada simulado */}
        <View style={styles.coverCard}>
          <ShimmerPlaceholder style={styles.coverImage} />
          <View style={styles.coverContent}>
            <ShimmerPlaceholder style={styles.badgeLine} />
            <ShimmerPlaceholder style={styles.titleLine} />
            <ShimmerPlaceholder style={styles.descLine} />
          </View>
        </View>

        {/* Detalles de la juntada (Ubicación, Costo, Fecha/Hora) */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <ShimmerPlaceholder style={styles.infoIcon} />
            <View style={styles.infoTexts}>
              <ShimmerPlaceholder style={styles.infoTitle} />
              <ShimmerPlaceholder style={styles.infoSubtitle} />
            </View>
          </View>
          <View style={styles.infoRow}>
            <ShimmerPlaceholder style={styles.infoIcon} />
            <View style={styles.infoTexts}>
              <ShimmerPlaceholder style={styles.infoTitle} />
              <ShimmerPlaceholder style={styles.infoSubtitle} />
            </View>
          </View>
          <View style={styles.infoRow}>
            <ShimmerPlaceholder style={styles.infoIcon} />
            <View style={styles.infoTexts}>
              <ShimmerPlaceholder style={styles.infoTitle} />
              <ShimmerPlaceholder style={styles.infoSubtitle} />
            </View>
          </View>
        </View>

        {/* Tarjetas de Acción (Jugar, Estadísticas, Recuerdos) */}
        <View style={styles.actionsRow}>
          <View style={styles.actionCard}>
            <ShimmerPlaceholder style={styles.actionIconBox} />
            <ShimmerPlaceholder style={styles.actionLabel} />
          </View>
          <View style={styles.actionCard}>
            <ShimmerPlaceholder style={styles.actionIconBox} />
            <ShimmerPlaceholder style={styles.actionLabel} />
          </View>
          <View style={styles.actionCard}>
            <ShimmerPlaceholder style={styles.actionIconBox} />
            <ShimmerPlaceholder style={styles.actionLabel} />
          </View>
        </View>

        {/* Sección de participantes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShimmerPlaceholder style={styles.sectionTitle} />
            <ShimmerPlaceholder style={styles.sectionSubtitle} />
          </View>

          <View style={styles.participantCard}>
            <View style={styles.participantRow}>
              <ShimmerPlaceholder style={styles.avatar} />
              <View style={styles.participantInfo}>
                <ShimmerPlaceholder style={styles.participantName} />
                <ShimmerPlaceholder style={styles.participantRole} />
              </View>
            </View>
            <View style={styles.participantRow}>
              <ShimmerPlaceholder style={styles.avatar} />
              <View style={styles.participantInfo}>
                <ShimmerPlaceholder style={styles.participantName} />
                <ShimmerPlaceholder style={styles.participantRole} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const TextPlaceholder = ({ width, height }: { width: number; height: number }) => (
  <ShimmerPlaceholder style={{ width, height, borderRadius: theme.radius.sm }} />
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  rolePlaceholder: {
    width: 72,
    height: 24,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  coverCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  coverImage: {
    width: '100%',
    height: 180,
  },
  coverContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  badgeLine: {
    width: 80,
    height: 20,
    borderRadius: theme.radius.full,
  },
  titleLine: {
    width: '70%',
    height: 22,
    borderRadius: theme.radius.sm,
  },
  descLine: {
    width: '90%',
    height: 14,
    borderRadius: theme.radius.sm,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
  },
  infoTexts: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  infoTitle: {
    width: '40%',
    height: 14,
    borderRadius: theme.radius.sm,
  },
  infoSubtitle: {
    width: '60%',
    height: 12,
    borderRadius: theme.radius.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.md,
  },
  actionLabel: {
    width: 50,
    height: 12,
    borderRadius: theme.radius.sm,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  sectionTitle: {
    width: 120,
    height: 18,
    borderRadius: theme.radius.sm,
  },
  sectionSubtitle: {
    width: 60,
    height: 12,
    borderRadius: theme.radius.sm,
  },
  participantCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
  },
  participantInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  participantName: {
    width: '50%',
    height: 14,
    borderRadius: theme.radius.sm,
  },
  participantRole: {
    width: '30%',
    height: 12,
    borderRadius: theme.radius.sm,
  },
});
