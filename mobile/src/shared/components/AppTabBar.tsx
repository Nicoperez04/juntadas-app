import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@/shared/constants/theme';
import { Routes } from '@/navigation/routes';
import type { MainStackParamList } from '@/features/meetups/types';

type NavProp = NativeStackNavigationProp<MainStackParamList>;

interface TabDefinition {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabDefinition[] = [
  { id: 'home', label: 'Inicio', icon: 'home-outline', activeIcon: 'home' },
  {
    id: 'create',
    label: 'Crear',
    icon: 'add-circle-outline',
    activeIcon: 'add-circle',
  },
  {
    id: 'join',
    label: 'Unirse',
    icon: 'enter-outline',
    activeIcon: 'enter',
  },
  {
    id: 'games',
    label: 'Juegos',
    icon: 'game-controller-outline',
    activeIcon: 'game-controller',
  },
  {
    id: 'profile',
    label: 'Perfil',
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

interface AppTabBarProps {
  activeTab?: 'home' | 'create' | 'join' | 'games' | 'profile';
}

export const AppTabBar = ({ activeTab = 'home' }: AppTabBarProps) => {
  const navigation = useNavigation<NavProp>();

  const handleTabPress = useCallback(
    (tabId: string) => {
      if (tabId === 'home') navigation.navigate(Routes.MeetupHome);
      if (tabId === 'create') navigation.navigate(Routes.CreateMeetup);
      if (tabId === 'join') navigation.navigate(Routes.JoinMeetup);
      if (tabId === 'games') navigation.navigate(Routes.Games);
      if (tabId === 'profile') navigation.navigate(Routes.Profile);
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.tabSafe} edges={['bottom']}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={
                  isActive ? theme.colors.primary : theme.colors.textSecondary
                }
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabSafe: {
    backgroundColor: theme.colors.surface,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: theme.components.borderWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: theme.typography.sizes.xs - 2,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
});
