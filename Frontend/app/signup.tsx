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
import { useRouter } from 'expo-router';
import { signUp, SignUpRequest } from '@/src/services/authService';
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

  const handleSignUp = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
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
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <View style={styles.logoContainer}>
            <View style={styles.logoShape} />
            <Text style={styles.logoText}>THE YELLOW STRAWBERRY</Text>
            <Text style={styles.tagline}>THINK UNTHINKABLE</Text>
          </View>

          {/* Sign Up Form */}
          <View style={styles.formContainer}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="#999"
                  value={formData.firstName}
                  onChangeText={(value) => updateField('firstName', value)}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="#999"
                  value={formData.lastName}
                  onChangeText={(value) => updateField('lastName', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="0901234567"
                placeholderTextColor="#999"
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="12345678"
                  placeholderTextColor="#999"
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
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
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="12345678"
                  placeholderTextColor="#999"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
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
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.signupButtonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Media Section */}
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
    alignItems: 'center',
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
    alignItems: 'center',
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
    alignItems: 'center',
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
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialIconText: {
    fontSize: 20,
  },
};
