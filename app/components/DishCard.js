import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../utils/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.6;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop';

export default function DishCard({ dish, onPress }) {
    // Fallback image if url is missing or still a placeholder
    const raw = dish.image || dish.image_url;
    const isPlaceholder = !raw || raw.includes('via.placeholder.com');
    const imageSource = { uri: isPlaceholder ? FALLBACK_IMAGE : raw };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={[styles.container, shadow.medium]}
        >
            <Image source={imageSource} style={styles.image} resizeMode="cover" />

            {/* Gradient Overlay for text readability */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <Text style={styles.name} numberOfLines={1}>{dish.name}</Text>
                    <Text style={styles.restaurant}>{dish.restaurant}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text style={styles.ratingText}>{dish.rating}</Text>
                        </View>

                        {dish.isRegional && (
                            <View style={styles.regionalBadge}>
                                <Ionicons name="flag" size={12} color={colors.text.inverse} />
                                <Text style={styles.regionalText}>Regional</Text>
                            </View>
                        )}
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.3,
        backgroundColor: colors.surface,
        borderRadius: 24,
        marginRight: 16,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: 16,
    },
    content: {
        justifyContent: 'flex-end',
    },
    name: {
        color: colors.text.inverse,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    restaurant: {
        color: '#E5E7EB',
        fontSize: 14,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
        backdropFilter: 'blur(5px)', // Works on iOS
    },
    ratingText: {
        color: colors.text.inverse,
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    regionalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    regionalText: {
        color: colors.text.inverse,
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
        textTransform: 'uppercase'
    }
});
