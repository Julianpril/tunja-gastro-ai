import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotifications() {
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Permission for notifications not granted');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
        });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await AsyncStorage.setItem('pushToken', token);
    return token;
}

// Schedule a daily lunch recommendation notification
export async function scheduleLunchNotification() {
    // Cancel existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const messages = [
        '¿Ya pensaste en dónde almorzar? Descubre platos regionales de Tunja',
        '¡Hora de almorzar! Encuentra restaurantes cerca de ti',
        '¿Se te antoja algo típico boyacense? Mira nuestras recomendaciones',
        '¡Buen provecho! Encuentra los mejores platos de Tunja hoy',
    ];

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    await Notifications.scheduleNotificationAsync({
        content: {
            title: '🍽️ Tunja Gastro AI',
            body: randomMsg,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 12,
            minute: 0,
        },
    });
}

// Send an instant local notification
export async function sendLocalNotification(title, body) {
    await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null, // immediate
    });
}
