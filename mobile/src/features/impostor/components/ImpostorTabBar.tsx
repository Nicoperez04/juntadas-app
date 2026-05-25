import React from 'react';
import { AppTabBar } from '@/shared/components/AppTabBar';

interface ImpostorTabBarProps {
  activeTabId?: string;
}

export const ImpostorTabBar = ({ activeTabId = 'games' }: ImpostorTabBarProps) => (
  <AppTabBar activeTab={(activeTabId as 'home' | 'create' | 'join' | 'games' | 'profile') ?? 'games'} />
);
