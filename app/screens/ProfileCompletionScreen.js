import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ImageBackground, Dimensions } from 'react-native';
import { colors } from '../utils/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Boyacá/Tunja Theme Constants
const THEME = {
  primary: '#009B3A', // Tunja Flag Green
  secondary: '#FFFFFF', // Tunja Flag White
  accent: '#DA291C', // Red (often associated with Boyacá flag too)
  ruana: '#A0522D', // Earthy brown
  gold: '#FFD700', // Colonial gold
  text: '#1A1A1A',
  background: '#F5F5F5'
};

const { width } = Dimensions.get('window');

const ProfileCompletionScreen = ({ navigation, route }) => {
  const [userId, setUserId] = useState(route.params?.userId || null);
  const [token, setToken] = useState(route.params?.token || null);
  
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [visitMotive, setVisitMotive] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedToken = await AsyncStorage.getItem('userToken');
        
        if (storedUserId && storedUserId !== 'null' && storedUserId !== 'undefined') {
          setUserId(storedUserId);
        } else {
            // If no user ID found, we can't proceed. Redirect to login.
            Toast.show({
                type: 'error',
                text1: 'Error de sesión',
                text2: 'Por favor inicia sesión nuevamente.'
            });
            navigation.replace('Login');
            return;
        }

        if (storedToken) {
            setToken(storedToken);
        }
      }
    };
    loadUserData();
  }, []);

  const handleSubmit = async () => {
    if (!age || !gender || !country) {
      Toast.show({
        type: 'error',
        text1: '¡Faltan datos, sumercé!',
        text2: 'Por favor completa edad, género y país.'
      });
      return;
    }

    if (!userId) {
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'No se pudo identificar el usuario.'
        });
        return;
    }

    setLoading(true);
    try {
      await api.put(`/users/${userId}`, {
        age: parseInt(age),
        gender,
        country,
        group_size: parseInt(groupSize) || 1,
        visit_motive: visitMotive
      });

      Toast.show({
        type: 'success',
        text1: '¡Bienvenido a la Tierrita!',
        text2: 'Perfil actualizado con éxito.'
      });

      await AsyncStorage.setItem('isProfileComplete', 'true');

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo actualizar el perfil.'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOption = (label, value, currentValue, setValue, iconName, customStyle = {}) => (
    <TouchableOpacity
      style={[
        styles.optionCard,
        customStyle,
        currentValue === value && styles.optionCardSelected
      ]}
      onPress={() => setValue(value)}
    >
      <View style={[styles.iconContainer, currentValue === value && styles.iconContainerSelected]}>
        <Icon name={iconName} size={24} color={currentValue === value ? '#FFF' : THEME.primary} />
      </View>
      <Text style={[styles.optionText, currentValue === value && styles.optionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground 
      source={{ uri: 'https://www.transparenttextures.com/patterns/woven.png' }} // Subtle texture
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.1 }}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header with "Ruana" style decoration */}
          <View style={styles.header}>
            <View style={styles.ruanaStrip} />
            <Text style={styles.title}>¡Bienvenido, Sumercé!</Text>
            <Text style={styles.subtitle}>
              Para recomendarle los mejores piqueteaderos y restaurantes de Tunja, necesitamos conocerlo un poquito más.
            </Text>
          </View>

          <View style={styles.card}>
            {/* Age Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿Cuántos años tiene?</Text>
              <View style={styles.inputWrapper}>
                <Icon name="cake-variant" size={20} color={THEME.ruana} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 30"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Género</Text>
              <View style={styles.optionsGrid}>
                {renderOption('Femenino', 'Femenino', gender, setGender, 'gender-female', { minWidth: '28%' })}
                {renderOption('Masculino', 'Masculino', gender, setGender, 'gender-male', { minWidth: '28%' })}
                {renderOption('Otro', 'Otro', gender, setGender, 'gender-non-binary', { minWidth: '28%' })}
              </View>
            </View>

            {/* Country Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿De dónde nos visita?</Text>
              <View style={styles.inputWrapper}>
                <Icon name="map-marker-radius" size={20} color={THEME.ruana} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Colombia, Boyacá"
                  value={country}
                  onChangeText={setCountry}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Group Size */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿Viene solo o acompañado?</Text>
              <View style={styles.inputWrapper}>
                <Icon name="account-group" size={20} color={THEME.ruana} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Número de personas (Ej: 4)"
                  keyboardType="numeric"
                  value={groupSize}
                  onChangeText={setGroupSize}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Visit Motive */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿A qué viene a la tierrita?</Text>
              <View style={styles.optionsGrid}>
                {renderOption('Turismo', 'Turismo', visitMotive, setVisitMotive, 'camera-burst')}
                {renderOption('Negocios', 'Negocios', visitMotive, setVisitMotive, 'briefcase')}
                {renderOption('Familia', 'Familia', visitMotive, setVisitMotive, 'home-heart')}
                {renderOption('Otro', 'Otro', visitMotive, setVisitMotive, 'dots-horizontal')}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Guardando...' : '¡Listo, vamos a comer!'}
              </Text>
              <Icon name="silverware-fork-knife" size={24} color="#FFF" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
            
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 25,
    alignItems: 'center',
  },
  ruanaStrip: {
    width: 60,
    height: 6,
    backgroundColor: THEME.primary,
    borderRadius: 3,
    marginBottom: 15,
    // Simulate Ruana stripes
    borderLeftWidth: 15,
    borderLeftColor: THEME.accent,
    borderRightWidth: 15,
    borderRightColor: THEME.ruana,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.primary,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'serif', // Trying to get a more classic look
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // 3D effect
    borderBottomWidth: 4,
    borderBottomColor: '#E0E0E0',
  },
  optionCardSelected: {
    backgroundColor: '#E8F5E9', // Light green
    borderColor: THEME.primary,
    borderBottomColor: '#007A2D', // Darker green for 3D effect
  },
  iconContainer: {
    marginBottom: 5,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  iconContainerSelected: {
    backgroundColor: THEME.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: THEME.primary,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    // 3D Button effect
    borderBottomWidth: 5,
    borderBottomColor: '#007A2D',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  skipButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  skipButtonText: {
    color: '#888',
    fontSize: 15,
    textDecorationLine: 'underline',
  }
});

export default ProfileCompletionScreen;
