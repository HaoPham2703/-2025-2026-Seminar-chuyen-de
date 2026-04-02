import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeScreenWrapper } from '@/components/fade-screen-wrapper';
import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { useTabReload } from '@/hooks/use-tab-reload';
import { useTheme } from '@/src/hooks/use-theme';
import { getEmployeeProfile, getPayslips, type Payslip } from '@/src/services/employeeService';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PayslipsScreen() {
  const { colors } = useTheme();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthOptions = useMemo(() => {
    const now = new Date();
    return [0, 1, 2].map((offset) => {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return {
        label: `${monthLabels[date.getMonth()]} ${date.getFullYear()}`,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    });
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);

  const loadPayslips = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const profile = await getEmployeeProfile();
      const id = profile.employee.id;
      const data = await getPayslips(id, {
        year: selectedMonth.year,
        month: selectedMonth.month,
      });
      setPayslips(data);
    } catch (e: any) {
      setPayslips([]);
      setError(e.message || 'Không thể tải phiếu lương');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadPayslips();
  }, [loadPayslips]);

  const handleReload = useCallback(async () => {
    setRefreshing(true);
    await loadPayslips();
  }, [loadPayslips]);

  useTabReload(handleReload, 'payslips');

  return (
    <FadeScreenWrapper>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <RefreshableScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onRefresh={handleReload}
          refreshing={refreshing}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Phiếu lương</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Theo dõi thu nhập hàng tháng đã được duyệt</Text>
          </View>

          <View style={styles.monthSelector}>
            {monthOptions.map((option) => (
              <TouchableOpacity
                key={`${option.year}-${option.month}`}
                style={[
                  styles.monthChip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  selectedMonth.month === option.month && selectedMonth.year === option.year && {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => setSelectedMonth(option)}
              >
                <Text
                  style={[
                    styles.monthChipText,
                    { color: colors.textSecondary },
                    selectedMonth.month === option.month && selectedMonth.year === option.year && {
                      color: 'white',
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải phiếu lương...</Text>
            </View>
          ) : error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : payslips.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có phiếu lương được duyệt.</Text>
          ) : (
            payslips.map((payslip) => (
              <View key={payslip.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Tháng {payslip.month}/{payslip.year}</Text>
                  <Text style={[styles.statusBadge, { color: colors.success, backgroundColor: colors.success + '20' }]}>Đã duyệt</Text>
                </View>

                <View style={styles.summaryRow}>
                  <View>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tổng thu nhập</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(payslip.totals?.gross || 0, payslip.currency)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Thực nhận</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(payslip.totals?.net || 0, payslip.currency)}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Thu nhập</Text>
                  {payslip.earnings.length === 0 ? (
                    <Text style={[styles.itemText, { color: colors.textSecondary }]}>Không có dữ liệu.</Text>
                  ) : (
                    payslip.earnings.map((item, index) => (
                      <View key={`earn-${index}`} style={styles.itemRow}>
                        <Text style={[styles.itemLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                        <Text style={[styles.itemValue, { color: colors.text }]}>{formatCurrency(item.amount, payslip.currency)}</Text>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Khấu trừ</Text>
                  {payslip.deductions.length === 0 ? (
                    <Text style={[styles.itemText, { color: colors.textSecondary }]}>Không có dữ liệu.</Text>
                  ) : (
                    payslip.deductions.map((item, index) => (
                      <View key={`ded-${index}`} style={styles.itemRow}>
                        <Text style={[styles.itemLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                        <Text style={[styles.itemValue, { color: colors.text }]}>{formatCurrency(item.amount, payslip.currency)}</Text>
                      </View>
                    ))
                  )}
                </View>

                {payslip.notes ? (
                  <Text style={[styles.notesText, { color: colors.textSecondary }]}>Ghi chú: {payslip.notes}</Text>
                ) : null}
              </View>
            ))
          )}
        </RefreshableScrollView>
      </SafeAreaView>
    </FadeScreenWrapper>
  );
}

const formatCurrency = (amount: number, currency: string) => {
  return `${amount.toLocaleString('vi-VN')} ${currency}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  monthSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  monthChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    marginTop: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  errorText: {
    marginTop: 24,
    paddingHorizontal: 20,
    fontSize: 14,
  },
  emptyText: {
    marginTop: 24,
    paddingHorizontal: 20,
    fontSize: 14,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 12,
  },
  itemValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemText: {
    fontSize: 12,
  },
  notesText: {
    marginTop: 8,
    fontSize: 12,
  },
});
