import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from '../components/MapView';
import * as Location from 'expo-location';
import { colors, shadow } from '../utils/colors';
import { getRecommendations, searchDishes, getFilteredDishes } from '../services/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop';

const { width, height } = Dimensions.get('window');

const CUISINE_FILTERS = [
    { key: 'all', label: 'Todos' },
    { key: 'regional', label: 'Regionales' },
    { key: 'economico', label: 'Económico' },
    { key: 'top_rated', label: '⭐ 4+' },
    { key: 'colombiana', label: 'Colombiana' },
    { key: 'internacional', label: 'Internacional' },
];

export const ExploreScreen = ({ navigation, route }) => {
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Default to Tunja Plaza de Bolívar
    const [mapRegion, setMapRegion] = useState({
        latitude: 5.5324,
        longitude: -73.3614,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
    });

    useEffect(() => {
        if (route?.params?.viewMode) {
            setViewMode(route.params.viewMode);
        }
    }, [route?.params]);

    useEffect(() => {
        // Load initial data
        applySearch(query, activeFilter);
        // Solicitar permisos y sincronizar mapa con la ubicación del usuario
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permiso de ubicación denegado');
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            setMapRegion({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.0121,
            });
        })();
    }, []);

    useEffect(() => {
        applySearch(query, activeFilter);
    }, [activeFilter]);

    const applySearch = async (text, filter) => {
        setLoading(true);
        try {
            let data;
            const filters = {};
            if (text.trim()) filters.search = text;
            if (filter === 'regional') filters.is_regional = true;
            if (filter === 'economico') filters.price_max = 20000;
            if (filter === 'top_rated') filters.min_rating = 4.0;
            if (filter === 'colombiana') filters.cuisine_type = 'Colombiana';
            if (filter === 'internacional') filters.cuisine_type = 'Internacional';

            const hasFilters = Object.keys(filters).length > 0;
            data = hasFilters ? await getFilteredDishes(filters) : await getRecommendations();

            const mappedData = data.map(item => ({
                ...item,
                image: item.image_url || item.image,
                restaurantName: item.restaurant?.name || "Restaurante Local",
                restaurantData: item.restaurant
            }));
            setResults(mappedData);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const searchFood = (text) => {
        setQuery(text);
        applySearch(text, activeFilter);
    };

    // Consolidar restaurantes para evitar marcadores duplicados
    const getUniqueRestaurants = () => {
        const unique = {};
        results.forEach(item => {
            if (item.restaurantData && item.restaurantData.latitude && item.restaurantData.longitude) {
                // Se usa nombre como llave de deduplicación
                if (!unique[item.restaurantName]) {
                    unique[item.restaurantName] = {
                        ...item.restaurantData,
                        dishes: [item] // Mantener referencia de platos asociados
                    };
                } else {
                    unique[item.restaurantName].dishes.push(item);
                }
            }
        });
        return Object.values(unique);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('DishDetail', { dish: item })}
        >
            <Image source={{ uri: (item.image && !item.image.includes('via.placeholder.com')) ? item.image : FALLBACK_IMAGE }} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.restaurantName}</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Explorar Tunja</Text>
                <TouchableOpacity 
                    style={styles.toggleButton}
                    onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                >
                    <Ionicons 
                        name={viewMode === 'list' ? "map" : "list"} 
                        size={24} 
                        color={colors.primary} 
                    />
                    <Text style={styles.toggleText}>
                        {viewMode === 'list' ? "Ver Mapa" : "Ver Lista"}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.text.secondary} />
                <TextInput
                    style={styles.input}
                    placeholder="Buscar comida, restaurantes..."
                    value={query}
                    onChangeText={searchFood}
                    placeholderTextColor={colors.text.light}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => searchFood('')}>
                        <Ionicons name="close-circle" size={18} color={colors.text.light} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
                {CUISINE_FILTERS.map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                        onPress={() => setActiveFilter(f.key)}
                    >
                        <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : viewMode === 'list' ? (
                <FlatList
                    data={results}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={{ color: colors.text.secondary }}>No se encontraron resultados</Text>
                        </View>
                    }
                />
            ) : (
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        region={mapRegion}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {getUniqueRestaurants().map((rest, index) => (
                            <Marker
                                key={index}
                                coordinate={{
                                    latitude: rest.latitude,
                                    longitude: rest.longitude
                                }}
                                title={rest.name}
                                description={rest.cuisine_type}
                            >
                                <View style={styles.markerContainer}>
                                    <Ionicons name="restaurant" size={20} color="#FFF" />
                                </View>
                            </Marker>
                        ))}
                    </MapView>
                    {/* Floating Card for selected restaurant could go here */}
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    toggleText: {
        marginLeft: 6,
        color: colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: colors.text.primary,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: 20,
        marginBottom: 16,
        ...shadow.small,
    },
    cardImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#eee',
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    cardSubtitle: {
        fontSize: 14,
        color: colors.text.secondary,
        marginTop: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text.primary,
        marginLeft: 4,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    mapContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    markerContainer: {
        backgroundColor: colors.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    filterRow: {
        marginBottom: 12,
        maxHeight: 44,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    filterChipTextActive: {
        color: '#FFF',
    },
});
