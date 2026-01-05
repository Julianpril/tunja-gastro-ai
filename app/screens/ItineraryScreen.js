import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Platform, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../utils/colors';
import { getItinerary } from '../services/api';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function ItineraryScreen() {
    const [selectedDay, setSelectedDay] = useState(1);
    const [itineraryData, setItineraryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchItinerary = async () => {
        setLoading(true);
        try {
            // Request 3 days of itinerary
            const data = await getItinerary(3);
            // Ensure data is an array
            const formattedData = Array.isArray(data) ? data : [data];
            setItineraryData(formattedData);
        } catch (error) {
            console.error("Failed to load itinerary", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchItinerary();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchItinerary();
    };

    const currentDayActivities = itineraryData.find(d => d.day === selectedDay)?.activities || [];

    console.log("Current Day Activities:", JSON.stringify(currentDayActivities, null, 2));

    const ActivityCard = ({ time, title, type, image, description, isLast }) => {
        // Helper to safely render text
        const renderText = (content) => {
            if (content === null || content === undefined) return "";
            if (typeof content === 'string') return content;
            if (typeof content === 'number') return String(content);
            if (typeof content === 'object') {
                return content.name || content.title || content.description || content.text || JSON.stringify(content);
            }
            return String(content);
        };

        const safeTitle = renderText(title);
        const safeType = renderText(type);
        const safeDescription = renderText(description);
        const safeTime = renderText(time);

        return (
            <View style={styles.activityWrapper}>
                {/* Timeline Column */}
                <View style={styles.timelineColumn}>
                    <View style={[styles.timelineDot, { backgroundColor: getTypeColor(safeType) }]} />
                    {!isLast && <View style={styles.timelineLine} />}
                </View>

                {/* Content Column */}
                <View style={styles.contentColumn}>
                    <Text style={styles.timeLabel}>{safeTime}</Text>
                    
                    <View style={[styles.card, shadow.medium]}>
                        <Image 
                            source={{ uri: (typeof image === 'string' ? image : null) || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80' }} 
                            style={styles.cardImage} 
                            resizeMode="cover"
                        />
                        <View style={styles.cardBody}>
                            <View style={styles.typeContainer}>
                                <Text style={[styles.typeTag, { color: getTypeColor(safeType) }]}>{safeType}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{safeTitle}</Text>
                            {safeDescription ? (
                                <Text style={styles.cardDescription} numberOfLines={3}>
                                    {safeDescription}
                                </Text>
                            ) : null}
                            
                            <TouchableOpacity 
                                style={[styles.mapButton, { backgroundColor: getTypeColor(safeType) }]}
                                onPress={() => {
                                    const query = encodeURIComponent(safeTitle + " Tunja");
                                    const url = Platform.select({
                                        ios: `maps:0,0?q=${query}`,
                                        android: `geo:0,0?q=${query}`,
                                        web: `https://www.google.com/maps/search/?api=1&query=${query}`
                                    });
                                    Linking.openURL(url);
                                }}
                            >
                                <Ionicons name="map" size={16} color="#fff" style={{marginRight: 6}} />
                                <Text style={styles.mapButtonText}>Cómo llegar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    // Helper to color-code activities
    const getTypeColor = (type) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('desayuno')) return '#FF9800'; // Orange
        if (t.includes('almuerzo')) return '#4CAF50'; // Green
        if (t.includes('cena')) return '#2196F3'; // Blue
        if (t.includes('snack') || t.includes('café')) return '#795548'; // Brown
        return colors.primary;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Mi Itinerario</Text>
                    <Text style={styles.subtitle}>Descubre Tunja día a día</Text>
                </View>
                <TouchableOpacity onPress={fetchItinerary} style={styles.refreshButton}>
                    <Ionicons name="reload-circle" size={32} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Day Selector */}
            <View style={styles.daySelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelector}>
                    {[1, 2, 3].map(day => (
                        <TouchableOpacity
                            key={day}
                            style={[styles.dayChip, selectedDay === day && styles.dayChipSelected, shadow.small]}
                            onPress={() => setSelectedDay(day)}
                        >
                            <Text style={[styles.dayText, selectedDay === day && styles.dayTextSelected]}>
                                Día {day}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Diseñando tu experiencia gastronómica...</Text>
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {currentDayActivities.length > 0 ? (
                        <View style={styles.timelineContainer}>
                            {currentDayActivities.map((activity, index) => {
                                if (!activity) return null;
                                return (
                                    <ActivityCard
                                        key={index}
                                        time={activity.time}
                                        type={activity.type}
                                        title={activity.title}
                                        image={activity.image}
                                        description={activity.description}
                                        isLast={index === currentDayActivities.length - 1}
                                    />
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.empty}>
                            <Ionicons name="map-outline" size={64} color={colors.text.light} />
                            <Text style={styles.emptyText}>
                                {itineraryData.length > 0 
                                    ? `No hay actividades planeadas para el Día ${selectedDay}` 
                                    : "No se pudo cargar el itinerario.\nVerifica tu conexión y reintenta."}
                            </Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchItinerary}>
                                <Text style={styles.retryText}>Reintentar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text.primary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: colors.text.secondary,
        marginTop: 4,
    },
    refreshButton: {
        padding: 4,
    },
    daySelectorContainer: {
        backgroundColor: '#fff',
        paddingBottom: 12,
        paddingTop: 12,
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.05)',
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 3,
            },
        }),
        zIndex: 10,
    },
    daySelector: {
        paddingHorizontal: 24,
    },
    dayChip: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#F0F2F5',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dayChipSelected: {
        backgroundColor: colors.primary,
        transform: [{ scale: 1.05 }],
    },
    dayText: {
        fontWeight: '600',
        color: colors.text.secondary,
        fontSize: 14,
    },
    dayTextSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    scrollContent: {
        paddingTop: 24,
        paddingBottom: 40,
    },
    timelineContainer: {
        paddingHorizontal: 24,
    },
    activityWrapper: {
        flexDirection: 'row',
        marginBottom: 2, // Spacing handled by content
    },
    timelineColumn: {
        width: 24,
        alignItems: 'center',
        marginRight: 16,
    },
    timelineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#fff',
        marginTop: 6,
        zIndex: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#E0E0E0',
        marginVertical: -2,
    },
    contentColumn: {
        flex: 1,
        paddingBottom: 32,
    },
    timeLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text.secondary,
        marginBottom: 8,
        marginTop: 4,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cardImage: {
        width: '100%',
        height: 140,
        backgroundColor: '#E1E4E8',
    },
    cardBody: {
        padding: 16,
    },
    typeContainer: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    typeTag: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 6,
        lineHeight: 24,
    },
    cardDescription: {
        fontSize: 14,
        color: colors.text.secondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    mapButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    empty: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: 16,
        fontSize: 16,
        lineHeight: 24,
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: colors.primary,
        borderRadius: 24,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        color: colors.text.secondary,
        fontSize: 16,
        fontWeight: '500',
    }
});
