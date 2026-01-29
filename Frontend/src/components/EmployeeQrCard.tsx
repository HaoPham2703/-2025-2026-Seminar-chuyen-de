import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { X } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

interface EmployeeQrCardProps {
  visible: boolean;
  onClose: () => void;
  qrValue: string | null;
  employeeName: string;
  employeeCode?: string;
}

export default function EmployeeQrCard({
  visible,
  onClose,
  qrValue,
  employeeName,
  employeeCode,
}: EmployeeQrCardProps) {
  if (!visible) return null;

  const displayValue = qrValue || employeeCode || employeeName;

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
              <QRCode value={displayValue} size={220} />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.name}>{employeeName}</Text>
            {employeeCode ? (
              <Text style={styles.code}>Mã nhân viên: {employeeCode}</Text>
            ) : null}
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
});

