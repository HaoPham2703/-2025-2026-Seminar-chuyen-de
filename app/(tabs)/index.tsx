import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { api } from '../services/api'

export default function HomeScreen() {
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [isClockedOut, setIsClockedOut] = useState(false)
  const [loading, setLoading] = useState(true)
  const [employeeId, setEmployeeId] = useState('')
  const [employeeName, setEmployeeName] = useState('')

  // QR display state
  const [showQR, setShowQR] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [qrCountdown, setQrCountdown] = useState(10)
  const [loadingQR, setLoadingQR] = useState(false)

  // Load trạng thái chấm công ban đầu
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const userRes = await api.get<{ employeeId?: string; name?: string }>('/auth/me')
        if (userRes.success && userRes.data) {
          setEmployeeId(userRes.data.employeeId || '')
          setEmployeeName(userRes.data.name || '')
          const attRes = await api.get<{ isClockedIn: boolean; isClockedOut: boolean }>(
            `/attendance/current?employeeId=${userRes.data.employeeId}`
          )
          if (attRes.success && attRes.data) {
            setIsClockedIn(attRes.data.isClockedIn)
            setIsClockedOut(attRes.data.isClockedOut)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadStatus()
  }, [])

  // Countdown khi hiện QR
  useEffect(() => {
    if (!showQR) return
    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          setShowQR(false)
          return 10
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showQR])

  // ── Bấm "Chấm công vào" → hiện QR ngay ───────────────────────────────
  const handleChamCongVao = async () => {
    // Hiện QR ngay, fetch token song song
    setShowQR(true)
    setQrCountdown(10)

    try {
      setLoadingQR(true)
      const res = await api.get<{ qrToken?: string }>('/employees/profile')
      setLoadingQR(false)
      if (res.success && res.data?.qrToken) {
        setQrToken(res.data.qrToken)
      } else {
        // Không lấy được token → đóng QR sau 3s
        setQrToken('')
        setTimeout(() => {
          setShowQR(false)
          Alert.alert('❌', 'Không thể lấy mã QR. Vui lòng thử lại.')
        }, 500)
      }
    } catch (e: any) {
      setLoadingQR(false)
      setQrToken('')
      setTimeout(() => {
        setShowQR(false)
        Alert.alert('❌', e.message || 'Lỗi kết nối')
      }, 500)
    }
  }

  // ── Clock-in trực tiếp (không QR) ────────────────────────────────────────
  const handleClockInDirect = async () => {
    try {
      const res = await api.post<{ clockInTime: string; isLate: boolean }>('/attendance/clock-in', {
        employeeId,
        method: 'MOBILE_APP',
      })
      if (res.success) {
        setIsClockedIn(true)
        Alert.alert('✅', res.data?.isLate ? 'Đã chấm công vào (muộn)' : 'Đã chấm công vào!')
      } else {
        Alert.alert('❌ Lỗi', res.message)
      }
    } catch (e: any) {
      Alert.alert('❌ Lỗi', e.message)
    }
  }

  // ── Clock-out trực tiếp ──────────────────────────────────────────────────
  const handleClockOut = async () => {
    try {
      const res = await api.post<{ clockOutTime: string }>('/attendance/clock-out', {
        employeeId,
        method: 'MOBILE_APP',
      })
      if (res.success) {
        setIsClockedOut(true)
        Alert.alert('✅', 'Đã chấm công ra!')
      } else {
        Alert.alert('❌ Lỗi', res.message)
      }
    } catch (e: any) {
      Alert.alert('❌ Lỗi', e.message)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    )
  }

  // ── Camera quét QR ───────────────────────────────────────────────────────
  // ── Hiện mã QR ───────────────────────────────────────────────────────────
  if (showQR) {
    return (
      <View style={styles.container}>
        <Text style={styles.qrTitle}>📱 Mã QR của bạn</Text>
        <Text style={styles.qrCountdown}>
          Hết hạn trong: <Text style={styles.countdownRed}>{qrCountdown}s</Text>
        </Text>
        {qrToken ? (
          <View style={styles.qrBox}>
            <Text style={styles.qrToken}>{qrToken}</Text>
            <Text style={styles.qrHint}>Quét mã này tại thiết bị chấm công</Text>
          </View>
        ) : (
          <Text style={styles.qrError}>Không thể tạo mã QR</Text>
        )}
        <TouchableOpacity style={styles.btnClose} onPress={() => setShowQR(false)}>
          <Text style={styles.btnCloseText}>✕ Đóng</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── Trang chính ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕐 Chấm công</Text>

      {employeeName ? (
        <Text style={styles.subtitle}>Xin chào, {employeeName}</Text>
      ) : null}

      {/* Trạng thái hôm nay */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Check-in:</Text>
          <Text style={[styles.statusValue, isClockedIn && styles.statusDone]}>
            {isClockedIn ? '✅ Đã chấm' : '⏳ Chưa chấm'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Check-out:</Text>
          <Text style={[styles.statusValue, isClockedOut && styles.statusDone]}>
            {isClockedOut ? '✅ Đã chấm' : '⏳ Chưa chấm'}
          </Text>
        </View>
      </View>

      {/* Nút hành động */}
      <View style={styles.btnGroup}>
        {/* Chưa clock-in → hiện QR khi bấm */}
        {!isClockedIn && (
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleChamCongVao}
            disabled={loadingQR}
          >
            {loadingQR ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>🕐 Chấm công vào</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Đã clock-in, chưa clock-out → cho clock-out */}
        {isClockedIn && !isClockedOut && (
          <TouchableOpacity style={styles.btnDanger} onPress={handleClockOut}>
            <Text style={styles.btnText}>🏁 Chấm công ra</Text>
          </TouchableOpacity>
        )}

        {/* Đã hoàn thành cả 2 */}
        {isClockedIn && isClockedOut && (
          <View style={styles.doneBox}>
            <Text style={styles.doneText}>✅ Đã hoàn thành chấm công hôm nay</Text>
          </View>
        )}
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  statusDone: {
    color: '#059669',
  },
  btnGroup: {
    width: '100%',
    gap: 12,
  },
  qrTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  qrCountdown: {
    fontSize: 14,
    color: '#6B7280',
  },
  countdownRed: {
    color: '#EF4444',
    fontWeight: '700',
  },
  qrBox: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  qrToken: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  qrHint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  qrError: {
    fontSize: 16,
    color: '#EF4444',
  },
  btnPrimary: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDanger: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    minHeight: 56,
    shadowColor: '#DC2626',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnClose: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#374151',
  },
  btnCloseText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  doneBox: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  doneText: {
    color: '#065F46',
    fontSize: 15,
    fontWeight: '700',
  },
})
