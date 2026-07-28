/**
 * Listado de juntadas de un grupo, con tabs "Próximas" / "Historial".
 *
 * Reemplaza el placeholder "Próximamente" de la card "Juntadas" en
 * GroupDetailScreen (4.3) con el listado real (4.4b). Reusa MeetupCard
 * (extraído de MeetupHomeScreen a un componente compartido en ese mismo
 * prompt) para mantener el mismo criterio visual que el listado de
 * juntadas propias.
 *
 * Hasta 4.9 solo mostraba juntadas activas (RF-41 exige historial por
 * grupo). Ahora groupService.getGroupMeetups trae todas las juntadas
 * del grupo sin filtrar status, y esta pantalla las separa en dos tabs
 * client-side. Ver 4.9-historial-juntadas-grupo.md para el detalle de
 * por qué no hizo falta RLS nueva, y las 2 limitaciones heredadas de la
 * RLS existente (miembros que se unen después de una juntada no la ven,
 * ni quien abandonó esa juntada puntual sin dejar el grupo).
 *
 * El badge de estado del tab "Historial" es un componente local nuevo
 * (HistoryStatusBadge), no una modificación de MeetupCard — MeetupCard
 * también se usa en el Home y no se quiso tocar esa pantalla acá.
 *
 * 4.9b agrega búsqueda por título + filtros de rol/fecha, mismo patrón
 * que MeetupHistoryScreen (buscador + botón de filtros + bottom sheet).
 * Se replican los componentes chico (FilterChip, ActiveFilterChip) y
 * helpers de fecha localmente en vez de importarlos: no están exportados
 * desde MeetupHistoryScreen, y aunque lo estuvieran, es una pantalla de
 * otro feature — no se quiso acoplarlas por un detalle de UI. No se
 * repite el filtro de "Estado" del historial individual porque acá ya
 * lo resuelven los tabs Próximas/Historial.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  RefreshControl,
  Animated,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
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
import { AppButton } from '@/shared/components/AppButton';
import { AppTabBar } from '@/shared/components/AppTabBar';
import { MeetupCard } from '@/features/meetups/components/MeetupCard';
import { MeetupCardSkeleton } from '@/features/meetups/components/MeetupCardSkeleton';
import { useGroupMeetups } from '../hooks/useGroupMeetups';
import type { MainStackParamList } from '@/navigation/types';
import type {
  MeetupWithRole,
  MeetupStatus,
  ParticipantRole,
} from '@/features/meetups/types';

type NavProp = NativeStackNavigationProp<MainStackParamList, 'GroupMeetups'>;
type RoutePropType = RouteProp<MainStackParamList, 'GroupMeetups'>;

/** Tab seleccionado dentro de esta pantalla */
type GroupMeetupsTab = 'upcoming' | 'history';

/** Statuses que caen dentro del tab "Historial" */
type HistoryStatus = Extract<MeetupStatus, 'finished' | 'cancelled'>;

/** Filtro de rol: todas o un rol concreto */
type RoleFilter = 'all' | ParticipantRole;

/** Estado de los filtros avanzados aplicados sobre el tab activo */
interface GroupMeetupFilters {
  /** Array vacío equivale a "Todas" — sin filtro por estado */
  statuses: MeetupStatus[];
  role: RoleFilter;
  dateFrom: Date | null;
  dateTo: Date | null;
}

/** Filtros por defecto — sin restricciones */
const DEFAULT_FILTERS: GroupMeetupFilters = {
  statuses: [],
  role: 'all',
  dateFrom: null,
  dateTo: null,
};

/**
 * Opciones individuales de estado — selección múltiple, solo relevantes
 * en el tab "Historial" (que mezcla finished + cancelled). No incluye
 * "Activas": en el tab "Próximas" ya es el único status posible (esa
 * opción sería 100% redundante con el tab), y en "Historial" nunca
 * aparecen juntadas activas — ofrecerla ahí solo generaría un filtro
 * que siempre da "Sin resultados". Ver 4.9c en el prompt del bloque.
 */
const STATUS_INDIVIDUAL_OPTIONS: { value: HistoryStatus; label: string }[] = [
  { value: 'finished', label: 'Finalizadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

/**
 * Alterna un estado en el filtro draft. "Todas" limpia el array; las
 * opciones individuales se agregan o quitan. Array vacío = sin filtro.
 * Duplicado de MeetupHistoryScreen.toggleStatusSelection (no exportado).
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

/**
 * Convierte la fecha de la juntada (YYYY-MM-DD) a Date local sin hora.
 * Duplicado de MeetupHistoryScreen.parseMeetupDate (no exportado).
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
 * Duplicado de MeetupHistoryScreen.formatFilterDate (no exportado).
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

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Chip seleccionable con transición suave de color al activarse.
 * Copiado de MeetupHistoryScreen.FilterChip (no exportado).
 */
const FilterChip = ({ label, selected, onPress }: FilterChipProps) => {
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  React.useEffect(() => {
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
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.filterChipPressed}>
      <Animated.View style={[styles.filterChip, { backgroundColor, borderColor }]}>
        <Animated.Text style={[styles.filterChipText, { color }]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

interface ActiveFilterChipProps {
  label: string;
  onRemove: () => void;
}

/** Chip de filtro activo con botón X. Copiado de MeetupHistoryScreen.ActiveFilterChip. */
const ActiveFilterChip = ({ label, onRemove }: ActiveFilterChipProps) => (
  <View style={styles.activeFilterChip}>
    <Text style={styles.activeFilterChipText}>{label}</Text>
    <Pressable
      onPress={onRemove}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityLabel={`Quitar filtro ${label}`}
      style={({ pressed }) => pressed && styles.activeFilterChipRemovePressed}
    >
      <Ionicons name="close" size={14} color={theme.colors.primary} />
    </Pressable>
  </View>
);

/**
 * Config visual del badge de estado para el tab "Historial".
 * Mismo texto/colores que STATUS_CONFIG de MeetupHistoryScreen.tsx,
 * pero copiado a propósito en vez de importado: son pantallas de
 * features distintas y no queremos acoplarlas por un detalle visual.
 */
const HISTORY_STATUS_CONFIG: Record<
  HistoryStatus,
  { label: string; bgColor: string; textColor: string }
> = {
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

/** Badge de estado mostrado arriba de cada card del tab "Historial" */
const HistoryStatusBadge = ({ status }: { status: HistoryStatus }) => {
  const config = HISTORY_STATUS_CONFIG[status];
  return (
    <View style={[styles.historyBadge, { backgroundColor: config.bgColor }]}>
      <Text style={[styles.historyBadgeText, { color: config.textColor }]}>
        {config.label}
      </Text>
    </View>
  );
};

export const GroupMeetupsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { groupId, groupName } = route.params ?? {};

  const { meetups, isLoading, error, refresh } = useGroupMeetups(groupId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<GroupMeetupsTab>('upcoming');

  const filterSheetRef = useRef<BottomSheetModal>(null);
  const searchInputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [focusedDatePicker, setFocusedDatePicker] = useState<'from' | 'to' | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<GroupMeetupFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<GroupMeetupFilters>(DEFAULT_FILTERS);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  // groupService.getGroupMeetups ya devuelve todo ordenado por fecha
  // descendente (más reciente primero) — para "Próximas" se invierte
  // acá para que la más cercana en el tiempo aparezca primero.
  const upcomingMeetups = useMemo(
    () => meetups.filter((m) => m.status === 'active').reverse(),
    [meetups],
  );

  const historyMeetups = useMemo(
    () => meetups.filter((m) => m.status === 'finished' || m.status === 'cancelled'),
    [meetups],
  );

  const visibleMeetups: MeetupWithRole[] =
    activeTab === 'upcoming' ? upcomingMeetups : historyMeetups;

  /** Búsqueda por título + filtros de estado/rol/fecha, combinados con AND, sobre el tab activo */
  const filteredMeetups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return visibleMeetups.filter((meetup) => {
      if (query && !meetup.title.toLowerCase().includes(query)) {
        return false;
      }
      if (
        appliedFilters.statuses.length > 0 &&
        !appliedFilters.statuses.includes(meetup.status)
      ) {
        return false;
      }
      if (appliedFilters.role !== 'all' && meetup.userRole !== appliedFilters.role) {
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
  }, [visibleMeetups, searchQuery, appliedFilters]);

  /** Chips de filtros activos derivados del estado aplicado */
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (appliedFilters.statuses.length > 0) {
      const statusLabels = appliedFilters.statuses
        .map(
          (status) =>
            STATUS_INDIVIDUAL_OPTIONS.find((o) => o.value === status)?.label ?? status,
        )
        .join(', ');
      chips.push({
        key: 'status',
        label: `Estado: ${statusLabels}`,
        onRemove: () => setAppliedFilters((prev) => ({ ...prev, statuses: [] })),
      });
    }

    if (appliedFilters.role !== 'all') {
      const option = ROLE_FILTER_OPTIONS.find((o) => o.value === appliedFilters.role);
      chips.push({
        key: 'role',
        label: `Rol: ${option?.label ?? appliedFilters.role}`,
        onRemove: () => setAppliedFilters((prev) => ({ ...prev, role: 'all' })),
      });
    }

    if (appliedFilters.dateFrom) {
      chips.push({
        key: 'dateFrom',
        label: `Desde: ${formatFilterDate(appliedFilters.dateFrom)}`,
        onRemove: () => setAppliedFilters((prev) => ({ ...prev, dateFrom: null })),
      });
    }

    if (appliedFilters.dateTo) {
      chips.push({
        key: 'dateTo',
        label: `Hasta: ${formatFilterDate(appliedFilters.dateTo)}`,
        onRemove: () => setAppliedFilters((prev) => ({ ...prev, dateTo: null })),
      });
    }

    return chips;
  }, [appliedFilters]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  const blurSearch = useCallback(() => {
    searchInputRef.current?.blur();
    Keyboard.dismiss();
    setIsSearchFocused(false);
  }, []);

  /**
   * Cambia de tab y limpia el filtro de Estado — es el único filtro
   * redundante con los tabs (Próximas = solo 'active', Historial =
   * 'finished'/'cancelled'). Sin este reset, un filtro de Estado
   * elegido en un tab quedaría aplicado sin sentido al pasar al otro
   * (ej. "Finalizadas" en Próximas, que nunca matchea nada ahí) y sin
   * forma de corregirlo desde el sheet, porque la sección "Estado" ni
   * siquiera se muestra fuera de "Historial".
   */
  const changeTab = (tab: GroupMeetupsTab) => {
    setActiveTab(tab);
    setAppliedFilters((prev) => ({ ...prev, statuses: [] }));
    setDraftFilters((prev) => ({ ...prev, statuses: [] }));
  };

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

  const handleDateFromChange = (event: DateTimePickerEvent, date?: Date) => {
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const goToCreateMeetup = () =>
    navigation.navigate(Routes.CreateMeetup, { groupId, groupName });

  const showSkeleton = isLoading && meetups.length === 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Juntadas</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
            onPress={() => changeTab('upcoming')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'upcoming' && styles.tabButtonTextActive,
              ]}
            >
              Próximas
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
            onPress={() => changeTab('history')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'history' && styles.tabButtonTextActive,
              ]}
            >
              Historial
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
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
                accessibilityLabel={isSearchFocused ? 'Cerrar búsqueda' : 'Buscar'}
              >
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={isSearchFocused ? theme.colors.primary : theme.colors.textSecondary}
                />
              </TouchableOpacity>
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.searchClearBtn}
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="close-circle" size={18} color={theme.colors.textDisabled} />
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
                size={22}
                color={
                  activeFilterChips.length > 0 ? theme.colors.surface : theme.colors.primary
                }
              />
            </Pressable>
          </View>

          {activeFilterChips.length > 0 && (
            <View style={styles.activeFiltersWrap}>
              {activeFilterChips.map((chip) => (
                <ActiveFilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={blurSearch}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={40} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => void refresh()} activeOpacity={0.7}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : showSkeleton ? (
          <>
            <MeetupCardSkeleton />
            <MeetupCardSkeleton />
          </>
        ) : visibleMeetups.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons
                name={activeTab === 'upcoming' ? 'calendar-outline' : 'time-outline'}
                size={48}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming'
                ? 'No hay juntadas próximas'
                : 'Todavía no hay historial'}
            </Text>
            {activeTab === 'upcoming' && (
              <>
                <Text style={styles.emptySubtitle}>
                  Creá la primera e invitá a todo el grupo automáticamente.
                </Text>
                <View style={styles.emptyButtonWrapper}>
                  <AppButton label="+ Crear juntada" onPress={goToCreateMeetup} />
                </View>
              </>
            )}
          </View>
        ) : filteredMeetups.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="search-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptySubtitle}>
              Probá con otro texto de búsqueda o cambiá los filtros.
            </Text>
          </View>
        ) : (
          filteredMeetups.map((meetup) => (
            <View key={meetup.id}>
              {activeTab === 'history' && (
                <HistoryStatusBadge status={meetup.status as HistoryStatus} />
              )}
              <MeetupCard
                meetup={meetup}
                onPress={() => {
                  blurSearch();
                  navigation.navigate(Routes.MeetupDetail, { meetupId: meetup.id });
                }}
              />
            </View>
          ))
        )}
      </ScrollView>

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

      <BottomSheetModal
        ref={filterSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Filtros</Text>

          {/*
            Estado solo tiene sentido en "Historial" (mezcla finished +
            cancelled). En "Próximas" ya es 100% activas por el tab —
            mostrar el filtro ahí sería puramente redundante.
          */}
          {activeTab === 'history' && (
            <>
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
                        statuses: toggleStatusSelection(prev.statuses, option.value),
                      }))
                    }
                  />
                ))}
              </View>
            </>
          )}

          <Text style={styles.sheetSectionTitle}>Rol</Text>
          <View style={styles.chipRow}>
            {ROLE_FILTER_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={draftFilters.role === option.value}
                onPress={() => setDraftFilters((prev) => ({ ...prev, role: option.value }))}
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
                  {draftFilters.dateFrom ? formatFilterDate(draftFilters.dateFrom) : 'Elegir fecha'}
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
                    focusedDatePicker === 'to' ? theme.colors.primary : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.datePickerBtnText,
                    !draftFilters.dateTo && styles.datePickerPlaceholder,
                  ]}
                >
                  {draftFilters.dateTo ? formatFilterDate(draftFilters.dateTo) : 'Elegir fecha'}
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
            <AppButton label="Limpiar filtros" variant="ghost" onPress={clearDraftFilters} />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    backgroundColor: theme.colors.surface,
    zIndex: 3,
    elevation: 4,
  },
  searchDismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
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
    minWidth: 48,
    minHeight: 48,
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
    width: 48,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    padding: 4,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: theme.colors.surface,
  },
  historyBadge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    marginBottom: theme.spacing.xs,
  },
  historyBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  errorBox: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  emptyButtonWrapper: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
});
