import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../utils/colors';
import { getUserProfile, updateUserProfile, logout } from '../services/api';
import { clearCacheByPrefix } from '../services/offlineCache';

export default function ProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', age: '', country: '', visit_motive: '' });
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

    const toggleSwitch = async (key) => {
        const newPrefs = { ...preferences, [key]: !preferences[key] };
        setPreferences(newPrefs);
        
        // Build restrictions string from preferences
        const restrictions = [];
        if (key === 'vegetarian' ? !preferences.vegetarian : newPrefs.vegetarian) restrictions.push('Vegetariano');
        if (key === 'vegan' ? !preferences.vegan : newPrefs.vegan) restrictions.push('Vegano');
        if (key === 'petFriendly' ? !preferences.petFriendly : newPrefs.petFriendly) restrictions.push('Pet Friendly');
        
        const newBudget = key === 'budget' ? !preferences.budget : newPrefs.budget;
        
        setSavingPrefs(true);
        try {
            await updateUserProfile({
                restrictions: restrictions.join(', ') || 'Ninguna',
                budget: newBudget ? 40000 : (user?.budget > 50000 ? user.budget : 100000),
            });
            // Invalidate recommendations cache so HomeScreen reloads with new preferences
            await clearCacheByPrefix('recommendations');
        } catch (error) {
            // Revert on error
            setPreferences(preferences);
            Alert.alert('Error', 'No se pudieron guardar las preferencias');
        } finally {
            setSavingPrefs(false);
        }
    };

    const openEditModal = () => {
        setEditForm({
            name: user?.name || '',
            age: user?.age ? String(user.age) : '',
            country: user?.country || '',
            visit_motive: user?.visit_motive || '',
        });
        setEditModalVisible(true);
    };

    const saveProfile = async () => {
        try {
            const updateData = {
                ...editForm,
                age: editForm.age ? parseInt(editForm.age) : undefined,
            };
            const updated = await updateUserProfile(updateData);
            setUser(prev => ({ ...prev, ...updated }));
            setEditModalVisible(false);
            Alert.alert('¡Listo!', 'Perfil actualizado correctamente');
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el perfil');
        }
    };

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
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header Profile */}
                <View style={styles.header}>
                    <Image
                        source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{user?.name || 'Usuario'}</Text>
                    <Text style={styles.email}>{user?.email || 'correo@ejemplo.com'}</Text>
                    <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
                        <Text style={styles.editBtnText}>Editar Perfil</Text>
                    </TouchableOpacity>
                </View>

                {/* Edit Profile Modal */}
                <Modal
                    visible={editModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setEditModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, shadow.medium]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Editar Perfil</Text>
                                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={colors.text.primary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalLabel}>Nombre</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editForm.name}
                                onChangeText={(t) => setEditForm(f => ({ ...f, name: t }))}
                                placeholder="Tu nombre"
                                placeholderTextColor={colors.text.light}
                            />

                            <Text style={styles.modalLabel}>Edad</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editForm.age}
                                onChangeText={(t) => setEditForm(f => ({ ...f, age: t }))}
                                placeholder="Ej: 28"
                                keyboardType="numeric"
                                placeholderTextColor={colors.text.light}
                            />

                            <Text style={styles.modalLabel}>País</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editForm.country}
                                onChangeText={(t) => setEditForm(f => ({ ...f, country: t }))}
                                placeholder="Ej: Colombia"
                                placeholderTextColor={colors.text.light}
                            />

                            <Text style={styles.modalLabel}>Motivo de visita</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editForm.visit_motive}
                                onChangeText={(t) => setEditForm(f => ({ ...f, visit_motive: t }))}
                                placeholder="Ej: Turismo, Negocios"
                                placeholderTextColor={colors.text.light}
                            />

                            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                                <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

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
    backButton: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 4,
        alignSelf: 'flex-start',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.secondary,
        marginBottom: 6,
        marginTop: 12,
    },
    modalInput: {
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.text.primary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 24,
    },
    saveBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
