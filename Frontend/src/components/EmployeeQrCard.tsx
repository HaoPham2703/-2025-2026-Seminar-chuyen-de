import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getCurrentAttendance } from '../services/attendanceService';
import { getEmployeeQrCode } from '../services/employeeService';

const QR_REFRESH_INTERVAL_SEC = 10;

interface EmployeeQrCardProps {
  visible: boolean;
  onClose: () => void;
  qrValue: string | null;
  employeeName: string;
  employeeCode?: string;
  employeeId?: string;
  onAttendanceSuccess?: () => void;
}

export default function EmployeeQrCard({
  visible,
  onClose,
  qrValue,
  employeeName,
  employeeCode,
  employeeId,
  onAttendanceSuccess,
}: EmployeeQrCardProps) {
  // Double buffering:
  // currentQr = QR đang hiện trên màn hình
  // nextQr    = QR kế tiếp, đang fetch trong nền
  const [currentQr, setCurrentQr] = useState<string | null>(qrValue);
  const [nextQr, setNextQr] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(QR_REFRESH_INTERVAL_SEC);

  // Refs dùng trong setInterval (không bị stale closure)
  const employeeIdRef = useRef(employeeId);
  const nextQrRef = useRef<string | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attendancePollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSwapAtRef = useRef<number>(Date.now());
  const initialClockInTimeRef = useRef<string | null>(null);
  const hasNotifiedSuccessRef = useRef(false);

  // Đồng bộ refs
  useEffect(() => { employeeIdRef.current = employeeId; }, [employeeId]);
  useEffect(() => { nextQrRef.current = nextQr; }, [nextQr]);

  // Khi prop qrValue thay đổi → set làm currentQr
  useEffect(() => {
    if (qrValue) setCurrentQr(qrValue);
  }, [qrValue]);

  // Fetch QR tiếp theo (chạy nền)
  const fetchNextQr = () => {
    if (!employeeIdRef.current) return;

    getEmployeeQrCode(employeeIdRef.current)
      .then((qrResponse) => {
        if (qrResponse?.qrToken) {
          setNextQr(qrResponse.qrToken);
        }
      })
      .catch(() => {
        // giữ QR hiện tại nếu fetch lỗi
      });
  };

  // Khi mở modal, lấy ngay QR mới nhất để tránh quét phải mã đã hết hạn
  const refreshCurrentQrNow = () => {
    if (!employeeIdRef.current) return;

    getEmployeeQrCode(employeeIdRef.current)
      .then((qrResponse) => {
        if (qrResponse?.qrToken) {
          setCurrentQr(qrResponse.qrToken);
          setNextQr(null);
          lastSwapAtRef.current = Date.now();
          setCountdown(QR_REFRESH_INTERVAL_SEC);
        }
      })
      .catch(() => {
        // giữ QR hiện tại nếu fetch lỗi
      });
  };

  // Swap: nextQr → currentQr, rồi fetch QR kế tiếp
  const swapQr = () => {
    const qrToShow = nextQrRef.current;
    if (!qrToShow) {
      // Chưa có nextQr → fetch ngay rồi chờ nhịp kế
      fetchNextQr();
      return;
    }

    // Swap: hiện QR mới
    setCurrentQr(qrToShow);
    setNextQr(null);

    // Đồng bộ nhịp countdown theo thời điểm QR thực sự đổi
    lastSwapAtRef.current = Date.now();
    setCountdown(QR_REFRESH_INTERVAL_SEC);

    // Fetch QR kế tiếp ngay
    fetchNextQr();
  };

  const stopTimers = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (attendancePollIntervalRef.current) clearInterval(attendancePollIntervalRef.current);
    countdownIntervalRef.current = null;
    attendancePollIntervalRef.current = null;
  };

  const checkAttendanceAndHandleSuccess = async () => {
    if (!employeeIdRef.current || hasNotifiedSuccessRef.current) return;

    try {
      const current = await getCurrentAttendance(employeeIdRef.current);
      const latestClockInTime = current.attendance?.clockIn?.time ?? null;

      if (initialClockInTimeRef.current === null) {
        initialClockInTimeRef.current = latestClockInTime;
        return;
      }

      if (latestClockInTime && latestClockInTime !== initialClockInTimeRef.current) {
        hasNotifiedSuccessRef.current = true;
        onAttendanceSuccess?.();
        Alert.alert('Chấm công thành công', 'Bạn đã được chấm công thành công.');
        onClose();
      }
    } catch {
      // ignore polling errors
    }
  };

  useEffect(() => {
    if (!visible || !employeeId) {
      stopTimers();
      return;
    }

    hasNotifiedSuccessRef.current = false;
    initialClockInTimeRef.current = null;

    // Lấy QR hiện tại mới nhất ngay khi mở modal
    refreshCurrentQrNow();

    // Fetch QR kế tiếp ngay khi mở
    fetchNextQr();

    // Lấy mốc attendance ban đầu và bắt đầu poll
    checkAttendanceAndHandleSuccess();
    attendancePollIntervalRef.current = setInterval(() => {
      checkAttendanceAndHandleSuccess();
    }, 2000);

    // Đồng bộ nhịp countdown theo mốc thời gian thực
    lastSwapAtRef.current = Date.now();
    setCountdown(QR_REFRESH_INTERVAL_SEC);

    countdownIntervalRef.current = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - lastSwapAtRef.current) / 1000);
      const remaining = Math.max(QR_REFRESH_INTERVAL_SEC - elapsedSec, 0);
      setCountdown(remaining);

      if (remaining <= 0) {
        swapQr();
      }
    }, 1000);

    return stopTimers;
  }, [visible, employeeId]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Mã QR của tôi</Text>
              <Text style={styles.subtitle}>Đưa mã này cho quản lý để quét khi vào/ra ca</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color="hsl(25, 30%, 20%)" />
            </TouchableOpacity>
          </View>

          <View style={styles.qrWrapper}>
            <View style={styles.qrCard}>
              {currentQr ? (
                <QRCode value={currentQr} size={220} />
              ) : (
                <Text style={{ color: 'hsl(25, 15%, 50%)' }}>Đang tải...</Text>
              )}
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.name}>{employeeName}</Text>
            {employeeCode ? (
              <Text style={styles.code}>Mã nhân viên: {employeeCode}</Text>
            ) : null}
            <Text style={styles.expiresText}>Mã sẽ đổi sau {countdown}s</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: 'hsl(25, 15%, 50%)',
  },
  closeButton: {
    padding: 4,
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  qrCard: {
    width: 220,
    minHeight: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'hsl(30, 25%, 88%)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'hsl(30, 50%, 97%)',
  },
  infoBox: {
    marginTop: 16,
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  code: {
    marginTop: 4,
    fontSize: 13,
    color: 'hsl(25, 15%, 50%)',
  },
  expiresText: {
    marginTop: 6,
    fontSize: 12,
    color: 'hsl(25, 15%, 40%)',
  },
});
