import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useColorScheme} from 'react-native';

import {HomeScreen} from '../../features/home/HomeScreen';
import {MeaningScreen} from '../../features/meaning/MeaningScreen';
import {RecordsScreen} from '../../features/records/RecordsScreen';
import {SettingsScreen} from '../../features/settings/SettingsScreen';

export type RootTabParamList = {
  Home: undefined;
  Records: undefined;
  Meaning: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppTabs() {
  const isDark = useColorScheme() === 'dark';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#F4F4F0' : '#191919',
        tabBarInactiveTintColor: isDark ? '#797A74' : '#898984',
        tabBarStyle: {
          backgroundColor: isDark ? '#171815' : '#FFFFFF',
          borderTopColor: isDark ? '#2B2C28' : '#E7E7E2',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{tabBarLabel: '홈'}}
      />
      <Tab.Screen
        name="Records"
        component={RecordsScreen}
        options={{tabBarLabel: '기록'}}
      />
      <Tab.Screen
        name="Meaning"
        component={MeaningScreen}
        options={{tabBarLabel: '의미'}}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{tabBarLabel: '설정'}}
      />
    </Tab.Navigator>
  );
}
