import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { initIAP } from './src/engine/iap';
import { initAds } from './src/engine/ads';

import TranslateScreen from './src/screens/TranslateScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import RulesScreen from './src/screens/RulesScreen';
import PhrasesScreen from './src/screens/PhrasesScreen';
import WebTranslateScreen from './src/screens/WebTranslateScreen';

const Tab = createBottomTabNavigator();

const ICONS = { Translate: '🗣', History: '📜', Phrases: '💬', Web: '🌐', Rules: '📖' };

export default function App() {
  useEffect(() => {
    initIAP();
    // UMP consent flow + Mobile Ads SDK init; banners await this promise.
    initAds();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name]}</Text>,
          tabBarStyle: {
            backgroundColor: '#0f0f14',
            borderTopColor: '#2d2d44',
          },
          tabBarActiveTintColor: '#a78bfa',
          tabBarInactiveTintColor: '#4b5563',
          tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
          headerStyle: { backgroundColor: '#0f0f14' },
          headerTintColor: '#e2e8f0',
          headerTitleStyle: { fontWeight: '700' },
        })}
      >
        <Tab.Screen name="Translate" component={TranslateScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Phrases" component={PhrasesScreen} />
        <Tab.Screen name="Web" component={WebTranslateScreen} />
        <Tab.Screen name="Rules" component={RulesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
