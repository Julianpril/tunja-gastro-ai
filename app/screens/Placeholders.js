import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';

const PlaceholderScreen = ({ title }) => (
    <View style={styles.container}>
        <Text style={styles.text}>{title}</Text>
        <Text style={styles.subtext}>Próximamente</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 8,
    },
    subtext: {
        fontSize: 16,
        color: colors.text.secondary,
    }
});

// export const ExploreScreen = () => <PlaceholderScreen title="Explorar" />;
export const MapScreen = () => <PlaceholderScreen title="Mapa Full" />;
export const ProfileScreen = () => <PlaceholderScreen title="Mi Perfil" />;
