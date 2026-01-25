import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { EmployeeProfileResponse, updateEmployeeProfile, UpdateProfileRequest } from '@/src/services/employeeService';
import { validateName, validatePhone } from '@/src/utils/validation';
import { useShakeAnimation, useFadeInAnimation } from '@/src/utils/animations';

interface EditProfileModalProps {
  profileData: EmployeeProfileResponse;
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profileData,
  visible,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    firstName: profileData.employee.personalInfo.firstName || '',
    lastName: profileData.employee.personalInfo.lastName || '',
    phone: profileData.employee.personalInfo.phone || '',
    dateOfBirth: profileData.employee.personalInfo.dateOfBirth || '',
    gender: profileData.employee.personalInfo.gender || '',
    street: profileData.employee.personalInfo.address?.street || '',
    city: profileData.employee.personalInfo.address?.city || '',
    province: profileData.employee.personalInfo.address?.province || '',
    emergencyName: profileData.employee.personalInfo.emergencyContact?.name || '',
    emergencyRelationship: profileData.employee.personalInfo.emergencyContact?.relationship || '',
    emergencyPhone: profileData.employee.personalInfo.emergencyContact?.phone || '',
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);

  const firstNameShake = useShakeAnimation();
  const lastNameShake = useShakeAnimation();
  const phoneShake = useShakeAnimation();

  const firstNameErrorStyle = useFadeInAnimation(!!errors.firstName);
  const lastNameErrorStyle = useFadeInAnimation(!!errors.lastName);
  const phoneErrorStyle = useFadeInAnimation(!!errors.phone);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    const firstNameValidation = validateName(formData.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.error || '';
      firstNameShake.shake();
      isValid = false;
    } else {
      newErrors.firstName = '';
    }

    const lastNameValidation = validateName(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.error || '';
      lastNameShake.shake();
      isValid = false;
    } else {
      newErrors.lastName = '';
    }

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

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData: UpdateProfileRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        address: {
          street: formData.street || undefined,
          city: formData.city || undefined,
          province: formData.province || undefined,
        },
        emergencyContact: formData.emergencyName && formData.emergencyPhone ? {
          name: formData.emergencyName,
          relationship: formData.emergencyRelationship || 'Other',
          phone: formData.emergencyPhone,
        } : undefined,
      };

      await updateEmployeeProfile(updateData);
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
      onUpdate();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="hsl(25, 30%, 20%)" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Personal Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Họ *</Text>
                  <Animated.View style={firstNameShake.animatedStyle}>
                    <TextInput
                      style={[styles.input, errors.firstName && styles.inputError]}
                      value={formData.firstName}
                      onChangeText={(value) => handleFieldChange('firstName', value)}
                      placeholder="Nhập họ"
                      placeholderTextColor="#999"
                    />
                  </Animated.View>
                  {errors.firstName && (
                    <Animated.Text style={[styles.errorText, firstNameErrorStyle]}>
                      {errors.firstName}
                    </Animated.Text>
                  )}
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Tên *</Text>
                  <Animated.View style={lastNameShake.animatedStyle}>
                    <TextInput
                      style={[styles.input, errors.lastName && styles.inputError]}
                      value={formData.lastName}
                      onChangeText={(value) => handleFieldChange('lastName', value)}
                      placeholder="Nhập tên"
                      placeholderTextColor="#999"
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
                <Text style={styles.label}>Số điện thoại</Text>
                <Animated.View style={phoneShake.animatedStyle}>
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    value={formData.phone}
                    onChangeText={(value) => handleFieldChange('phone', value)}
                    placeholder="0901234567"
                    placeholderTextColor="#999"
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
                <Text style={styles.label}>Ngày sinh</Text>
                <TextInput
                  style={styles.input}
                  value={formData.dateOfBirth}
                  onChangeText={(value) => handleFieldChange('dateOfBirth', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Giới tính</Text>
                <TextInput
                  style={styles.input}
                  value={formData.gender}
                  onChangeText={(value) => handleFieldChange('gender', value)}
                  placeholder="Nam/Nữ/Khác"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Địa chỉ</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Đường/Số nhà</Text>
                <TextInput
                  style={styles.input}
                  value={formData.street}
                  onChangeText={(value) => handleFieldChange('street', value)}
                  placeholder="Nhập địa chỉ"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Thành phố</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.city}
                    onChangeText={(value) => handleFieldChange('city', value)}
                    placeholder="Thành phố"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Tỉnh/Thành phố</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.province}
                    onChangeText={(value) => handleFieldChange('province', value)}
                    placeholder="Tỉnh/TP"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>

            {/* Emergency Contact */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Liên hệ khẩn cấp</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên người liên hệ</Text>
                <TextInput
                  style={styles.input}
                  value={formData.emergencyName}
                  onChangeText={(value) => handleFieldChange('emergencyName', value)}
                  placeholder="Tên người liên hệ"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mối quan hệ</Text>
                <TextInput
                  style={styles.input}
                  value={formData.emergencyRelationship}
                  onChangeText={(value) => handleFieldChange('emergencyRelationship', value)}
                  placeholder="Ví dụ: Cha, Mẹ, Vợ/Chồng..."
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  value={formData.emergencyPhone}
                  onChangeText={(value) => handleFieldChange('emergencyPhone', value)}
                  placeholder="0901234567"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'hsl(30, 50%, 97%)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 25%, 88%)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: '70%',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
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
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'hsl(30, 25%, 88%)',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'hsl(30, 40%, 95%)',
    borderWidth: 1,
    borderColor: 'hsl(30, 25%, 88%)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
  },
  saveButton: {
    backgroundColor: 'hsl(30, 55%, 55%)',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default EditProfileModal;
