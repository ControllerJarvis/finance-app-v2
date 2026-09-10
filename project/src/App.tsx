import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { HomeScreen } from './screens/HomeScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LogIncomeScreen } from './screens/LogIncomeScreen';
import { LogExpenseScreen } from './screens/LogExpenseScreen';
import { TransferScreen } from './screens/TransferScreen';
import { CurrencyProvider } from './lib/CurrencyContext';
import { Colors } from './lib/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return (
    <Text style={{ fontSize: size - 4, color, lineHeight: size - 2 }}>{name}</Text>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgElevated,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="🏠" color={color} size={size} />,
          title: 'Home',
        }}
      >
        {({ navigation }) => <HomeScreen navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen
        name="HistoryTab"
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="📊" color={color} size={size} />,
          title: 'History',
        }}
      >
        {({ navigation }) => <HistoryScreen navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen
        name="SettingsTab"
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="⚙" color={color} size={size} />,
          title: 'Settings',
        }}
      >
        {({ navigation }) => <SettingsScreen navigation={navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CurrencyProvider>
          <NavigationContainer
            theme={{
              ...DarkTheme,
              colors: {
                ...DarkTheme.colors,
                background: Colors.bg,
                card: Colors.bgElevated,
                text: Colors.text,
                border: Colors.border,
                primary: Colors.primary,
              },
            }}
          >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Tabs" component={Tabs} />
              <Stack.Screen name="LogIncome" component={LogIncomeScreen} />
              <Stack.Screen name="LogExpense" component={LogExpenseScreen} />
              <Stack.Screen name="Transfer" component={TransferScreen} />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="light" />
        </CurrencyProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
