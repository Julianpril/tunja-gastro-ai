import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { register, login } from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    regionalInterest: 'medio', // bajo, medio, alto
    restrictions: '', // comma separated string for simplicity in UI
    budget: '',
    touristType: 'nacional' // local, nacional, extranjero
  });

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (step === 1) {
      // Validate step 1
      if (formData.name && formData.email && formData.password) {
        setStep(2);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Campos incompletos',
          text2: 'Por favor completa todos los campos obligatorios'
        });
      }
    } else {
      // Submit registration
      setLoading(true);
      try {
        const payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            regional_interest: formData.regionalInterest,
            restrictions: formData.restrictions,
            budget: formData.budget ? parseFloat(formData.budget) : 0,
            tourist_type: formData.touristType
        };
        
        await register(payload);
        // Auto login after register
        const response = await login(formData.email, formData.password);
        
        Toast.show({
          type: 'success',
          text1: '¡Cuenta creada!',
          text2: 'Bienvenido a Tunja Gastro AI'
        });
        
        // Navigate to ProfileCompletion instead of Main
        navigation.replace('ProfileCompletion', { 
          userId: response.user_id,
          token: response.access_token 
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error de registro',
          text2: 'No se pudo crear la cuenta. Intenta nuevamente.'
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Crea tu cuenta</Text>
      <Text style={styles.stepSubtitle}>Paso 1 de 2: Datos Personales</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre Completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Juan Pérez"
          value={formData.name}
          onChangeText={(text) => updateForm('name', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="juan@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text) => updateForm('email', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => updateForm('password', text)}
        />
      </View>
    </View>
  );

  const renderOption = (key, value, label, currentValue) => (
    <TouchableOpacity 
      style={[
        styles.optionButton, 
        currentValue === value && styles.optionButtonSelected
      ]}
      onPress={() => updateForm(key, value)}
    >
      <Text style={[
        styles.optionText,
        currentValue === value && styles.optionTextSelected
      ]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personaliza tu experiencia</Text>
      <Text style={styles.stepSubtitle}>Paso 2 de 2: Preferencias Gastronómicas</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Interés en platos regionales</Text>
        <View style={styles.optionsRow}>
          {renderOption('regionalInterest', 'bajo', 'Bajo', formData.regionalInterest)}
          {renderOption('regionalInterest', 'medio', 'Medio', formData.regionalInterest)}
          {renderOption('regionalInterest', 'alto', 'Alto', formData.regionalInterest)}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tipo de Turista</Text>
        <View style={styles.optionsRow}>
          {renderOption('touristType', 'local', 'Local', formData.touristType)}
          {renderOption('touristType', 'nacional', 'Nacional', formData.touristType)}
          {renderOption('touristType', 'extranjero', 'Extranjero', formData.touristType)}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Presupuesto Diario (COP)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 50000"
          keyboardType="numeric"
          value={formData.budget}
          onChangeText={(text) => updateForm('budget', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Restricciones Alimenticias</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Vegetariano, Sin Gluten (Opcional)"
          value={formData.restrictions}
          onChangeText={(text) => updateForm('restrictions', text)}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>

          {step === 1 ? renderStep1() : renderStep2()}

          <TouchableOpacity style={styles.mainButton} onPress={handleNext}>
            <Text style={styles.mainButtonText}>
              {step === 1 ? 'Continuar' : 'Comenzar mi experiencia'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  backButton: {
    marginBottom: 24,
    marginTop: Platform.OS === 'android' ? 40 : 0,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
  stepContainer: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  optionText: {
    color: '#666',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  mainButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 'auto',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
