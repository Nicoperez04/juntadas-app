/**
 * Pantalla de historial completo de juntadas del usuario.
 *
 * Muestra todas las juntadas (activas, finalizadas y canceladas) con
 * búsqueda en tiempo real, filtros avanzados en bottom sheet y acciones
 * de ocultar/eliminar reveladas por swipe hacia la izquierda.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  FlatList,
  Modal,
  Animated,
  PanResponder,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import { AppTabBar } from '@/shared/components/AppTabBar';
import { AppButton } from '@/shared/components/AppButton';
import { Toast } from '@/shared/components/Toast';
import { triggerSuccessHaptic } from '@/shared/utils/haptics';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import {
  useAllUserMeetups,
  useHideMeetup,
  useDeleteMeetupForAll,
} from '../hooks/useMeetups';
import type {
  MeetupWithRole,
  MeetupStatus,
  ParticipantRole,
} from '../types';
import type { MainStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'MeetupHistory'>;

/** Filtro de rol: todas o un rol concreto */
type RoleFilter = 'all' | ParticipantRole;

/** Estado de los filtros aplicados en la lista */
interface HistoryFilters {
  /** Array vacío equivale a "Todas" — sin filtro por estado */
  statuses: MeetupStatus[];
  role: RoleFilter;
  dateFrom: Date | null;
  dateTo: Date | null;
}

/** Filtros por defecto — sin restricciones */
const DEFAULT_FILTERS: HistoryFilters = {
  statuses: [],
  role: 'all',
  dateFrom: null,
  dateTo: null,
};

/** Ancho de cada botón de acción revelado por swipe */
const SWIPE_ACTION_WIDTH = 88;

/** Distancia mínima de swipe para mantener las acciones visibles */
const SWIPE_THRESHOLD = 44;

/**
 * Formatea una fecha almacenada como string para mostrar al usuario.
 *
 * @param dateStr - Fecha como string (ISO YYYY-MM-DD o DD/MM/YYYY)
 * @returns Fecha en formato DD/MM/YYYY
 */
const formatDate = (dateStr: string): string => {
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

/**
 * Convierte la fecha de la juntada (YYYY-MM-DD) a Date local sin hora.
 *
 * @param dateStr - Fecha en formato YYYY-MM-DD desde Supabase
 * @returns Date a medianoche local
 */
const parseMeetupDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formatea una Date para mostrar en chips de filtros activos.
 *
 * @param date - Fecha seleccionada en el filtro
 * @returns Fecha en formato DD/MM/YYYY
 */
const formatFilterDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/** Configuración visual del badge de estado según el prompt del bloque */
const STATUS_CONFIG: Record<
  MeetupStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  active: {
    label: 'Activa',
    bgColor: theme.colors.primaryLight,
    textColor: theme.colors.primary,
  },
  finished: {
    label: 'Finalizada',
    bgColor: theme.colors.border,
    textColor: theme.colors.textSecondary,
  },
  cancelled: {
    label: 'Cancelada',
    bgColor: theme.colors.errorLight,
    textColor: theme.colors.error,
  },
};

/** Opciones individuales de estado — selección múltiple */
const STATUS_INDIVIDUAL_OPTIONS: { value: MeetupStatus; label: string }[] = [
  { value: 'active', label: 'Activas' },
  { value: 'finished', label: 'Finalizadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

/**
 * Alterna un estado en el filtro draft.
 * "Todas" limpia el array; las opciones individuales se agregan o quitan.
 * Si el array queda vacío, equivale a mostrar todas.
 *
 * @param current - Estados actualmente seleccionados en el draft
 * @param value - "all" o un status concreto
 * @returns Nuevo array de estados seleccionados
 */
const toggleStatusSelection = (
  current: MeetupStatus[],
  value: 'all' | MeetupStatus,
): MeetupStatus[] => {
  if (value === 'all') return [];

  if (current.includes(value)) {
    return current.filter((status) => status !== value);
  }

  return [...current, value];
};

const ROLE_FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'organizer', label: 'Organizador' },
  { value: 'participant', label: 'Participante' },
];

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Chip seleccionable con transición suave de color al activarse.
 * Usa Animated de React Native para interpolar fondo y texto.
 */
const FilterChip = ({ label, selected, onPress }: FilterChipProps) => {
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selected, anim]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surface, theme.colors.primary],
  });

  const color = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.textSecondary, theme.colors.surface],
  });

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.primary],
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && styles.filterChipPressed}
    >
      <Animated.View
        style={[
          styles.filterChip,
          { backgroundColor, borderColor },
        ]}
      >
        <Animated.Text style={[styles.filterChipText, { color }]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

interface ActiveFilterChipProps {
  label: string;
  onRemove: () => void;
}

/** Chip de filtro activo en la pantalla principal con botón X */
const ActiveFilterChip = ({ label, onRemove }: ActiveFilterChipProps) => (
  <View style={styles.activeFilterChip}>
    <Text style={styles.activeFilterChipText}>{label}</Text>
    <Pressable
      onPress={onRemove}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={`Quitar filtro ${label}`}
      style={({ pressed }) => pressed && styles.activeFilterChipRemovePressed}
    >
      <Ionicons name="close" size={14} color={theme.colors.primary} />
    </Pressable>
  </View>
);

interface HistoryCardProps {
  meetup: MeetupWithRole;
  onPress: () => void;
  onHidePress: () => void;
  onDeletePress: () => void;
}

/**
 * Card de juntada con swipe hacia la izquierda para revelar acciones.
 * El organizador ve "Ocultar" y "Eliminar para todos"; el participante solo "Ocultar".
 */
const HistoryCard = ({
  meetup,
  onPress,
  onHidePress,
  onDeletePress,
}: HistoryCardProps) => {
  const isOrganizer = meetup.userRole === 'organizer';
  const statusConfig = STATUS_CONFIG[meetup.status];
  const actionCount = isOrganizer ? 2 : 1;
  const maxSwipe = SWIPE_ACTION_WIDTH * actionCount;

  const translateX = useRef(new Animated.Value(0)).current;
  const currentOffset = useRef(0);

  const closeSwipe = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
    currentOffset.current = 0;
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      // Solo capturar swipe horizontal; nunca interceptar el toque inicial
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dy) < 12,
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(
          0,
          Math.max(-maxSwipe, currentOffset.current + gesture.dx),
        );
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const projected = currentOffset.current + gesture.dx;
        if (projected < -SWIPE_THRESHOLD) {
          currentOffset.current = -maxSwipe;
          Animated.spring(translateX, {
            toValue: -maxSwipe,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        } else {
          closeSwipe();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <View style={[styles.swipeActions, { width: maxSwipe }]}>
        <TouchableOpacity
          style={[styles.swipeActionBtn, styles.swipeHideBtn]}
          onPress={() => {
            closeSwipe();
            onHidePress();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-off-outline" size={20} color={theme.colors.surface} />
          <Text style={styles.swipeActionText}>Ocultar</Text>
        </TouchableOpacity>
        {isOrganizer && (
          <TouchableOpacity
            style={[styles.swipeActionBtn, styles.swipeDeleteBtn]}
            onPress={() => {
              closeSwipe();
              onDeletePress();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.surface} />
            <Text style={styles.swipeActionText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View
        style={[styles.swipeCardWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
          onPress={onPress}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {meetup.title}
              </Text>
              {meetup.reviews_enabled && (
                <Ionicons
                  name="star"
                  size={14}
                  color={theme.colors.warning}
                  style={styles.reviewsBadge}
                />
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bgColor },
              ]}
            >
              <Text
                style={[styles.statusText, { color: statusConfig.textColor }]}
              >
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.cardInfoRow}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.cardInfoText}>
              {formatDate(meetup.date)} · {meetup.time}
            </Text>
          </View>

          <View style={styles.cardInfoRow}>
            <Ionicons
              name="location-outline"
              size={13}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.cardInfoText} numberOfLines={1}>
              {meetup.location}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <View
              style={[
                styles.roleBadge,
                isOrganizer ? styles.badgeOrganizer : styles.badgeParticipant,
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  isOrganizer
                    ? styles.badgeTextOrganizer
                    : styles.badgeTextParticipant,
                ]}
              >
                {isOrganizer ? 'Organizador' : 'Participante'}
              </Text>
            </View>
            <Text style={styles.countText}>
              {meetup.participantCount} participantes
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

/** Tipo de acción pendiente de confirmación en el modal */
type PendingAction = 'hide' | 'delete' | null;

export const MeetupHistoryScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { userId, isLoading: isLoadingSession } = useCurrentUser();
  const allMeetupsQuery = useAllUserMeetups(userId);
  const hideMutation = useHideMeetup();
  const deleteMutation = useDeleteMeetupForAll();

  const filterSheetRef = useRef<BottomSheetModal>(null);
  const searchInputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [focusedDatePicker, setFocusedDatePicker] = useState<
    'from' | 'to' | null
  >(null);
  const [appliedFilters, setAppliedFilters] =
    useState<HistoryFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<HistoryFilters>(DEFAULT_FILTERS);

  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedMeetup, setSelectedMeetup] = useState<MeetupWithRole | null>(
    null,
  );
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const allMeetups = allMeetupsQuery.data ?? [];
  const isLoading =
    isLoadingSession ||
    allMeetupsQuery.isLoading ||
    allMeetupsQuery.isFetching;
  const error = allMeetupsQuery.error?.message ?? null;

  /**
   * Filtra la lista en cliente combinando búsqueda y filtros (AND).
   */
  const filteredMeetups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allMeetups.filter((meetup) => {
      if (query && !meetup.title.toLowerCase().includes(query)) {
        return false;
      }
      if (
        appliedFilters.statuses.length > 0 &&
        !appliedFilters.statuses.includes(meetup.status)
      ) {
        return false;
      }
      if (
        appliedFilters.role !== 'all' &&
        meetup.userRole !== appliedFilters.role
      ) {
        return false;
      }

      const meetupDate = parseMeetupDate(meetup.date);

      if (appliedFilters.dateFrom) {
        const from = new Date(appliedFilters.dateFrom);
        from.setHours(0, 0, 0, 0);
        if (meetupDate < from) return false;
      }

      if (appliedFilters.dateTo) {
        const to = new Date(appliedFilters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (meetupDate > to) return false;
      }

      return true;
    });
  }, [allMeetups, searchQuery, appliedFilters]);

  /** Chips de filtros activos derivados del estado aplicado */
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (appliedFilters.statuses.length > 0) {
      const statusLabels = appliedFilters.statuses
        .map(
          (status) =>
            STATUS_INDIVIDUAL_OPTIONS.find((o) => o.value === status)?.label ??
            status,
        )
        .join(', ');

      chips.push({
        key: 'status',
        label: `Estado: ${statusLabels}`,
        onRemove: () =>
          setAppliedFilters((prev) => ({ ...prev, statuses: [] })),
      });
    }

    if (appliedFilters.role !== 'all') {
      const option = ROLE_FILTER_OPTIONS.find(
        (o) => o.value === appliedFilters.role,
      );
      chips.push({
        key: 'role',
        label: `Rol: ${option?.label ?? appliedFilters.role}`,
        onRemove: () =>
          setAppliedFilters((prev) => ({ ...prev, role: 'all' })),
      });
    }

    if (appliedFilters.dateFrom) {
      chips.push({
        key: 'dateFrom',
        label: `Desde: ${formatFilterDate(appliedFilters.dateFrom)}`,
        onRemove: () =>
          setAppliedFilters((prev) => ({ ...prev, dateFrom: null })),
      });
    }

    if (appliedFilters.dateTo) {
      chips.push({
        key: 'dateTo',
        label: `Hasta: ${formatFilterDate(appliedFilters.dateTo)}`,
        onRemove: () =>
          setAppliedFilters((prev) => ({ ...prev, dateTo: null })),
      });
    }

    return chips;
  }, [appliedFilters]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  /**
   * Cierra el teclado y quita el estado visual de focus del buscador.
   * Se invoca al tocar fuera, deslizar la lista o abrir filtros.
   */
  const blurSearch = useCallback(() => {
    searchInputRef.current?.blur();
    Keyboard.dismiss();
    setIsSearchFocused(false);
  }, []);

  const openFilterSheet = () => {
    blurSearch();
    setDraftFilters(appliedFilters);
    filterSheetRef.current?.present();
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    filterSheetRef.current?.dismiss();
  };

  const clearDraftFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
  };

  const handleDateFromChange = (
    event: DateTimePickerEvent,
    date?: Date,
  ) => {
    setShowDateFromPicker(Platform.OS === 'ios');
    if (event.type === 'dismissed' || !date) {
      setFocusedDatePicker(null);
      return;
    }
    setDraftFilters((prev) => ({ ...prev, dateFrom: date }));
    setFocusedDatePicker(null);
  };

  const handleDateToChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDateToPicker(Platform.OS === 'ios');
    if (event.type === 'dismissed' || !date) {
      setFocusedDatePicker(null);
      return;
    }
    setDraftFilters((prev) => ({ ...prev, dateTo: date }));
    setFocusedDatePicker(null);
  };

  const openHideConfirm = (meetup: MeetupWithRole) => {
    setSelectedMeetup(meetup);
    setPendingAction('hide');
  };

  const openDeleteConfirm = (meetup: MeetupWithRole) => {
    setSelectedMeetup(meetup);
    setPendingAction('delete');
  };

  const closeConfirmModal = () => {
    setPendingAction(null);
    setSelectedMeetup(null);
  };

  const confirmPendingAction = async () => {
    if (!selectedMeetup || !pendingAction) return;

    if (pendingAction === 'hide') {
      const result = await hideMutation.mutateAsync(selectedMeetup.id);
      closeConfirmModal();
      if (result.error) {
        setToast({ message: result.error, type: 'error' });
        return;
      }
      void triggerSuccessHaptic();
      setToast({
        message: '✓ Juntada ocultada de tu historial',
        type: 'success',
      });
      return;
    }

    const result = await deleteMutation.mutateAsync(selectedMeetup.id);
    closeConfirmModal();
    if (result.error) {
      setToast({ message: result.error, type: 'error' });
      return;
    }
    void triggerSuccessHaptic();
    setToast({ message: '✓ Juntada eliminada', type: 'success' });
  };

  const isActionLoading = hideMutation.isPending || deleteMutation.isPending;

  const renderEmpty = () => {
    if (isLoading) return null;

    const hasFiltersOrSearch =
      searchQuery.trim().length > 0 ||
      activeFilterChips.length > 0;

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrapper}>
          <Ionicons
            name={hasFiltersOrSearch ? 'search-outline' : 'time-outline'}
            size={64}
            color={theme.colors.primary}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {hasFiltersOrSearch
            ? 'Sin resultados'
            : 'Sin historial aún'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {hasFiltersOrSearch
            ? 'Probá con otros filtros o una búsqueda distinta'
            : 'Acá vas a ver todas tus juntadas: activas, finalizadas y canceladas'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeAreaTop} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              blurSearch();
              navigation.goBack();
            }}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.searchSection}>
          {/* Buscador y botón de filtros en la misma fila para ahorrar espacio vertical */}
          <View style={styles.searchRow}>
            {/*
              El TextInput ocupa todo el contenedor; ícono y botón limpiar
              se superponen con position absolute para no robar el área táctil.
            */}
            <View
              style={[
                styles.searchBar,
                isSearchFocused && styles.searchBarFocused,
              ]}
            >
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Buscar por título..."
                placeholderTextColor={theme.colors.textDisabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onSubmitEditing={blurSearch}
                blurOnSubmit
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                underlineColorAndroid="transparent"
                showSoftInputOnFocus
              />
              <TouchableOpacity
                style={styles.searchIconOverlay}
                onPress={() => {
                  if (isSearchFocused) {
                    blurSearch();
                    return;
                  }
                  searchInputRef.current?.focus();
                }}
                activeOpacity={0.7}
                accessibilityLabel={
                  isSearchFocused ? 'Cerrar búsqueda' : 'Buscar'
                }
              >
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={
                    isSearchFocused
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
              </TouchableOpacity>
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.searchClearBtn}
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.colors.textDisabled}
                  />
                </TouchableOpacity>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.filtersBtn,
                activeFilterChips.length > 0 && styles.filtersBtnActive,
                pressed && styles.filtersBtnPressed,
              ]}
              onPress={openFilterSheet}
              accessibilityLabel="Abrir filtros"
              accessibilityRole="button"
            >
              <Ionicons
                name="filter"
                size={24}
                color={
                  activeFilterChips.length > 0
                    ? theme.colors.surface
                    : theme.colors.primary
                }
              />
            </Pressable>
          </View>

          {/* Chips activos en fila horizontal con wrap debajo del buscador */}
          {activeFilterChips.length > 0 && (
            <View style={styles.activeFiltersWrap}>
              {activeFilterChips.map((chip) => (
                <ActiveFilterChip
                  key={chip.key}
                  label={chip.label}
                  onRemove={chip.onRemove}
                />
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={36}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => void allMeetupsQuery.refetch()}
            activeOpacity={0.7}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={filteredMeetups}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={blurSearch}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryCard
              meetup={item}
              onPress={() => {
                blurSearch();
                navigation.navigate(Routes.MeetupDetail, {
                  meetupId: item.id,
                });
              }}
              onHidePress={() => openHideConfirm(item)}
              onDeletePress={() => openDeleteConfirm(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            filteredMeetups.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Capa sobre la lista: tocar fuera del buscador cierra teclado y quita focus */}
      {isSearchFocused && (
        <Pressable
          style={styles.searchDismissOverlay}
          onPress={blurSearch}
          accessibilityLabel="Cerrar búsqueda"
        />
      )}

      <View style={styles.tabBarLayer}>
        <AppTabBar activeTab="home" />
      </View>

      {/* Bottom sheet de filtros avanzados */}
      <BottomSheetModal
        ref={filterSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        {/* Altura automática: todo el contenido actual entra sin scroll */}
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Filtros</Text>

          <Text style={styles.sheetSectionTitle}>Estado</Text>
          <View style={styles.chipRow}>
            <FilterChip
              label="Todas"
              selected={draftFilters.statuses.length === 0}
              onPress={() =>
                setDraftFilters((prev) => ({
                  ...prev,
                  statuses: toggleStatusSelection(prev.statuses, 'all'),
                }))
              }
            />
            {STATUS_INDIVIDUAL_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={draftFilters.statuses.includes(option.value)}
                onPress={() =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    statuses: toggleStatusSelection(
                      prev.statuses,
                      option.value,
                    ),
                  }))
                }
              />
            ))}
          </View>

          <Text style={styles.sheetSectionTitle}>Rol</Text>
          <View style={styles.chipRow}>
            {ROLE_FILTER_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={draftFilters.role === option.value}
                onPress={() =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    role: option.value,
                  }))
                }
              />
            ))}
          </View>

          <Text style={styles.sheetSectionTitle}>Fecha</Text>
          <View style={styles.dateFiltersRow}>
            <View style={styles.dateFilterCol}>
              <Text style={styles.dateFilterLabel}>Desde</Text>
              <Pressable
                style={[
                  styles.datePickerBtn,
                  focusedDatePicker === 'from' && styles.datePickerBtnFocused,
                ]}
                onPress={() => {
                  setFocusedDatePicker('from');
                  setShowDateFromPicker(true);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={
                    focusedDatePicker === 'from'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.datePickerBtnText,
                    !draftFilters.dateFrom && styles.datePickerPlaceholder,
                  ]}
                >
                  {draftFilters.dateFrom
                    ? formatFilterDate(draftFilters.dateFrom)
                    : 'Elegir fecha'}
                </Text>
              </Pressable>
              {showDateFromPicker && (
                <DateTimePicker
                  value={draftFilters.dateFrom ?? new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateFromChange}
                />
              )}
            </View>

            <View style={styles.dateFilterCol}>
              <Text style={styles.dateFilterLabel}>Hasta</Text>
              <Pressable
                style={[
                  styles.datePickerBtn,
                  focusedDatePicker === 'to' && styles.datePickerBtnFocused,
                ]}
                onPress={() => {
                  setFocusedDatePicker('to');
                  setShowDateToPicker(true);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={
                    focusedDatePicker === 'to'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.datePickerBtnText,
                    !draftFilters.dateTo && styles.datePickerPlaceholder,
                  ]}
                >
                  {draftFilters.dateTo
                    ? formatFilterDate(draftFilters.dateTo)
                    : 'Elegir fecha'}
                </Text>
              </Pressable>
              {showDateToPicker && (
                <DateTimePicker
                  value={draftFilters.dateTo ?? new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateToChange}
                />
              )}
            </View>
          </View>

          <View style={styles.sheetActions}>
            <AppButton label="Aplicar filtros" onPress={applyFilters} />
            <AppButton
              label="Limpiar filtros"
              variant="ghost"
              onPress={clearDraftFilters}
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Modal de confirmación para ocultar o eliminar */}
      <Modal
        transparent
        animationType="fade"
        visible={pendingAction !== null}
        onRequestClose={() => !isActionLoading && closeConfirmModal()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconBox,
                pendingAction === 'delete' && styles.modalIconBoxDanger,
              ]}
            >
              <Ionicons
                name={
                  pendingAction === 'delete'
                    ? 'trash-outline'
                    : 'eye-off-outline'
                }
                size={32}
                color={
                  pendingAction === 'delete'
                    ? theme.colors.error
                    : theme.colors.primary
                }
              />
            </View>

            {pendingAction === 'hide' ? (
              <>
                <Text style={styles.modalTitle}>
                  ¿Querés ocultar esta juntada de tu historial?
                </Text>
                <Text style={styles.modalSubtitle}>
                  Solo desaparecerá para vos.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>
                  ¿Eliminar esta juntada para todos los participantes?
                </Text>
                <Text style={styles.modalSubtitle}>
                  Esta acción no se puede deshacer.
                </Text>
              </>
            )}

            <View style={styles.modalActions}>
              <AppButton
                label="Cancelar"
                variant="ghost"
                onPress={closeConfirmModal}
                disabled={isActionLoading}
              />
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  pendingAction === 'delete' && styles.modalConfirmBtnDanger,
                  isActionLoading && styles.btnDisabled,
                ]}
                onPress={() => void confirmPendingAction()}
                disabled={isActionLoading}
                activeOpacity={0.8}
              >
                {isActionLoading ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>
                    {pendingAction === 'hide' ? 'Sí, ocultar' : 'Sí, eliminar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        visible={!!toast}
        onHide={() => setToast(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchDismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  safeAreaTop: {
    backgroundColor: theme.colors.surface,
    zIndex: 3,
    elevation: 4,
  },
  tabBarLayer: {
    zIndex: 3,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  headerPlaceholder: {
    width: 36,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchBar: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    minHeight: 48,
  },
  searchBarFocused: {
    borderColor: theme.colors.primary,
  },
  searchInput: {
    width: '100%',
    height: 48,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
    paddingLeft: theme.spacing.md + 22,
    paddingRight: theme.spacing.md + 22,
    paddingVertical: 0,
  },
  searchIconOverlay: {
    position: 'absolute',
    left: theme.spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  searchClearBtn: {
    position: 'absolute',
    right: theme.spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  activeFiltersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  activeFilterChipText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primary,
  },
  activeFilterChipRemovePressed: {
    opacity: 0.6,
  },
  filtersBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.primary,
  },
  filtersBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filtersBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  list: {
    flex: 1,
    zIndex: 0,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  swipeContainer: {
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderRadius: theme.radius.lg,
  },
  swipeActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  swipeActionBtn: {
    width: SWIPE_ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  swipeHideBtn: {
    backgroundColor: theme.colors.textSecondary,
  },
  swipeDeleteBtn: {
    backgroundColor: theme.colors.error,
  },
  swipeActionText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  swipeCardWrapper: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    ...theme.shadows.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardPressed: {
    backgroundColor: theme.colors.background,
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  titleWithBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  reviewsBadge: {
    flexShrink: 0,
  },
  cardTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    flexShrink: 0,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  cardInfoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  roleBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  badgeOrganizer: {
    backgroundColor: theme.colors.warningLight,
  },
  badgeParticipant: {
    backgroundColor: theme.colors.primaryLight,
  },
  roleBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  badgeTextOrganizer: {
    color: '#92400E',
  },
  badgeTextParticipant: {
    color: theme.colors.primary,
  },
  countText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.md,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sheetBackground: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
  },
  sheetHandle: {
    backgroundColor: theme.colors.border,
    width: 40,
  },
  sheetContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  sheetTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },
  sheetSectionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  filterChip: {
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterChipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  filterChipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  dateFiltersRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  dateFilterCol: {
    flex: 1,
  },
  dateFilterLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: theme.components.inputBorderWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    minHeight: 40,
  },
  datePickerBtnFocused: {
    borderColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  datePickerBtnText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textPrimary,
  },
  datePickerPlaceholder: {
    color: theme.colors.textDisabled,
  },
  sheetActions: {
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  modalIconBoxDanger: {
    backgroundColor: theme.colors.errorLight,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  modalConfirmBtn: {
    height: theme.components.buttonHeight,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalConfirmBtnDanger: {
    backgroundColor: theme.colors.error,
  },
  modalConfirmBtnText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.surface,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
