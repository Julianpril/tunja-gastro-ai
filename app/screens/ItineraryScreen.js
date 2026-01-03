import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../utils/colors';

export default function ItineraryScreen() {
    const [selectedDay, setSelectedDay] = useState(1);

    const ActivityCard = ({ time, title, type, image }) => (
        <View style={styles.activityContainer}>
            <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{time}</Text>
                <View style={styles.line} />
                <View style={styles.dot} />
            </View>
            <View style={[styles.card, shadow.small]}>
                <Image source={{ uri: image }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                    <Text style={styles.typeText}>{type}</Text>
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Mi Itinerario</Text>
                <Text style={styles.subtitle}>Plan sugerido para tu estadía</Text>
            </View>

            {/* Day Selector */}
            <View style={styles.daySelector}>
                {[1, 2, 3].map(day => (
                    <TouchableOpacity
                        key={day}
                        style={[styles.dayChip, selectedDay === day && styles.dayChipSelected]}
                        onPress={() => setSelectedDay(day)}
                    >
                        <Text style={[styles.dayText, selectedDay === day && styles.dayTextSelected]}>
                            Día {day}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.timeline}>
                {selectedDay === 1 ? (
                    <>
                        <ActivityCard
                            time="09:00 AM"
                            type="Desayuno"
                            title="Caldo de Costilla en El Mercado"
                            image="https://cdn.colombia.com/gastronomia/2011/08/25/caldo-de-costilla-3663.jpg"
                        />
                        <ActivityCard
                            time="01:00 PM"
                            type="Almuerzo"
                            title="Cocido Boyacense Tradicional"
                            image="https://i.pinimg.com/736x/8a/cc/b5/8accb5f4c540da11504990928701021d.jpg"
                        />
                        <ActivityCard
                            time="04:00 PM"
                            type="Snack"
                            title="Amasijos y Agua de Panela"
                            image="https://i0.wp.com/lanotaeconomica.com.co/wp-content/uploads/2022/06/almojabana.jpg"
                        />
                        <ActivityCard
                            time="07:30 PM"
                            type="Cena"
                            title="Restaurante La Pila del Mono"
                            image="https://media-cdn.tripadvisor.com/media/photo-s/1a/0c/33/8f/fachada.jpg"
                        />
                    </>
                ) : (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>Planificando sugerencias para el Día {selectedDay}...</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    subtitle: {
        fontSize: 16,
        color: colors.text.secondary,
    },
    daySelector: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    dayChip: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surface,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dayChipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dayText: {
        fontWeight: '600',
        color: colors.text.secondary,
    },
    dayTextSelected: {
        color: colors.text.inverse,
    },
    timeline: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    activityContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    timeColumn: {
        width: 70,
        alignItems: 'center',
        marginRight: 12,
    },
    timeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.text.secondary,
        marginBottom: 8,
    },
    line: {
        flex: 1,
        width: 2,
        backgroundColor: colors.border,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.secondary,
        position: 'absolute',
        top: 25,
        right: -16,
        zIndex: 1,
    },
    card: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        height: 80,
    },
    cardImage: {
        width: 80,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    typeText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.text.light,
        fontStyle: 'italic',
    }
});
