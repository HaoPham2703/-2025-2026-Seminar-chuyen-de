import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { clockIn } from '../services/attendanceService';
import type { EmployeeProfile } from '../services/employeeService';

interface EmployeeAttendanceModalProps {
  visible: boolean;
  employee: { employee: EmployeeProfile } | null;
  qrCode: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalState = 'loading' | 'success' | 'error';

export default function EmployeeAttendanceModal({
  visible,
  employee,
  qrCode,
  onClose,
  onSuccess,
}: EmployeeAttendanceModalProps) {
  const [state, setState] = useState<ModalState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-trigger clock-in when modal opens
  useEffect(() => {
    if (!visible || !employee?.employee?.id) return;

    const doClockIn = async () => {
      setState('loading');
      setErrorMessage('');
      try {
        await clockIn({
          employeeId: employee.employee.id,
          qrCode: qrCode ?? undefined,
          method: 'QR_SCAN',
        });
        setState('success');
        setTimeout(() => {
          onSuccess();
          onClose();
          setState('loading');
        }, 2000);
      } catch (err: any) {
        setState('error');
        setErrorMessage(err?.message || 'Chấm công thất bại');
      }
    };

    doClockIn();
  }, [visible, employee]);

  const handleClose = () => {
    if (state === 'loading') return;
    setState('loading');
    setErrorMessage('');
    onClose();
  };

  if (!visible) return null;

  // ── Loading state ────────────────────────────────────────
  if (state === 'loading') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.body}>
              <ActivityIndicator size="large" color="hsl(25, 80%, 50%)" />
              <Text style={styles.loadingText}>Đang chấm công...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Success state ──────────────────────────────────────
  if (state === 'success') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.body}>
              <View style={styles.successCircle}>
                <Text style={styles.successCheck}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Chấm công thành công!</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Error state ────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Lỗi</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={20} color="hsl(25, 15%, 50%)" />
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 15%, 92%)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  body: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: 'hsl(25, 15%, 45%)',
    marginTop: 8,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'hsl(145, 65%, 42%)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheck: {
    fontSize: 32,
    color: 'white',
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  errorBanner: {
    backgroundColor: 'hsl(0, 70%, 95%)',
    borderRadius: 10,
    padding: 14,
    width: '100%',
  },
  errorText: {
    color: 'hsl(0, 65%, 40%)',
    fontSize: 14,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'hsl(25, 15%, 90%)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
  },
});
