import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

// Web fallback for MapView - shows a placeholder
export const MapViewComponent = ({ style, region, children, ...props }) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.content}>
                <Ionicons name="map-outline" size={64} color={colors.text.light} />
                <Text style={styles.title}>Mapa no disponible en Web</Text>
                <Text style={styles.subtitle}>
                    Usa la aplicación móvil para ver el mapa interactivo
                </Text>
                {region && (
                    <Text style={styles.coordinates}>
                        📍 {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
                    </Text>
                )}
            </View>
        </View>
    );
};

// Marker component placeholder for web
export const Marker = ({ coordinate, title, description, children }) => {
    return null; // Markers are not rendered on web
};

export const PROVIDER_DEFAULT = null;

export default MapViewComponent;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E8E8E8',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        overflow: 'hidden',
    },
    content: {
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text.primary,
        marginTop: 16,
    },
    subtitle: {
        fontSize: 14,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 250,
    },
    coordinates: {
        fontSize: 12,
        color: colors.text.light,
        marginTop: 12,
    },
});
