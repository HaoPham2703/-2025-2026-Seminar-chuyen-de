import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FadeScreenWrapper } from '@/components/fade-screen-wrapper';
import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { useTabReload } from '@/hooks/use-tab-reload';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyPayrolls, type Payroll } from '@/src/services/payrollService';
import { useTheme } from '@/src/hooks/use-theme';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const monthLabel = (month: number, year: number) => `Tháng ${month}/${year}`;

export default function PayrollScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    if (payrolls.length === 0) return null;
    const latest = payrolls[0];
    return {
      netSalary: latest.netSalary,
      period: latest.period,
      status: latest.status,
    };
  }, [payrolls]);

  const loadPayrolls = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getMyPayrolls();
      setPayrolls(data);
    } catch (e: any) {
      setError(e.message || 'Không thể tải phiếu lương');
      setPayrolls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPayrolls();
  }, [loadPayrolls]);

  const handleReload = useCallback(async () => {
    setRefreshing(true);
    await loadPayrolls();
  }, [loadPayrolls]);

  useTabReload(handleReload, 'payroll');

  return (
    <FadeScreenWrapper>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <RefreshableScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onRefresh={handleReload}
          refreshing={refreshing}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Phiếu lương</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Theo dõi lương đã được phê duyệt</Text>
          </View>

          {summary && (
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>              
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Mới nhất • {monthLabel(summary.period.month, summary.period.year)}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(summary.netSalary)}</Text>
              <Text style={[styles.summaryStatus, { color: colors.accent }]}>Trạng thái: {summary.status}</Text>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : payrolls.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có phiếu lương nào</Text>
          ) : (
            payrolls.map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>                
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{monthLabel(item.period.month, item.period.year)}</Text>
                  <Text style={[styles.statusBadge, { color: colors.accent }]}> {item.status} </Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Lương cơ bản</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{formatCurrency(item.baseSalary)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Phụ cấp</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{formatCurrency(item.allowancesTotal)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Khấu trừ</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{formatCurrency(item.deductionsTotal)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Thực nhận</Text>
                  <Text style={[styles.netValue, { color: colors.text }]}>{formatCurrency(item.netSalary)}</Text>
                </View>
              </View>
            ))
          )}
        </RefreshableScrollView>
      </SafeAreaView>
    </FadeScreenWrapper>
  );
}

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
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryStatus: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingBox: {
    marginTop: 24,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 24,
    fontSize: 14,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 24,
    fontSize: 14,
    paddingHorizontal: 20,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
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
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'hsla(30, 55%, 55%, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 13,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'hsla(30, 25%, 80%, 0.6)',
    marginVertical: 8,
  },
  netValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
