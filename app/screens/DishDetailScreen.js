import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Linking, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, shadow } from '../utils/colors';
import { getEnrichedDishDetails } from '../services/api';

const { width } = Dimensions.get('window');

export default function DishDetailScreen({ route, navigation }) {
    const { dish } = route.params;
    const [enrichedData, setEnrichedData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchEnrichedData = async () => {
            try {
                const data = await getEnrichedDishDetails(dish.id);
                if (isMounted) setEnrichedData(data);
            } catch (error) {
                console.error("Failed to enrich dish:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchEnrichedData();
        return () => { isMounted = false; };
    }, [dish.id]);

    // Helper to parse ingredients safely
    const getIngredients = (ingData) => {
        if (!ingData) return ['Ingredientes tradicionales'];
        if (Array.isArray(ingData)) return ingData;
        if (typeof ingData === 'string') {
            try {
                const formatted = ingData.includes("'") ? ingData.replace(/'/g, '"') : ingData;
                const parsed = JSON.parse(formatted);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                return ingData.split(',').map(i => i.trim());
            }
        }
        return ['Ingredientes tradicionales'];
    };

    const ingredients = getIngredients(dish.ingredients);
    const calories = dish.calories || 450;
    const price = dish.price || 25000;
    
    const culturalDesc = enrichedData?.cultural_desc || dish.culturalDesc || dish.description || "Plato tradicional de la región.";
    const aiIngredients = enrichedData?.main_ingredients;

    const reviews = enrichedData?.reviews || [
        { id: 1, user: 'Ana M.', rating: 5, comment: '¡Delicioso! Sabe igual al de mi abuela.' },
        { id: 2, user: 'Carlos R.', rating: 4, comment: 'Muy bueno, pero la porción es gigante.' }
    ];

    const handleOpenMaps = () => {
        const query = encodeURIComponent(dish.restaurant + " Tunja");
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: dish.image }} style={styles.image} resizeMode="cover" />
                    <View style={styles.overlay} />
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="heart-outline" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="share-social-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.body}>
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{dish.name}</Text>
                            <Text style={styles.restaurant}>{dish.restaurant}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                                <Text style={styles.ratingText}>{dish.rating}</Text>
                            </View>
                            <Text style={styles.reviewCount}>(128 reseñas)</Text>
                        </View>
                    </View>

                    <View style={styles.badgesRow}>
                        {dish.isRegional && (
                            <View style={[styles.badge, { backgroundColor: '#E6FFFA' }]}>
                                <MaterialCommunityIcons name="medal" size={16} color={colors.primary} />
                                <Text style={[styles.badgeText, { color: colors.primary }]}>Auténtico Boyacense</Text>
                            </View>
                        )}
                        <View style={[styles.badge, { backgroundColor: '#FFFBEB' }]}>
                            <MaterialCommunityIcons name="fire" size={16} color={colors.secondary} />
                            <Text style={[styles.badgeText, { color: colors.secondary }]}>{calories} kcal</Text>
                        </View>
                    </View>

                    <Text style={styles.price}>${price.toLocaleString()}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Historia & Cultura</Text>
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
                    ) : (
                        <Text style={styles.description}>{culturalDesc}</Text>
                    )}

                    <Text style={styles.sectionTitle}>Ingredientes Principales</Text>
                    {loading ? (
                         <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
                    ) : aiIngredients ? (
                        <Text style={styles.description}>{aiIngredients}</Text>
                    ) : (
                        <View style={styles.ingredientsContainer}>
                            {ingredients.map((ing, index) => (
                                <View key={index} style={styles.ingredientChip}>
                                    <Text style={styles.ingredientText}>{ing}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Reseñas</Text>
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
                    ) : (
                        reviews.map((review, index) => (
                            <View key={review.id || index} style={styles.reviewItem}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewUser}>{review.user}</Text>
                                    <View style={{ flexDirection: 'row' }}>
                                        {[...Array(5)].map((_, i) => (
                                            <Ionicons 
                                                key={i} 
                                                name={i < review.rating ? "star" : "star-outline"} 
                                                size={12} 
                                                color="#FFD700" 
                                            />
                                        ))}
                                    </View>
                                </View>
                                <Text style={styles.reviewComment}>{review.comment}</Text>
                            </View>
                        ))
                    )}

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            <View style={[styles.footer, shadow.medium]}>
                <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
                    <Ionicons name="map" size={24} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
                    <Text style={styles.ctaText}>Reservar Mesa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 80 },
    imageContainer: { width: width, height: 350, position: 'relative' },
    image: { width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
    backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
    headerActions: { position: 'absolute', top: 50, right: 20, flexDirection: 'row', gap: 12 },
    actionButton: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
    body: { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -40, padding: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    title: { fontSize: 26, fontWeight: 'bold', color: colors.text.primary, marginBottom: 4 },
    restaurant: { fontSize: 16, color: colors.text.secondary, fontWeight: '500' },
    ratingContainer: { alignItems: 'flex-end' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9C4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 4 },
    ratingText: { marginLeft: 4, fontWeight: 'bold', color: '#F59E0B' },
    reviewCount: { fontSize: 12, color: colors.text.light },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    price: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 16 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 12 },
    description: { fontSize: 15, lineHeight: 24, color: colors.text.secondary },
    ingredientsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    ingredientChip: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    ingredientText: { fontSize: 14, color: colors.text.secondary },
    reviewItem: { backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    reviewUser: { fontWeight: '600', color: colors.text.primary },
    reviewComment: { fontSize: 14, color: colors.text.secondary, fontStyle: 'italic' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: 16 },
    mapButton: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.primary },
    ctaButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center', height: 56 },
    ctaText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
