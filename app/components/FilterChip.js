import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, shadow } from '../utils/colors';

export default function FilterChip({ label, isSelected, onPress }) {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            style={[
                styles.container,
                isSelected ? styles.selectedContainer : styles.unselectedContainer,
                isSelected && shadow.small,
            ]}
            onPress={onPress}
        >
            <Text style={[
                styles.text,
                isSelected ? styles.selectedText : styles.unselectedText
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
    },
    selectedContainer: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    unselectedContainer: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
    },
    selectedText: {
        color: colors.text.inverse,
    },
    unselectedText: {
        color: colors.text.secondary,
    },
});
