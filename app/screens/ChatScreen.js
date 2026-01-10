import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../utils/colors';
import { getChatResponse } from '../services/api';

const MOCK_CHAT_HISTORY = [
    { id: '1', text: '¡Hola! Soy tu asistente gastronómico de Tunja. 🧑‍🍳 ¿En qué puedo ayudarte hoy?', sender: 'bot' },
];

const QUICK_SUGGESTIONS = [
    { id: 's1', icon: 'restaurant', text: '¿Dónde almorzar?', query: '¿Dónde me recomiendas almorzar hoy? Quiero algo tradicional' },
    { id: 's2', icon: 'map', text: 'Platos regionales', query: '¿Cuáles son los platos más representativos de Tunja?' },
    { id: 's3', icon: 'cash', text: 'Opciones económicas', query: 'Recomiéndame restaurantes económicos en Tunja' },
    { id: 's4', icon: 'pizza', text: 'Comida internacional', query: '¿Dónde puedo comer comida internacional en Tunja?' },
];

export default function ChatScreen() {
    const [messages, setMessages] = useState(MOCK_CHAT_HISTORY);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const flatListRef = useRef(null);

    const sendMessage = async (messageText = null) => {
        const textToSend = (typeof messageText === 'string' ? messageText : null) || inputText;
        
        if (!textToSend || textToSend.trim().length === 0) return;

        const userMsg = { id: Date.now().toString(), text: textToSend, sender: 'user' };
        
        setMessages(current => [...current, userMsg]);
        setInputText('');
        setIsTyping(true);
        setShowSuggestions(false); // Hide suggestions after first message

        try {
            // Send the message and the history (excluding the one we just added locally for display, 
            // or we can pass it if we want. The backend logic appends the current message anyway.
            // So passing 'messages' (current state) is fine as history.
            const response = await getChatResponse(textToSend, messages);
            
            const botResponse = {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: 'bot'
            };
            setMessages(current => [...current, botResponse]);
        } catch (error) {
            console.error(error);
            const errorMsg = {
                id: (Date.now() + 1).toString(),
                text: "Lo siento, no pude conectar con el asistente. Intenta de nuevo.",
                sender: 'bot'
            };
            setMessages(current => [...current, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const renderMessageContent = (text, isUser) => {
        if (isUser) {
            return <Text style={[styles.msgText, styles.userText]}>{text}</Text>;
        }

        // Split by Google Maps link
        const parts = text.split(/(\[Ver en Google Maps\]\(.*?\))/g);
        
        return (
            <View style={{ flexDirection: 'column', flex: 1 }}>
                {parts.map((part, index) => {
                    if (!part) return null;

                    const mapMatch = part.match(/\[Ver en Google Maps\]\((.*?)\)/);
                    if (mapMatch) {
                        const url = mapMatch[1];
                        return (
                            <TouchableOpacity 
                                key={index} 
                                style={styles.mapButton}
                                onPress={() => Linking.openURL(url)}
                            >
                                <Ionicons name="map" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.mapButtonText}>Ver ubicación en Mapa</Text>
                            </TouchableOpacity>
                        );
                    }
                    
                    // Handle bold text: **text**
                    const boldParts = part.split(/(\*\*.*?\*\*)/g);
                    return (
                        <Text key={index} style={[styles.msgText, styles.botText, { marginBottom: 4 }]}>
                            {boldParts.map((subPart, subIndex) => {
                                if (subPart.startsWith('**') && subPart.endsWith('**')) {
                                    return <Text key={subIndex} style={{ fontWeight: 'bold' }}>{subPart.slice(2, -2)}</Text>;
                                }
                                return subPart;
                            })}
                        </Text>
                    );
                })}
            </View>
        );
    };

    const renderItem = ({ item }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.bubble,
                isUser ? styles.userBubble : styles.botBubble,
                isUser ? shadow.small : {}
            ]}>
                {!isUser && (
                    <View style={styles.botIcon}>
                        <Ionicons name="restaurant" size={14} color="white" />
                    </View>
                )}
                {renderMessageContent(item.text, isUser)}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Asistente Tunja AI</Text>
                <Text style={styles.subtitle}>Pregunta sobre historia, platos y más</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {showSuggestions && (
                <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Sugerencias rápidas:</Text>
                    <View style={styles.suggestionsGrid}>
                        {QUICK_SUGGESTIONS.map(suggestion => (
                            <TouchableOpacity
                                key={suggestion.id}
                                style={styles.suggestionChip}
                                onPress={() => sendMessage(suggestion.query)}
                            >
                                <Ionicons name={suggestion.icon} size={18} color={colors.primary} />
                                <Text style={styles.suggestionText}>{suggestion.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {isTyping && (
                <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.typingText}>Escribiendo...</Text>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
                style={styles.inputContainer}
            >
                <TextInput
                    style={styles.input}
                    placeholder="Escribe tu pregunta..."
                    value={inputText}
                    onChangeText={setInputText}
                    placeholderTextColor={colors.text.light}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, inputText.length > 0 && styles.sendBtnActive]}
                    onPress={sendMessage}
                    disabled={inputText.length === 0}
                >
                    <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
            </KeyboardAvoidingView>
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
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    listContent: {
        padding: 24,
        paddingBottom: 20,
    },
    bubble: {
        maxWidth: '80%',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        flexDirection: 'row',
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        alignSelf: 'flex-start',
        backgroundColor: colors.surface,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    msgText: {
        fontSize: 16,
        lineHeight: 22,
    },
    userText: {
        color: 'white',
    },
    botText: {
        color: colors.text.primary,
    },
    botIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        marginTop: -2,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 12,
    },
    typingText: {
        marginLeft: 8,
        color: colors.text.secondary,
        fontSize: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 16,
        marginRight: 12,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.text.light,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnActive: {
        backgroundColor: colors.primary,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 8,
        alignSelf: 'flex-start',
        ...shadow.small,
    },
    mapButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    suggestionsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    suggestionsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.secondary,
        marginBottom: 10,
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.primary,
        marginRight: 8,
        marginBottom: 8,
    },
    suggestionText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
});
