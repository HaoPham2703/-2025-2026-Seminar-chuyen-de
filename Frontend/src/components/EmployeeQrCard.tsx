import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface EmployeeQrCardProps {
  visible: boolean;
  onClose: () => void;
  qrValue: string | null;
  employeeName?: string;
  employeeCode?: string;
  employeeId?: string;
  onAttendanceSuccess?: () => void | Promise<void>;
}

export default function EmployeeQrCard({
  visible,
  onClose,
  qrValue,
}: EmployeeQrCardProps) {
  const [currentQr, setCurrentQr] = useState<string | null>(qrValue);

  useEffect(() => {
    if (qrValue) {
      setCurrentQr(qrValue);
    }
  }, [qrValue]);

  useEffect(() => {
    if (!visible) return;
    if (qrValue) setCurrentQr(qrValue);
  }, [visible, qrValue]);

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
