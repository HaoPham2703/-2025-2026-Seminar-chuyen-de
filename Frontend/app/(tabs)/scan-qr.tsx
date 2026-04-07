import { FadeScreenWrapper } from '@/components/fade-screen-wrapper';
import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import EmployeeAttendanceModal from '@/src/components/EmployeeAttendanceModal';
import { useTabReload } from '@/hooks/use-tab-reload';
import { useTheme } from '@/src/hooks/use-theme';
import { getAuthToken } from '@/src/services/api';
import { getCurrentAttendance } from '@/src/services/attendanceService';
import { getEmployeeProfile, verifyQrToken } from '@/src/services/employeeService';
import type { EmployeeProfile } from '@/src/services/employeeService';

import { CameraView, useCameraPermissions } from 'expo-camera';

import { useFocusEffect } from 'expo-router';
import { QrCode } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScanQrScreen() {
  const { colors } = useTheme();

  const [employeeName, setEmployeeName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [scannedEmployee, setScannedEmployee] = useState<{ employee: EmployeeProfile } | null>(null);
  const [scannedQrToken, setScannedQrToken] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  const loadManagerData = async () => {
    const token = await getAuthToken();
    if (!token) return;

    const profileData = await getEmployeeProfile();

    const firstName = profileData.employee.personalInfo.firstName || '';
    const lastName = profileData.employee.personalInfo.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || profileData.user.email;

    setEmployeeName(fullName);
    setEmployeeCode(profileData.employee.employeeId || '');

    try {
      const attendanceData = await getCurrentAttendance(profileData.employee.id);
      const status = attendanceData.attendance?.status || 'N/A';
      setAttendanceStatus(status);
    } catch {
      setAttendanceStatus('N/A');
    }
  };

  const handleScan = async (value: string) => {
    if (!value) return;

    setIsLoading(true);

    try {
      const employeeData = await verifyQrToken(value);
      setScannedEmployee(employeeData);
      setScannedQrToken(value);
      setShowScanner(false); // đóng camera sau khi quét thành công
    } catch (error: any) {
      Alert.alert(
        'Không tìm thấy',
        error.message || 'Không thể tìm thấy thông tin nhân viên'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadManagerData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadManagerData();
      return () => {};
    }, [])
  );

  useEffect(() => {
    if (showScanner && !permission?.granted) {
      requestPermission();
    }
  }, [showScanner]);

  const handleReload = useCallback(async () => {
    await loadManagerData();
  }, []);

  useTabReload(handleReload, 'scan-qr');

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <FadeScreenWrapper>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.permissionText, { color: colors.text }]}>
            Vui lòng cấp quyền camera để quét QR.
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={requestPermission}
          >
            <Text style={styles.actionButtonText}>Cấp quyền</Text>
          </TouchableOpacity>
        </View>
      </FadeScreenWrapper>
    );
  }

  return (
    <FadeScreenWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <RefreshableScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onRefresh={handleReload}
        >
          <View
            style={[
              styles.headerCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Quản lý
                </Text>

                <Text style={[styles.headerName, { color: colors.text }]}>
                  {employeeName}
                </Text>

                <Text
                  style={[
                    styles.headerSub,
                    { color: colors.textSecondary },
                  ]}
                >
                  Mã nhân viên: {employeeCode || 'N/A'}
                </Text>
              </View>

              <View
                style={[
                  styles.qrIconWrap,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <QrCode size={26} color={colors.accent} />
              </View>
            </View>

            <Text
              style={[styles.statusText, { color: colors.textSecondary }]}
            >
              Trạng thái hôm nay: {attendanceStatus || 'N/A'}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Quét QR nhân viên
            </Text>

            <Text
              style={[
                styles.cardDescription,
                { color: colors.textSecondary },
              ]}
            >
              Mở camera để quét mã QR của nhân viên.
            </Text>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowScanner(true)}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                {isLoading ? 'Đang tải...' : 'Bắt đầu quét'}
              </Text>
            </TouchableOpacity>
          </View>

          {scannedEmployee ? (
            <TouchableOpacity
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setShowAttendanceModal(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Đã quét: {scannedEmployee.employee.personalInfo.firstName}{' '}
                {scannedEmployee.employee.personalInfo.lastName}
              </Text>

              <Text
                style={[
                  styles.cardDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Mã NV: {scannedEmployee.employee.employeeId}
              </Text>

              <Text style={[styles.tapHint, { color: 'hsl(25, 60%, 45%)' }]}>
                Nhấn để chấm công →
              </Text>
            </TouchableOpacity>
          ) : null}

          {showScanner && (
            <View
              style={[
                styles.scannerContainer,
                { borderColor: colors.border },
              ]}
            >
              <CameraView
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={({ data }) => {
                  if (!data) return;
                  handleScan(data);
                }}
              />

              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
              </View>

              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.card },
                ]}
                onPress={() => setShowScanner(false)}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: colors.text },
                  ]}
                >
                  Đóng
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </RefreshableScrollView>

        <EmployeeAttendanceModal
          visible={showAttendanceModal}
          employee={scannedEmployee}
          qrCode={scannedQrToken}
          onClose={() => {
            setShowAttendanceModal(false);
            setScannedEmployee(null);
            setScannedQrToken(null);
          }}
          onSuccess={loadManagerData}
        />
      </View>
    </FadeScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  headerCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  headerName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },

  headerSub: {
    fontSize: 13,
    marginTop: 4,
  },

  qrIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusText: {
    marginTop: 12,
    fontSize: 13,
  },

  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  cardDescription: {
    fontSize: 13,
    marginBottom: 16,
  },

  actionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  actionButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  scannerContainer: {
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    marginBottom: 20,
  },

  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scannerFrame: {
    width: 220,
    height: 220,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  closeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  closeButtonText: {
    fontWeight: '600',
  },

  tapHint: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});