import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../utils/colors';
import { getRecommendations } from '../services/api';

export const ExploreScreen = ({ navigation }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load initial data
        searchFood('');
    }, []);

    const searchFood = async (text) => {
        setQuery(text);
        setLoading(true);
        // In a real app, hit a search endpoint. For now, we reuse getRecommendations to simulate results
        try {
            const data = await getRecommendations();
            
            // Map data to ensure flat structure for UI
            const mappedData = data.map(item => ({
                ...item,
                image: item.image_url || item.image, // Handle both cases
                restaurant: item.restaurant?.name || "Restaurante Local"
            }));

            // Simple client-side filtering simulation
            const filtered = mappedData.filter(d => 
                d.name.toLowerCase().includes(text.toLowerCase()) || 
                d.restaurant.toLowerCase().includes(text.toLowerCase())
            );
            setResults(filtered);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
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
                <Text style={styles.cardSubtitle}>{item.restaurant}</Text>
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
                <Text style={styles.title}>Explorar</Text>
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
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={{ color: colors.text.secondary }}>No se encontraron resultados</Text>
                        </View>
                    }
                />
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
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text.primary,
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
});
