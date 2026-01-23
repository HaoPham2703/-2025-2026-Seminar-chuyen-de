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
import { useRouter } from 'expo-router';
import { login } from '@/src/services/authService';
import '../styles/login.css';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
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
          <View style={styles.logoContainer}>
            <View style={styles.logoShape} />
            <Text style={styles.logoText}>THE YELLOW STRAWBERRY</Text>
            <Text style={styles.tagline}>THINK UNTHINKABLE</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="12345678"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
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

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/signup')}
              style={styles.signupLink}
            >
              <Text style={styles.signupLinkText}>
                Don't have an account? <Text style={styles.signupLinkBold}>Sign Up</Text>
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
    justifyContent: 'center',
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
    alignItems: 'center',
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
    alignItems: 'center',
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
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialIconText: {
    fontSize: 20,
  },
};
