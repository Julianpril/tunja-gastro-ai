import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, StatusBar, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../utils/colors';
import DishCard from '../components/DishCard';
import FilterChip from '../components/FilterChip';
import { getRecommendations } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.6;
const CARD_MARGIN = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

const FILTERS = ['Recomendado', 'Sin Carne', 'Sin Gluten', 'Regionales', 'Económico'];

export default function HomeScreen({ navigation }) {
    const [selectedFilter, setSelectedFilter] = useState('Recomendado');
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Viajero');
    const greetingTime = new Date().getHours() < 12 ? 'Buenos días' : 'Buenas tardes';

    useEffect(() => {
        loadUserData();
        loadRecommendations(selectedFilter);
    }, [selectedFilter]); // Reload when filter changes

    const loadUserData = async () => {
        try {
            const name = await AsyncStorage.getItem('userName');
            if (name) setUserName(name.split(' ')[0]); // Get first name
        } catch (e) {
            console.log('Error loading user name', e);
        }
    };

    const loadRecommendations = async (filter) => {
        setLoading(true);
        try {
            const data = await getRecommendations(filter);
            // Map API response to UI model
            const mappedData = data.map(item => ({
                ...item,
                image: item.image_url,
                restaurant: item.restaurant ? item.restaurant.name : "Restaurante Local" 
            }));
            setDishes(mappedData);
        } catch (error) {
            console.error("Failed to load dishes", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePressDish = (dish) => {
        navigation.navigate('DishDetail', { dish });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{greetingTime}, {userName}! 👋</Text>
                        <Text style={styles.subtitle}>¿Qué se te antoja hoy?</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.profileBtn}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Image
                            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                            style={styles.avatar}
                        />
                    </TouchableOpacity>
                </View>

                {/* Search Bar Placeholder */}
                <TouchableOpacity style={styles.searchBar} activeOpacity={0.8} onPress={() => navigation.navigate('Explorar')}>
                    <Ionicons name="search" size={20} color={colors.text.secondary} />
                    <Text style={styles.placeholderText}>Buscar restaurantes, platos...</Text>
                </TouchableOpacity>

                {/* Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersList}>
                    {FILTERS.map((filter) => (
                        <FilterChip
                            key={filter}
                            label={filter}
                            isSelected={selectedFilter === filter}
                            onPress={() => setSelectedFilter(filter)}
                        />
                    ))}
                </ScrollView>

                {/* Recommendations Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recomendado para ti</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Explorar')}>
                            <Text style={styles.seeAll}>Ver todo</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            style={styles.carouselScrollView}
                            contentContainerStyle={styles.carouselContent}
                            snapToInterval={SNAP_INTERVAL}
                            decelerationRate="fast"
                            snapToAlignment="start"
                        >
                            {dishes.map((dish, index) => (
                                <DishCard
                                    key={dish.id}
                                    dish={dish}
                                    onPress={() => handlePressDish(dish)}
                                    isLast={index === dishes.length - 1}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Map Preview Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cerca de ti</Text>
                    <TouchableOpacity style={[styles.mapContainer, shadow.small]} activeOpacity={0.9} onPress={() => navigation.navigate('Explorar', { viewMode: 'map' })}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=600&q=80' }} // Generic map placeholder
                            style={styles.mapImage}
                        />
                        <View style={styles.mapOverlay}>
                            <View style={styles.mapButton}>
                                <Ionicons name="map" size={16} color={colors.text.inverse} />
                                <Text style={styles.mapButtonText}>Explorar Mapa</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    subtitle: {
        fontSize: 16,
        color: colors.text.secondary,
        marginTop: 4,
    },
    profileBtn: {
        ...shadow.small,
        backgroundColor: colors.surface,
        padding: 2,
        borderRadius: 25,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    placeholderText: {
        marginLeft: 12,
        color: colors.text.light,
        fontSize: 15,
    },
    filtersList: {
        marginBottom: 32,
        maxHeight: 50,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    seeAll: {
        color: colors.primary,
        fontWeight: '600',
    },
    carouselScrollView: {
        marginHorizontal: -24, // Extend to screen edges
    },
    carouselContent: {
        paddingHorizontal: 24, // Add padding back to content
        paddingRight: 8, // Adjust right padding
    },
    mapContainer: {
        height: 160,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        position: 'relative',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapButton: {
        flexDirection: 'row',
        backgroundColor: colors.secondary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
        ...shadow.medium,
    },
    mapButtonText: {
        color: colors.text.inverse,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});
