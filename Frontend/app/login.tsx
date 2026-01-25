import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { login } from '@/src/services/authService';
import { validateEmail, validatePassword } from '@/src/utils/validation';
import {
  useShakeAnimation,
  useFadeInAnimation,
  useSlideUpAnimation,
  usePulseAnimation,
  useButtonPressAnimation,
} from '@/src/utils/animations';
import '../styles/login.css';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Error states
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  
  // Animations
  const emailShake = useShakeAnimation();
  const passwordShake = useShakeAnimation();
  const logoPulse = usePulseAnimation();
  const buttonPress = useButtonPressAnimation();
  
  const emailErrorStyle = useFadeInAnimation(!!emailError);
  const passwordErrorStyle = useFadeInAnimation(!!passwordError);
  
  const logoStyle = useSlideUpAnimation(0);
  const formStyle = useSlideUpAnimation(200);
  const socialStyle = useSlideUpAnimation(400);

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      emailShake.shake();
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || '');
      passwordShake.shake();
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError && value) {
      const validation = validateEmail(value);
      if (validation.isValid) {
        setEmailError('');
      } else {
        setEmailError(validation.error || '');
      }
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError && value) {
      const validation = validatePassword(value);
      if (validation.isValid) {
        setPasswordError('');
      } else {
        setPasswordError(validation.error || '');
      }
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, password });
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Logo Section */}
          <Animated.View style={logoStyle}>
            <View style={styles.logoContainer}>
              <Animated.View style={[styles.logoShape, logoPulse.animatedStyle]} />
              <Text style={styles.logoText}>THE YELLOW STRAWBERRY</Text>
              <Text style={styles.tagline}>THINK UNTHINKABLE</Text>
            </View>
          </Animated.View>

          {/* Login Form */}
          <Animated.View style={formStyle}>
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <Animated.View style={emailShake.animatedStyle}>
                  <TextInput
                    style={[styles.input, emailError && styles.inputError]}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    onBlur={() => {
                      const validation = validateEmail(email);
                      if (!validation.isValid) {
                        setEmailError(validation.error || '');
                        emailShake.shake();
                      }
                    }}
                  />
                </Animated.View>
                {emailError && (
                  <Animated.Text style={[styles.errorText, emailErrorStyle]}>
                    {emailError}
                  </Animated.Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <Animated.View style={[styles.passwordContainer, passwordShake.animatedStyle, passwordError && styles.inputError]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="12345678"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onBlur={() => {
                      const validation = validatePassword(password);
                      if (!validation.isValid) {
                        setPasswordError(validation.error || '');
                        passwordShake.shake();
                      }
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Text style={styles.eyeIconText}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
                {passwordError && (
                  <Animated.Text style={[styles.errorText, passwordErrorStyle]}>
                    {passwordError}
                  </Animated.Text>
                )}
              </View>

              <Animated.View style={buttonPress.animatedStyle}>
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  onPressIn={buttonPress.pressIn}
                  onPressOut={buttonPress.pressOut}
                  disabled={loading}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                onPress={() => router.push('/signup')}
                style={styles.signupLink}
              >
                <Text style={styles.signupLinkText}>
                  Don't have an account? <Text style={styles.signupLinkBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Social Media Section */}
          <Animated.View style={socialStyle}>
            <View style={styles.socialContainer}>
              <Text style={styles.socialLabel}>FOLLOW US ON</Text>
              <View style={styles.socialIcons}>
                <TouchableOpacity style={styles.socialIcon}>
                  <Text style={styles.socialIconText}>📷</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <Text style={styles.socialIconText}>💼</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <Text style={styles.socialIconText}>👥</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <Text style={styles.socialIconText}>🐦</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7', // Light yellow/cream
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center' as const,
    marginBottom: 50,
  },
  logoShape: {
    width: 80,
    height: 80,
    backgroundColor: '#FF6B35', // Orange
    borderRadius: 20,
    marginBottom: 16,
    transform: [{ rotate: '45deg' }],
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#000',
    marginBottom: 4,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 0.5,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  passwordContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyeIconText: {
    fontSize: 20,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  signupLink: {
    marginTop: 24,
    alignItems: 'center' as const,
  },
  signupLinkText: {
    fontSize: 14,
    color: '#666',
  },
  signupLinkBold: {
    fontWeight: 'bold' as const,
    color: '#FF6B35',
  },
  socialContainer: {
    alignItems: 'center' as const,
    marginTop: 40,
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 16,
    letterSpacing: 1,
  },
  socialIcons: {
    flexDirection: 'row' as const,
    gap: 20,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialIconText: {
    fontSize: 20,
  },
};
