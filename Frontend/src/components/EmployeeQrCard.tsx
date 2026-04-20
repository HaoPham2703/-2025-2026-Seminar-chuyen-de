import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const QR_REFRESH_INTERVAL_SEC = 10;

interface EmployeeQrCardProps {
  visible: boolean;
  onClose: () => void;
  qrValue: string | null;
}

export default function EmployeeQrCard({
  visible,
  onClose,
  qrValue,
}: EmployeeQrCardProps) {
  const [currentQr, setCurrentQr] = useState<string | null>(qrValue);
  const [nextQr, setNextQr] = useState<string | null>(null);

  const nextQrRef = useRef<string | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSwapAtRef = useRef<number>(Date.now());

  useEffect(() => { nextQrRef.current = nextQr; }, [nextQr]);

  useEffect(() => {
    if (qrValue) setCurrentQr(qrValue);
  }, [qrValue]);

  const swapQr = () => {
    const qrToShow = nextQrRef.current;
    setCurrentQr(qrToShow);
    setNextQr(null);
    lastSwapAtRef.current = Date.now();
  };

  const stopTimers = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!visible) {
      stopTimers();
      return;
    }

    lastSwapAtRef.current = Date.now();
    if (qrValue) setCurrentQr(qrValue);

    countdownIntervalRef.current = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - lastSwapAtRef.current) / 1000);
      const remaining = Math.max(QR_REFRESH_INTERVAL_SEC - elapsedSec, 0);

      if (remaining <= 0) {
        swapQr();
      }
    }, 1000);

    return stopTimers;
  }, [visible]);

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
            <Text style={styles.title}>Mã QR của tôi</Text>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
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
});
