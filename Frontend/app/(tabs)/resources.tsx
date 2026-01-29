import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FadeScreenWrapper } from '@/components/fade-screen-wrapper';
import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { useTabReload } from '@/hooks/use-tab-reload';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEmployeeProfile } from '@/src/services/employeeService';
import {
  getLeaveRequests,
  getAttendanceAdjustments,
  type LeaveRequest,
  type AttendanceAdjustment,
} from '@/src/services/leaveService';

export default function ResourcesScreen() {
  const [employeeId, setEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [adjustments, setAdjustments] = useState<AttendanceAdjustment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const profile = await getEmployeeProfile();
      const id = profile.employee.id;
      setEmployeeId(id);

      const [leaves, adj] = await Promise.all([
        getLeaveRequests(id),
        getAttendanceAdjustments(id),
      ]);

      setLeaveRequests(leaves);
      setAdjustments(adj);
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách yêu cầu');
      setLeaveRequests([]);
      setAdjustments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReload = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  const { scrollViewRef } = useTabReload(handleReload, 'resources');

  return (
    <FadeScreenWrapper>
      <SafeAreaView style={styles.container} edges={['top']}>
        <RefreshableScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onRefresh={handleReload}
          refreshing={refreshing}
        >
          {/* Header giống Updates */}
          <View style={styles.header}>
            <Text style={styles.title}>Yêu cầu của tôi</Text>
            <Text style={styles.subtitle}>
              Theo dõi các yêu cầu nghỉ phép và điều chỉnh chấm công đã gửi
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="hsl(30, 55%, 55%)" />
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Yêu cầu nghỉ phép</Text>
                {leaveRequests.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có yêu cầu nghỉ phép nào</Text>
                ) : (
                  leaveRequests.map(item => (
                    <View key={item._id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.type}</Text>
                        <Text
                          style={[
                            styles.statusBadge,
                            item.status === 'APPROVED' && styles.statusApproved,
                            item.status === 'REJECTED' && styles.statusRejected,
                          ]}
                        >
                          {item.status === 'PENDING'
                            ? 'Đang duyệt'
                            : item.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : 'Từ chối'}
                        </Text>
                      </View>
                      <Text style={styles.cardText}>
                        Từ{' '}
                        {new Date(item.startDate).toLocaleDateString('vi-VN')}{' '}
                        đến{' '}
                        {new Date(item.endDate).toLocaleDateString('vi-VN')}
                      </Text>
                      <Text style={styles.cardReason}>{item.reason}</Text>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Yêu cầu điều chỉnh chấm công</Text>
                {adjustments.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có yêu cầu điều chỉnh nào</Text>
                ) : (
                  adjustments.map(item => (
                    <View key={item._id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>
                          Ngày {new Date(item.date).toLocaleDateString('vi-VN')}
                        </Text>
                        <Text
                          style={[
                            styles.statusBadge,
                            item.status === 'APPROVED' && styles.statusApproved,
                            item.status === 'REJECTED' && styles.statusRejected,
                          ]}
                        >
                          {item.status === 'PENDING'
                            ? 'Đang duyệt'
                            : item.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : 'Từ chối'}
                        </Text>
                      </View>
                      <Text style={styles.cardReason}>{item.reason}</Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </RefreshableScrollView>
      </SafeAreaView>
    </FadeScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'hsl(30, 50%, 97%)',
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
    borderBottomColor: 'hsl(30, 25%, 88%)',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'hsl(25, 15%, 50%)',
    marginBottom: 16,
  },
  loadingBox: {
    marginTop: 24,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 24,
    color: 'hsl(0, 70%, 55%)',
    fontSize: 14,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: 'hsl(25, 15%, 55%)',
  },
  card: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'hsl(30, 40%, 95%)',
    borderWidth: 1,
    borderColor: 'hsl(30, 25%, 88%)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
  },
  cardText: {
    fontSize: 13,
    color: 'hsl(25, 15%, 45%)',
    marginBottom: 2,
  },
  cardReason: {
    marginTop: 4,
    fontSize: 13,
    color: 'hsl(25, 15%, 45%)',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '600',
    color: 'hsl(30, 55%, 55%)',
    backgroundColor: 'hsl(30, 40%, 95%)',
  },
  statusApproved: {
    color: 'hsl(142, 76%, 36%)',
    backgroundColor: 'hsla(142, 76%, 36%, 0.1)',
  },
  statusRejected: {
    color: 'hsl(0, 84%, 60%)',
    backgroundColor: 'hsla(0, 84%, 60%, 0.1)',
  },
});

