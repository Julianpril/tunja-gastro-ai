import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Image,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { login, forgotPassword } from '../services/api';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      const isProfileComplete = await AsyncStorage.getItem('isProfileComplete');

      if (token && userId) {
        if (isProfileComplete === 'true') {
          navigation.replace('Main');
        } else {
          navigation.replace('ProfileCompletion', { userId, token });
        }
      } else if (token && !userId) {
        // Invalid session state, clear it
        await AsyncStorage.multiRemove(['userToken', 'userId', 'userName', 'isProfileComplete']);
      }
    } catch (e) {
      console.log('Error checking session', e);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Campos incompletos',
        text2: 'Por favor ingresa correo y contraseña'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);
      Toast.show({
        type: 'success',
        text1: '¡Bienvenido!',
        text2: 'Has iniciado sesión correctamente'
      });
      
      if (response.is_profile_complete) {
        navigation.replace('Main');
      } else {
        navigation.replace('ProfileCompletion', { 
          userId: response.user_id, 
          token: response.access_token 
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error de inicio de sesión',
        text2: 'Verifica tus credenciales e intenta nuevamente'
      });
    } finally {
      setLoading(false);
    }
  };

  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleForgotPassword = async (inputEmail) => {
    if (!inputEmail) return;
    try {
      const res = await forgotPassword(inputEmail.trim());
      Alert.alert(
        'Contraseña Temporal',
        `Tu nueva contraseña temporal es:\n\n${res.temp_password}\n\nÚsala para iniciar sesión y luego cámbiala.`
      );
    } catch {
      Alert.alert('Error', 'No se encontró una cuenta con ese correo.');
    }
  };

  const onForgotPress = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Recuperar Contraseña',
        'Ingresa tu correo electrónico:',
        (text) => handleForgotPassword(text),
        'plain-text',
        email
      );
    } else {
      setForgotEmail(email);
      setShowForgotModal(true);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Image with Blur */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop' }} // Placeholder food image
        style={styles.backgroundImage}
        blurRadius={3} // Subtle blur
      >
        <View style={styles.overlay} />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.contentContainer}
        >
          {/* Logo Area */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>TGA</Text>
            </View>
            <Text style={styles.appName}>Tunja Gastro AI</Text>
          </View>

          {/* Form Area */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email o Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#rgba(255,255,255,0.6)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#rgba(255,255,255,0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.forgotPassword} onPress={onForgotPress}>
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>O continúa con</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>G</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>f</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}></Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.footerContainer}>
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerButtonText}>
                ¿No tienes cuenta? <Text style={styles.registerButtonTextBold}>Regístrate</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.guestButton}
              onPress={() => console.log('Guest access')}
            >
              <Text style={styles.guestButtonText}>Continuar como invitado</Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </ImageBackground>

      {/* Android Forgot Password Modal */}
      <Modal visible={showForgotModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
            <Text style={styles.modalSubtitle}>Ingresa tu correo electrónico:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#999"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowForgotModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowForgotModal(false); handleForgotPassword(forgotEmail); }} style={styles.modalSendBtn}>
                <Text style={styles.modalSendText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay for readability
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FF6B6B', // Brand color
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      },
      default: {
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  logoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: 'white',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 4.65px rgba(255, 107, 107, 0.3)',
      },
      default: {
        elevation: 3,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
    }),
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  socialButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  footerContainer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 16,
  },
  registerButton: {
    padding: 8,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
  },
  registerButtonTextBold: {
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  guestButton: {
    padding: 8,
  },
  guestButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: '#999',
    fontSize: 16,
  },
  modalSendBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalSendText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LoginScreen;
