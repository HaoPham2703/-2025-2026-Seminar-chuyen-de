import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { createAttendanceAdjustment } from '@/src/services/leaveService';

interface AttendanceAdjustmentModalProps {
  visible: boolean;
  employeeId: string;
  date: Date | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function AttendanceAdjustmentModal({
  visible,
  employeeId,
  date,
  onClose,
  onSubmitted,
}: AttendanceAdjustmentModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const formattedDate =
    date?.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) ??
    '';

  const handleSubmit = async () => {
    if (!employeeId || !date) {
      setError('Thiếu thông tin nhân viên hoặc ngày cần điều chỉnh.');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do điều chỉnh.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createAttendanceAdjustment({
        employeeId,
        date: date.toISOString(),
        reason: reason.trim(),
      });
      onClose();
      setReason('');
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (e: any) {
      setError(e.message || 'Không thể gửi yêu cầu điều chỉnh chấm công');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Điều chỉnh chấm công</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={20} color="hsl(25, 30%, 20%)" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.label}>Ngày</Text>
              <Text style={styles.value}>{formattedDate}</Text>

              <Text style={[styles.label, { marginTop: 16 }]}>Lý do</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Mô tả chi tiết lý do điều chỉnh (ví dụ: quên chấm công, sai giờ vào/ra)..."
                placeholderTextColor="hsl(25, 15%, 65%)"
                multiline
                value={reason}
                onChangeText={setReason}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Gửi yêu cầu</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  closeButton: {
    padding: 4,
  },
  scroll: {
    maxHeight: 260,
  },
  body: {
    marginTop: 4,
    paddingBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'hsl(25, 15%, 50%)',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: 'hsl(25, 30%, 20%)',
    fontWeight: '500',
  },
  textArea: {
    marginTop: 4,
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'hsl(30, 25%, 88%)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlignVertical: 'top',
    fontSize: 14,
    color: 'hsl(25, 30%, 20%)',
    backgroundColor: 'hsl(30, 50%, 97%)',
  },
  errorText: {
    marginTop: 8,
    color: 'hsl(0, 70%, 55%)',
    fontSize: 12,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: 'hsl(30, 55%, 55%)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

