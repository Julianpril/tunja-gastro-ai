import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import AppNavigator from './navigation/AppNavigator';
import { colors } from './utils/colors';
import { registerForPushNotifications, scheduleLunchNotification } from './services/notifications';

export default function App() {
  useEffect(() => {
    (async () => {
      await registerForPushNotifications();
      await scheduleLunchNotification();
    })();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <AppNavigator />
      <Toast />
    </NavigationContainer>
  );
}
