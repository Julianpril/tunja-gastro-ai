import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from '../components/MapView';
import * as Location from 'expo-location';
import { colors, shadow } from '../utils/colors';
import { getRecommendations } from '../services/api';

const { width, height } = Dimensions.get('window');

export const ExploreScreen = ({ navigation }) => {
    const [query, setQuery] = useState('');
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
        // Load initial data
        searchFood('');
        // Get Location
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

    const searchFood = async (text) => {
        setQuery(text);
        setLoading(true);
        try {
            const data = await getRecommendations();
            
            // Map data to ensure flat structure for UI but keep restaurant data
            const mappedData = data.map(item => ({
                ...item,
                image: item.image_url || item.image, 
                restaurantName: item.restaurant?.name || "Restaurante Local",
                restaurantData: item.restaurant // Keep full object for coordinates
            }));

            const filtered = mappedData.filter(d => 
                d.name.toLowerCase().includes(text.toLowerCase()) || 
                d.restaurantName.toLowerCase().includes(text.toLowerCase())
            );
            setResults(filtered);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    // Extract unique restaurants for Map Markers
    const getUniqueRestaurants = () => {
        const unique = {};
        results.forEach(item => {
            if (item.restaurantData && item.restaurantData.latitude && item.restaurantData.longitude) {
                // Use restaurant name as key to deduplicate
                if (!unique[item.restaurantName]) {
                    unique[item.restaurantName] = {
                        ...item.restaurantData,
                        dishes: [item] // Keep track of dishes here if needed
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
            <Image source={{ uri: item.image }} style={styles.cardImage} />
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
    }
});
