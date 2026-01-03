import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import DishDetailScreen from '../screens/DishDetailScreen';

import { MapScreen } from '../screens/Placeholders';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* The main app interface with tabs */}
            <Stack.Screen name="Main" component={BottomTabNavigator} />

            {/* Detail screens that cover the tabs */}
            <Stack.Screen
                name="DishDetail"
                component={DishDetailScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="Mapa"
                component={MapScreen}
                options={{ animation: 'fade_from_bottom' }}
            />
        </Stack.Navigator>
    );
}
