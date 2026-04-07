import { Clock, User, X } from 'lucide-react-native';
import { useState } from 'react';
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

type ModalState = 'idle' | 'loading' | 'success' | 'error';

export default function EmployeeAttendanceModal({
  visible,
  employee,
  qrCode,
  onClose,
  onSuccess,
}: EmployeeAttendanceModalProps) {
  const [state, setState] = useState<ModalState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!employee?.employee?.id) {
    // Guard: nếu employee.id undefined thì không cho chấm công
    console.error('EmployeeAttendanceModal: employee.id =', employee?.employee?.id, JSON.stringify(employee));
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.errorBanner}>
              Lỗi: Không tìm thấy ID nhân viên
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  // employee.id = MongoDB ObjectId string, employee.employeeId = mã nhân viên "EMP001"
  const { personalInfo, employment, employeeId: employeeCode } = employee.employee;
  const dbEmployeeId = employee.id;  // MongoDB ObjectId string
  const fullName =
    `${personalInfo.firstName} ${personalInfo.lastName}`.trim() || employeeCode;

  const handleClockIn = async () => {
    setState('loading');
    setErrorMessage('');
    try {
      await clockIn({
        employeeId: dbEmployeeId,
        qrCode: qrCode ?? undefined,
        method: 'QR_SCAN',
      });
      setState('success');
      setTimeout(() => {
        onSuccess();
        onClose();
        setState('idle');
      }, 2000);
    } catch (err: any) {
      setState('error');
      setErrorMessage(err?.message || 'Chấm công thất bại');
    }
  };

  const handleClose = () => {
    if (state === 'loading') return;
    setState('idle');
    setErrorMessage('');
    onClose();
  };

  // ── Success state ──────────────────────────────────────
  if (state === 'success') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.successBody}>
              <View style={styles.successCircle}>
                <Text style={styles.successCheck}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Chấm công thành công!</Text>
              <Text style={styles.successSubtitle}>{fullName}</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Idle / Loading / Error state ───────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thông tin nhân viên</Text>
            {state !== 'loading' && (
              <TouchableOpacity onPress={handleClose}>
                <X size={20} color="hsl(25, 15%, 50%)" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.body}>
            {/* Employee info */}
            <View style={styles.employeeInfo}>
              <View style={styles.avatar}>
                <User size={28} color="#8B6914" strokeWidth={2} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.name}>{fullName}</Text>
                <Text style={styles.meta}>
                  <Text style={styles.metaLabel}>Mã NV: </Text>
                  {employeeCode || '—'}
                </Text>
                {employment?.position && (
                  <Text style={styles.meta}>
                    <Text style={styles.metaLabel}>Vị trí: </Text>
                    {employment.position}
                  </Text>
                )}
                {employment?.department && (
                  <Text style={styles.meta}>
                    <Text style={styles.metaLabel}>Phòng ban: </Text>
                    {employment.department}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Error banner */}
            {state === 'error' && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Clock In button */}
            <TouchableOpacity
              style={[
                styles.clockInButton,
                state === 'loading' && styles.clockInButtonDisabled,
              ]}
              onPress={handleClockIn}
              disabled={state === 'loading'}
              activeOpacity={0.8}
            >
              {state === 'loading' ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={styles.clockInButtonContent}>
                  <Clock size={18} color="white" style={styles.clockIcon} />
                  <Text style={styles.clockInButtonText}>Chấm công</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Cancel button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={state === 'loading'}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
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
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 20%, 90%)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'hsl(40, 60%, 92%)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoText: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: 'hsl(25, 15%, 45%)',
    marginTop: 2,
    lineHeight: 20,
  },
  metaLabel: {
    fontWeight: '600',
    color: 'hsl(25, 30%, 35%)',
  },
  divider: {
    height: 1,
    backgroundColor: 'hsl(30, 20%, 90%)',
    marginVertical: 12,
  },
  errorBanner: {
    backgroundColor: 'hsl(0, 70%, 95%)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  errorText: {
    color: 'hsl(0, 70%, 40%)',
    fontSize: 13,
    textAlign: 'center',
  },
  clockInButton: {
    backgroundColor: 'hsl(145, 60%, 42%)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  clockInButtonDisabled: {
    backgroundColor: 'hsl(145, 40%, 55%)',
  },
  clockInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    marginRight: 8,
  },
  clockInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'hsl(25, 15%, 50%)',
    fontSize: 15,
    fontWeight: '600',
  },
  // Success state
  successBody: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'hsl(145, 60%, 42%)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successCheck: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'hsl(145, 60%, 30%)',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: 'hsl(25, 15%, 45%)',
  },
});
