import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { signUp, SignUpRequest } from '@/src/services/authService';
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validateConfirmPassword,
} from '@/src/utils/validation';
import {
  useShakeAnimation,
  useFadeInAnimation,
  useSlideUpAnimation,
  usePulseAnimation,
  useButtonPressAnimation,
} from '@/src/utils/animations';
import '../styles/signup.css';

export default function SignUpScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Error states
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  // Animations
  const firstNameShake = useShakeAnimation();
  const lastNameShake = useShakeAnimation();
  const emailShake = useShakeAnimation();
  const phoneShake = useShakeAnimation();
  const passwordShake = useShakeAnimation();
  const confirmPasswordShake = useShakeAnimation();
  const logoPulse = usePulseAnimation();
  const buttonPress = useButtonPressAnimation();
  
  const logoStyle = useSlideUpAnimation(0);
  const formStyle = useSlideUpAnimation(200);
  const socialStyle = useSlideUpAnimation(600);
  
  // Error fade animations
  const firstNameErrorStyle = useFadeInAnimation(!!errors.firstName);
  const lastNameErrorStyle = useFadeInAnimation(!!errors.lastName);
  const emailErrorStyle = useFadeInAnimation(!!errors.email);
  const phoneErrorStyle = useFadeInAnimation(!!errors.phone);
  const passwordErrorStyle = useFadeInAnimation(!!errors.password);
  const confirmPasswordErrorStyle = useFadeInAnimation(!!errors.confirmPassword);

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };
    
    // Validate first name
    const firstNameValidation = validateName(formData.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.error || '';
      firstNameShake.shake();
      isValid = false;
    } else {
      newErrors.firstName = '';
    }
    
    // Validate last name
    const lastNameValidation = validateName(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.error || '';
      lastNameShake.shake();
      isValid = false;
    } else {
      newErrors.lastName = '';
    }
    
    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || '';
      emailShake.shake();
      isValid = false;
    } else {
      newErrors.email = '';
    }
    
    // Validate phone (optional but if provided, must be valid)
    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error || '';
        phoneShake.shake();
        isValid = false;
      } else {
        newErrors.phone = '';
      }
    } else {
      newErrors.phone = '';
    }
    
    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error || '';
      passwordShake.shake();
      isValid = false;
    } else {
      newErrors.password = '';
    }
    
    // Validate confirm password
    const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      newErrors.confirmPassword = confirmPasswordValidation.error || '';
      confirmPasswordShake.shake();
      isValid = false;
    } else {
      newErrors.confirmPassword = '';
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    let validation: { isValid: boolean; error?: string } = { isValid: true };
    
    switch (field) {
      case 'firstName':
        validation = validateName(value, 'First name');
        if (!validation.isValid) {
          setErrors(prev => ({ ...prev, firstName: validation.error || '' }));
          firstNameShake.shake();
        }
        break;
      case 'lastName':
        validation = validateName(value, 'Last name');
        if (!validation.isValid) {
          setErrors(prev => ({ ...prev, lastName: validation.error || '' }));
          lastNameShake.shake();
        }
        break;
      case 'email':
        validation = validateEmail(value);
        if (!validation.isValid) {
          setErrors(prev => ({ ...prev, email: validation.error || '' }));
          emailShake.shake();
        }
        break;
      case 'phone':
        if (value) {
          validation = validatePhone(value);
          if (!validation.isValid) {
            setErrors(prev => ({ ...prev, phone: validation.error || '' }));
            phoneShake.shake();
          }
        }
        break;
      case 'password':
        validation = validatePassword(value);
        if (!validation.isValid) {
          setErrors(prev => ({ ...prev, password: validation.error || '' }));
          passwordShake.shake();
        }
        break;
      case 'confirmPassword':
        validation = validateConfirmPassword(formData.password, value);
        if (!validation.isValid) {
          setErrors(prev => ({ ...prev, confirmPassword: validation.error || '' }));
          confirmPasswordShake.shake();
        }
        break;
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const signUpData: SignUpRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      };
      
      await signUp(signUpData);
      Alert.alert('Success', 'Account created successfully! Please login.');
      router.push('/login');
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    handleFieldChange(field, value);
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

          {/* Sign Up Form */}
          <Animated.View style={formStyle}>
            <View style={styles.formContainer}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>First Name</Text>
                <Animated.View style={firstNameShake.animatedStyle}>
                  <TextInput
                    style={[styles.input, errors.firstName && styles.inputError]}
                    placeholder="John"
                    placeholderTextColor="#999"
                    value={formData.firstName}
                    onChangeText={(value) => updateField('firstName', value)}
                    onBlur={() => handleFieldBlur('firstName', formData.firstName)}
                    autoCapitalize="words"
                  />
                </Animated.View>
                {errors.firstName && (
                  <Animated.Text style={[styles.errorText, firstNameErrorStyle]}>
                    {errors.firstName}
                  </Animated.Text>
                )}
              </View>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Last Name</Text>
                <Animated.View style={lastNameShake.animatedStyle}>
                  <TextInput
                    style={[styles.input, errors.lastName && styles.inputError]}
                    placeholder="Doe"
                    placeholderTextColor="#999"
                    value={formData.lastName}
                    onChangeText={(value) => updateField('lastName', value)}
                    onBlur={() => handleFieldBlur('lastName', formData.lastName)}
                    autoCapitalize="words"
                  />
                </Animated.View>
                {errors.lastName && (
                  <Animated.Text style={[styles.errorText, lastNameErrorStyle]}>
                    {errors.lastName}
                  </Animated.Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Animated.View style={emailShake.animatedStyle}>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="example@gmail.com"
                  placeholderTextColor="#999"
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  onBlur={() => handleFieldBlur('email', formData.email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </Animated.View>
              {errors.email && (
                <Animated.Text style={[styles.errorText, emailErrorStyle]}>
                  {errors.email}
                </Animated.Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <Animated.View style={phoneShake.animatedStyle}>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="0901234567"
                  placeholderTextColor="#999"
                  value={formData.phone}
                  onChangeText={(value) => updateField('phone', value)}
                  onBlur={() => handleFieldBlur('phone', formData.phone)}
                  keyboardType="phone-pad"
                />
              </Animated.View>
              {errors.phone && (
                <Animated.Text style={[styles.errorText, phoneErrorStyle]}>
                  {errors.phone}
                </Animated.Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <Animated.View style={[styles.passwordContainer, passwordShake.animatedStyle, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="12345678"
                  placeholderTextColor="#999"
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  onBlur={() => handleFieldBlur('password', formData.password)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
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
              {errors.password && (
                <Animated.Text style={[styles.errorText, passwordErrorStyle]}>
                  {errors.password}
                </Animated.Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <Animated.View style={[styles.passwordContainer, confirmPasswordShake.animatedStyle, errors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="12345678"
                  placeholderTextColor="#999"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                  onBlur={() => handleFieldBlur('confirmPassword', formData.confirmPassword)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeIconText}>
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              {errors.confirmPassword && (
                <Animated.Text style={[styles.errorText, confirmPasswordErrorStyle]}>
                  {errors.confirmPassword}
                </Animated.Text>
              )}
            </View>

            <Animated.View style={buttonPress.animatedStyle}>
              <TouchableOpacity
                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                onPress={handleSignUp}
                onPressIn={buttonPress.pressIn}
                onPressOut={buttonPress.pressOut}
                disabled={loading}
              >
                <Text style={styles.signupButtonText}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
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
    marginBottom: 40,
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
  },
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  halfWidth: {
    flex: 1,
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
  signupButton: {
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
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center' as const,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkBold: {
    fontWeight: 'bold' as const,
    color: '#FF6B35',
  },
  socialContainer: {
    alignItems: 'center' as const,
    marginTop: 30,
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
