import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import ChatScreen from '../screens/ChatScreen';
import ItineraryScreen from '../screens/ItineraryScreen';
import { colors, shadow } from '../utils/colors';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 0,
                    elevation: 0,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingTop: 12,
                    ...shadow.small, // Subtle floating effect
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.text.light,
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 10, // Smaller font for 5 tabs
                    fontWeight: '500',
                },
            }}
        >
            <Tab.Screen
                name="Inicio"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Explorar"
                component={ExploreScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Itinerario"
                component={ItineraryScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
