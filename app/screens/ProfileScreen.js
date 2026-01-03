import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../utils/colors';
import { getUserProfile, logout } from '../services/api';

export default function ProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [preferences, setPreferences] = useState({
        vegetarian: false,
        vegan: false,
        petFriendly: true,
        budget: false, 
    });

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const userData = await getUserProfile();
            setUser(userData);
            
            if (userData.restrictions) {
                const restrictions = userData.restrictions.toLowerCase();
                setPreferences(prev => ({
                    ...prev,
                    vegetarian: restrictions.includes('vegetariano'),
                    vegan: restrictions.includes('vegano'),
                    petFriendly: restrictions.includes('pet') || prev.petFriendly,
                }));
            }
            
            if (userData.budget && userData.budget < 50000) {
                 setPreferences(prev => ({ ...prev, budget: true }));
            }

        } catch (error) {
            console.error("Failed to load profile", error);
            Alert.alert("Error", "No se pudo cargar el perfil");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    const toggleSwitch = (key) => setPreferences(p => ({ ...p, [key]: !p[key] }));

    const HistoryItem = ({ name, date, rating }) => (
        <View style={styles.historyItem}>
            <View style={styles.historyIcon}>
                <Ionicons name="restaurant" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.historyName}>{name}</Text>
                <Text style={styles.historyDate}>{date}</Text>
            </View>
            <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>{rating}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header Profile */}
                <View style={styles.header}>
                    <Image
                        source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{user?.name || 'Usuario'}</Text>
                    <Text style={styles.email}>{user?.email || 'correo@ejemplo.com'}</Text>
                    <TouchableOpacity style={styles.editBtn}>
                        <Text style={styles.editBtnText}>Editar Perfil</Text>
                    </TouchableOpacity>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mis Preferencias</Text>
                    <View style={[styles.card, shadow.small]}>
                        <View style={styles.prefRow}>
                            <Text style={styles.prefLabel}>Vegetariano</Text>
                            <Switch
                                trackColor={{ false: "#767577", true: colors.primary }}
                                thumbColor={colors.surface}
                                onValueChange={() => toggleSwitch('vegetarian')}
                                value={preferences.vegetarian}
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.prefRow}>
                            <Text style={styles.prefLabel}>Pet Friendly</Text>
                            <Switch
                                trackColor={{ false: "#767577", true: colors.primary }}
                                thumbColor={colors.surface}
                                onValueChange={() => toggleSwitch('petFriendly')}
                                value={preferences.petFriendly}
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.prefRow}>
                            <Text style={styles.prefLabel}>Bajo Presupuesto</Text>
                            <Switch
                                trackColor={{ false: "#767577", true: colors.primary }}
                                thumbColor={colors.surface}
                                onValueChange={() => toggleSwitch('budget')}
                                value={preferences.budget}
                            />
                        </View>
                    </View>
                </View>

                {/* History Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historial de Visitas</Text>
                    <View style={[styles.card, shadow.small]}>
                        {user?.reviews && user.reviews.length > 0 ? (
                            user.reviews.map((review, index) => (
                                <React.Fragment key={review.id}>
                                    <HistoryItem 
                                        name={review.restaurant?.name || review.dish?.name || "Restaurante"} 
                                        date={review.created_at ? new Date(review.created_at).toLocaleDateString() : "Reciente"} 
                                        rating={review.rating.toFixed(1)} 
                                    />
                                    {index < user.reviews.length - 1 && <View style={styles.divider} />}
                                </React.Fragment>
                            ))
                        ) : (
                            <Text style={{ padding: 16, color: colors.text.secondary, textAlign: 'center' }}>
                                No tienes visitas registradas aún.
                            </Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    email: {
        fontSize: 14,
        color: colors.text.secondary,
        marginBottom: 16,
    },
    editBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    editBtnText: {
        color: colors.text.primary,
        fontWeight: '600',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
    },
    prefRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    prefLabel: {
        fontSize: 16,
        color: colors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 8,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
    },
    historyDate: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginLeft: 4,
    },
    logoutBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 8,
    },
    logoutText: {
        color: colors.error,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
