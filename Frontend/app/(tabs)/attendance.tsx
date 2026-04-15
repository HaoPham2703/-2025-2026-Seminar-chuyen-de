import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FadeScreenWrapper } from '@/components/fade-screen-wrapper';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { useTabReload } from '@/hooks/use-tab-reload';
import {
  ChevronDown,
  MoreVertical,
  Network,
  Home,
  ChevronUp,
} from 'lucide-react-native';
import { getAttendanceHistory, type AttendanceRecord as ApiAttendanceRecord } from '@/src/services/attendanceService';
import { getEmployeeProfile } from '@/src/services/employeeService';
import { getApprovedLeaves, type LeaveRequest } from '@/src/services/leaveService';
import LeaveRequestModal from '@/src/components/LeaveRequestModal';
import AttendanceAdjustmentModal from '@/src/components/AttendanceAdjustmentModal';
import { getAuthToken } from '@/src/services/api';
import { useTheme } from '@/src/hooks/use-theme';

interface AttendanceRecord {
  date: number;
  day: string;
  inTime: string;
  outTime: string;
  totalHours: string;
  status?: 'present' | 'absent' | 'late' | 'leave' | 'halfday';
  fullDate: Date;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  leave: number;
  halfDay: number;
  totalDays: number;
  workingDays: number;
  totalHours: number;
  expectedHours: number;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'August', 'Sep', 'Oct', 'Nov', 'Dec'];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

// Helper functions
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getDayOfWeek = (year: number, month: number, day: number): string => {
  const date = new Date(year, month, day);
  return daysOfWeek[date.getDay()];
};

const isWeekend = (year: number, month: number, day: number): boolean => {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
};

const calculateTotalHours = (inTime: string, outTime: string): string => {
  if (!inTime || !outTime || inTime === '-' || outTime === '-' || inTime === '00:00' || outTime === '00:00') {
    return '-';
  }

  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const inMinutes = parseTime(inTime);
  const outMinutes = parseTime(outTime);
  
  // Handle next day (e.g., clock out at 6:28 PM = 18:28)
  let outMinutesAdjusted = outMinutes;
  if (outMinutes < inMinutes) {
    outMinutesAdjusted = outMinutes + 24 * 60; // Add 24 hours
  }

  const totalMinutes = outMinutesAdjusted - inMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Generate sample attendance data for a given month/year
const generateAttendanceData = (year: number, month: number): AttendanceRecord[] => {
  const daysInMonth = getDaysInMonth(year, month);
  const records: AttendanceRecord[] = [];
  const workingDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .filter(day => !isWeekend(year, month, day)).length;

  // Generate random attendance data
  for (let day = 1; day <= daysInMonth; day++) {
    const fullDate = new Date(year, month, day);
    const dayOfWeek = getDayOfWeek(year, month, day);
    const isWeekendDay = isWeekend(year, month, day);

    let status: 'present' | 'absent' | 'late' | 'leave' | 'halfday' = 'present';
    let inTime = '-';
    let outTime = '-';
    let totalHours = '-';

    if (isWeekendDay) {
      // Weekend - usually absent or leave
      const rand = Math.random();
      if (rand < 0.3) {
        status = 'leave';
        inTime = '00:00';
        outTime = '00:00';
        totalHours = '00:00';
      } else {
        status = 'absent';
        inTime = '00:00';
        outTime = '00:00';
        totalHours = '00:00';
      }
    } else {
      // Working day
      const rand = Math.random();
      if (rand < 0.75) {
        // Present (75% chance)
        const hourIn = Math.floor(Math.random() * 2) + 8; // 8-9 AM
        const minuteIn = Math.floor(Math.random() * 60);
        inTime = `${hourIn.toString().padStart(2, '0')}:${minuteIn.toString().padStart(2, '0')}`;

        if (hourIn > 9 || (hourIn === 9 && minuteIn > 0)) {
          status = 'late';
        }

        // Clock out between 5 PM and 7 PM
        const hourOut = Math.floor(Math.random() * 3) + 17; // 17-19 (5-7 PM)
        const minuteOut = Math.floor(Math.random() * 60);
        outTime = `${hourOut.toString().padStart(2, '0')}:${minuteOut.toString().padStart(2, '0')}`;

        totalHours = calculateTotalHours(inTime, outTime);
      } else if (rand < 0.85) {
        // Absent (10% chance)
        status = 'absent';
        inTime = '00:00';
        outTime = '00:00';
        totalHours = '00:00';
      } else if (rand < 0.95) {
        // Leave (10% chance)
        status = 'leave';
        inTime = '00:00';
        outTime = '00:00';
        totalHours = '00:00';
      } else {
        // Half day (5% chance)
        status = 'halfday';
        const hourIn = 9;
        const minuteIn = Math.floor(Math.random() * 30);
        inTime = `${hourIn.toString().padStart(2, '0')}:${minuteIn.toString().padStart(2, '0')}`;
        outTime = '13:00';
        totalHours = calculateTotalHours(inTime, outTime);
      }
    }

    records.push({
      date: day,
      day: dayOfWeek,
      inTime,
      outTime,
      totalHours,
      status,
      fullDate,
    });
  }

  // Sort by date ascending (oldest first)
  return records;
};

// Calculate stats from records
const calculateStats = (records: AttendanceRecord[], year: number, month: number): AttendanceStats => {
  const daysInMonth = getDaysInMonth(year, month);
  const workingDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .filter(day => !isWeekend(year, month, day)).length;

  let present = 0;
  let absent = 0;
  let late = 0;
  let leave = 0;
  let halfDay = 0;
  let totalHours = 0;

  records.forEach(record => {
    switch (record.status) {
      case 'present':
        present++;
        break;
      case 'absent':
        absent++;
        break;
      case 'late':
        late++;
        present++; // Late is also counted as present
        break;
      case 'leave':
        leave++;
        break;
      case 'halfday':
        halfDay++;
        present++; // Half day is also counted as present
        break;
    }

    if (record.totalHours && record.totalHours !== '-' && record.totalHours !== '00:00') {
      const [hours, minutes] = record.totalHours.split(':').map(Number);
      totalHours += hours + minutes / 60;
    }
  });

  // Expected hours: working days * 8 hours
  const expectedHours = workingDays * 8;

  return {
    present,
    absent,
    late,
    leave,
    halfDay,
    totalDays: daysInMonth,
    workingDays,
    totalHours: Math.round(totalHours),
    expectedHours,
  };
};

interface CircularProgressProps {
  value: number;
  max: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress = ({
  value,
  max,
  color,
  size = 60,
  strokeWidth = 6,
}: CircularProgressProps) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.circularProgressContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(30, 25%, 88%)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.circularProgressText}>
        <Text style={styles.circularProgressValue}>{value}</Text>
        <Text style={styles.circularProgressMax}>/{max}</Text>
      </View>
    </View>
  );
};

interface YearPickerModalProps {
  visible: boolean;
  selectedYear: number;
  onSelectYear: (year: number) => void;
  onClose: () => void;
}

const YearPickerModal = ({ visible, selectedYear, onSelectYear, onClose }: YearPickerModalProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.yearPickerOverlay} onPress={onClose}>
        <Pressable style={styles.yearPickerContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.yearPickerHeader}>
            <Text style={styles.yearPickerTitle}>Chọn năm</Text>
            <Pressable onPress={onClose}>
              <ChevronUp size={24} color="hsl(25, 30%, 20%)" />
            </Pressable>
          </View>
          <ScrollView style={styles.yearPickerList}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearPickerItem,
                  selectedYear === year && styles.yearPickerItemActive,
                ]}
                onPress={() => {
                  onSelectYear(year);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.yearPickerItemText,
                    selectedYear === year && styles.yearPickerItemTextActive,
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

interface ContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onRegularize: () => void;
  onApplyLeave: () => void;
  position: { x: number; y: number };
}

const ContextMenu = ({
  visible,
  onClose,
  onRegularize,
  onApplyLeave,
  position,
}: ContextMenuProps) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.contextMenuOverlay} onPress={onClose}>
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={[styles.contextMenu, { top: Math.min(position.y, Dimensions.get('window').height - 200), right: 20 }]}
        >
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => {
              onRegularize();
              onClose();
            }}
          >
            <Network size={18} color="hsl(25, 30%, 20%)" />
            <Text style={styles.contextMenuText}>Điều chỉnh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => {
              onApplyLeave();
              onClose();
            }}
          >
            <Home size={18} color="hsl(25, 30%, 20%)" />
            <Text style={styles.contextMenuText}>Xin nghỉ phép</Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default function AttendanceScreen() {
  const { colors } = useTheme();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    halfDay: 0,
    totalDays: 0,
    workingDays: 0,
    totalHours: 0,
    expectedHours: 0,
  });
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    recordIndex: number;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    recordIndex: -1,
  });
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [isLoadingEmployeeId, setIsLoadingEmployeeId] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthScrollViewRef = useRef<any>(null);

  // Load employee ID on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadId = async () => {
      const token = await getAuthToken();
      if (!token) {
        console.warn('No token found, skipping employee ID load');
        setLoading(false);
        return;
      }

      if (isMounted && !isLoadingEmployeeId) {
        setIsLoadingEmployeeId(true);
        await loadEmployeeId();
        setIsLoadingEmployeeId(false);
      }
    };

    loadId();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load attendance data when year or month changes
  useEffect(() => {
    if (employeeId) {
      loadAttendanceData();
    }
  }, [selectedYear, selectedMonth, employeeId]);

  // Register reload function for tab double press
  const handleReload = useCallback(async () => {
    if (employeeId) {
      await loadAttendanceData();
    }
  }, [employeeId, selectedYear, selectedMonth]);

  const { scrollViewRef } = useTabReload(handleReload, 'attendance');

  // Refresh when screen is focused (so user doesn't need manual reload)
  useFocusEffect(
    React.useCallback(() => {
      if (employeeId) {
        loadAttendanceData();
      }
      return () => {};
    }, [employeeId, selectedYear, selectedMonth])
  );

  const loadEmployeeId = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.warn('No token available for API call');
        return;
      }

      const profileData = await getEmployeeProfile();
      setEmployeeId(profileData.employee.id);
    } catch (error: any) {
      console.error("Error loading employee ID:", error);
      // Don't show alert for authentication errors that might be temporary
      if (error.message && !error.message.includes('Authentication')) {
        Alert.alert("Error", error.message || "Failed to load employee data");
      }
    }
  };

  const loadAttendanceData = async () => {
    try {
      setLoading(true);

      // Verify token exists
      const token = await getAuthToken();
      if (!token) {
        console.warn('No token available for API call');
        setLoading(false);
        return;
      }

      // Calculate start and end date for the selected month
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);
      endDate.setHours(23, 59, 59, 999);

      // Load attendance history and approved leave requests in parallel
      const [historyData, approvedLeaves] = await Promise.all([
        getAttendanceHistory(employeeId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 100,
        }),
        getApprovedLeaves(employeeId),
      ]);

      // Map API records to UI format (include leave status)
      const mappedRecords = mapApiRecordsToUI(historyData.records, approvedLeaves, selectedYear, selectedMonth);
      const newStats = calculateStats(mappedRecords, selectedYear, selectedMonth);

      setRecords(mappedRecords);
      setStats(newStats);
    } catch (error: any) {
      console.error("Error loading attendance data:", error);
      // Don't show alert for authentication errors that might be temporary
      if (error.message && !error.message.includes('Authentication')) {
        Alert.alert("Error", error.message || "Failed to load attendance data");
      }
      setRecords([]);
      setStats({
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        halfDay: 0,
        totalDays: 0,
        workingDays: 0,
        totalHours: 0,
        expectedHours: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Map API attendance records to UI format
  // approvedLeaves: list of APPROVED leave requests — used to mark leave days
  const mapApiRecordsToUI = (
    apiRecords: ApiAttendanceRecord[],
    approvedLeaves: LeaveRequest[],
    year: number,
    month: number
  ): AttendanceRecord[] => {
    const daysInMonth = getDaysInMonth(year, month);
    const recordsMap = new Map<number, AttendanceRecord>();

    // Initialize all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day);
      const dayOfWeek = getDayOfWeek(year, month, day);

      recordsMap.set(day, {
        date: day,
        day: dayOfWeek,
        inTime: '-',
        outTime: '-',
        totalHours: '-',
        status: isWeekend(year, month, day) ? 'absent' : 'absent',
        fullDate,
      });
    }

    // Fill in actual attendance data
    apiRecords.forEach((apiRecord) => {
      const recordDate = new Date(apiRecord.date);
      const day = recordDate.getDate();

      if (recordDate.getFullYear() === year && recordDate.getMonth() === month) {
        const inTime = apiRecord.clockIn
          ? formatTimeFromDate(new Date(apiRecord.clockIn.time))
          : '-';
        const outTime = apiRecord.clockOut
          ? formatTimeFromDate(new Date(apiRecord.clockOut.time))
          : '-';
        const totalHours = apiRecord.workDuration
          ? formatHoursFromMinutes(apiRecord.workDuration)
          : '-';

        let status: 'present' | 'absent' | 'late' | 'leave' | 'halfday' = 'absent';
        if (apiRecord.status === 'PRESENT') {
          status = 'present';
        } else if (apiRecord.status === 'LATE') {
          status = 'late';
        } else if (apiRecord.status === 'HALF_DAY') {
          status = 'halfday';
        } else if (apiRecord.status === 'ABSENT') {
          status = 'absent';
        }

        // If an ABSENT record was created from an approved leave request, show it as 'leave'
        if (status === 'absent' && apiRecord.leaveRequestId) {
          status = 'leave';
        }

        recordsMap.set(day, {
          date: day,
          day: getDayOfWeek(year, month, day),
          inTime,
          outTime,
          totalHours,
          status,
          fullDate: recordDate,
        });
      }
    });

    // Mark approved leave days that have no attendance record yet
    approvedLeaves.forEach((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const current = new Date(start);

      while (current <= end) {
        if (current.getFullYear() === year && current.getMonth() === month) {
          const day = current.getDate();
          // Only override if this day is still 'absent' (no attendance record)
          const existing = recordsMap.get(day);
          if (existing && existing.status === 'absent') {
            recordsMap.set(day, {
              ...existing,
              status: 'leave',
              inTime: '-',
              outTime: '-',
              totalHours: '-',
            });
          }
        }
        current.setDate(current.getDate() + 1);
      }
    });

    return Array.from(recordsMap.values());
  };

  const formatTimeFromDate = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatHoursFromMinutes = (minutes: number): string => {
    // Defensive: never display negative durations
    const safeMinutes = Math.max(0, minutes || 0);
    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Scroll to current month on mount
  useEffect(() => {
    setTimeout(() => {
      if (monthScrollViewRef.current) {
        const scrollPosition = currentMonth * 100; // Approximate width per month button
        monthScrollViewRef.current.scrollTo({ x: scrollPosition, animated: true });
      }
    }, 100);
  }, []);

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    // Scroll to selected month
    setTimeout(() => {
      if (monthScrollViewRef.current) {
        const scrollPosition = monthIndex * 100;
        monthScrollViewRef.current.scrollTo({ x: scrollPosition, animated: true });
      }
    }, 100);
  };

  const handleContextMenu = (recordIndex: number) => {
    // Position menu near the button
    setContextMenu({
      visible: true,
      position: { x: 20, y: 400 + recordIndex * 60 },
      recordIndex,
    });
  };

  const handleRegularize = (recordIndex: number) => {
    const record = records[recordIndex];
    if (!record) return;
    setSelectedDate(record.fullDate);
    setShowAdjustmentModal(true);
  };

  const handleApplyLeave = (recordIndex: number) => {
    const record = records[recordIndex];
    if (!record) return;
    setSelectedDate(record.fullDate);
    setShowLeaveModal(true);
  };

  return (
    <FadeScreenWrapper>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onRefresh={handleReload}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Chấm công</Text>
          <Pressable
            style={styles.yearSelector}
            onPress={() => setShowYearPicker(true)}
          >
            <Text style={[styles.yearText, { color: colors.text }]}>{selectedYear}</Text>
            <ChevronDown size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNavigationContainer}>
          <ScrollView
            ref={monthScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthNavigation}
          >
            {months.map((month, index) => (
              <Pressable
                key={index}
                style={[
                  styles.monthButton,
                  selectedMonth === index && styles.monthButtonActive,
                ]}
                onPress={() => handleMonthSelect(index)}
              >
                <Text
                  style={[
                    styles.monthButtonText,
                    selectedMonth === index && styles.monthButtonTextActive,
                  ]}
                >
                  {month}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Attendance Summary */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.summaryContainer}
        >
          <View style={styles.totalSection}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Ngày</Text>
              <Text style={styles.totalValue}>
                {stats.present + stats.absent + stats.late + stats.leave + stats.halfDay}/{stats.totalDays}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Giờ</Text>
              <Text style={styles.totalValue}>
                {stats.totalHours}/{stats.expectedHours}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <CircularProgress
                value={stats.present}
                max={stats.totalDays}
                color="hsl(142, 76%, 36%)"
              />
              <View style={styles.statLabelContainer}>
                <Text style={styles.statLabelNumber}>
                  {stats.present}/{stats.totalDays}
                </Text>
                <Text style={styles.statLabelText}>CÓ MẶT</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <CircularProgress
                value={stats.absent}
                max={stats.totalDays}
                color="hsl(0, 84%, 60%)"
              />
              <View style={styles.statLabelContainer}>
                <Text style={styles.statLabelNumber}>
                  {stats.absent}/{stats.totalDays}
                </Text>
                <Text style={styles.statLabelText}>VẮNG MẶT</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <CircularProgress
                value={stats.late}
                max={stats.totalDays}
                color="hsl(45, 93%, 47%)"
              />
              <View style={styles.statLabelContainer}>
                <Text style={styles.statLabelNumber}>
                  {stats.late}/{stats.totalDays}
                </Text>
                <Text style={styles.statLabelText}>MUỘN</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <CircularProgress
                value={stats.leave}
                max={stats.totalDays}
                color="hsl(217, 91%, 60%)"
              />
              <View style={styles.statLabelContainer}>
                <Text style={styles.statLabelNumber}>
                  {stats.leave}/{stats.totalDays}
                </Text>
                <Text style={styles.statLabelText}>NGHỈ PHÉP</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <CircularProgress
                value={stats.halfDay}
                max={stats.totalDays}
                color="hsl(271, 81%, 56%)"
              />
              <View style={styles.statLabelContainer}>
                <Text style={styles.statLabelNumber}>
                  {stats.halfDay}/{stats.totalDays}
                </Text>
                <Text style={styles.statLabelText}>NỬA NGÀY</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Daily Log */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.dailyLogContainer}
        >
          <View style={styles.dailyLogHeader}>
            <View style={styles.dailyLogHeaderDate}>
              <Text style={styles.dailyLogHeaderText}>Ngày</Text>
            </View>
            <Text style={[styles.dailyLogHeaderText, styles.dailyLogHeaderTextCenter]}>Vào</Text>
            <Text style={[styles.dailyLogHeaderText, styles.dailyLogHeaderTextCenter]}>Ra</Text>
            <Text style={[styles.dailyLogHeaderText, styles.dailyLogHeaderTextCenter]}>Tổng giờ</Text>
            <View style={styles.dailyLogHeaderMenu} />
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Đang tải dữ liệu chấm công...</Text>
            </View>
          ) : records.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Không tìm thấy dữ liệu chấm công</Text>
            </View>
          ) : (
            records.map((record, index) => (
              <View
                key={`${record.date}-${record.day}-${index}`}
                style={[
                  styles.dailyLogRow,
                  record.status === 'absent' && styles.dailyLogRowAbsent,
                ]}
              >
                <View style={styles.dailyLogDate}>
                  <Text style={styles.dailyLogDateNumber}>{record.date}</Text>
                  <Text style={styles.dailyLogDateDay}>{record.day}</Text>
                </View>
                <Text style={styles.dailyLogTime}>{record.inTime}</Text>
                <Text style={styles.dailyLogTime}>{record.outTime}</Text>
                <Text style={styles.dailyLogTime}>{record.totalHours}</Text>
                <Pressable
                  style={styles.dailyLogMenu}
                  onPress={() => handleContextMenu(index)}
                >
                  <MoreVertical size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))
          )}
        </Animated.View>
      </RefreshableScrollView>

      {/* Year Picker Modal */}
      <YearPickerModal
        visible={showYearPicker}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        onClose={() => setShowYearPicker(false)}
      />

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        onClose={() => setContextMenu({ ...contextMenu, visible: false })}
        onRegularize={() => handleRegularize(contextMenu.recordIndex)}
        onApplyLeave={() => handleApplyLeave(contextMenu.recordIndex)}
        position={contextMenu.position}
      />
      <LeaveRequestModal
        visible={showLeaveModal}
        employeeId={employeeId}
        date={selectedDate}
        onClose={() => setShowLeaveModal(false)}
        onSubmitted={loadAttendanceData}
      />
      <AttendanceAdjustmentModal
        visible={showAdjustmentModal}
        employeeId={employeeId}
        date={selectedDate}
        onClose={() => setShowAdjustmentModal(false)}
        onSubmitted={loadAttendanceData}
      />
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
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthNavigationContainer: {
    marginVertical: 16,
  },
  monthNavigation: {
    paddingHorizontal: 20,
    gap: 12,
  },
  monthButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'hsl(30, 40%, 95%)',
    borderWidth: 1,
    borderColor: 'hsl(30, 25%, 88%)',
  },
  monthButtonActive: {
    backgroundColor: 'hsl(25, 30%, 20%)',
    borderColor: 'hsl(25, 30%, 20%)',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'hsl(25, 15%, 50%)',
  },
  monthButtonTextActive: {
    color: 'white',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  totalSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  totalItem: {
    flex: 1,
    padding: 16,
    backgroundColor: 'hsl(30, 40%, 95%)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'hsl(30, 25%, 88%)',
  },
  totalLabel: {
    fontSize: 12,
    color: 'hsl(25, 15%, 50%)',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    minWidth: '18%',
    maxWidth: '20%',
    alignItems: 'center',
    gap: 6,
  },
  statLabelContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statLabelNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
    textAlign: 'center',
    lineHeight: 12,
  },
  statLabelText: {
    fontSize: 7,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: 9,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 7.6,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
    textAlign: 'center',
    width: '100%',
    letterSpacing: -0.5,
    lineHeight: 7.5,
    includeFontPadding: false,
    flexShrink: 0,
    paddingHorizontal: 2,
  },
  circularProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressText: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  circularProgressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  circularProgressMax: {
    fontSize: 10,
    color: 'hsl(25, 15%, 50%)',
  },
  dailyLogContainer: {
    paddingHorizontal: 20,
  },
  dailyLogHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'hsl(30, 25%, 88%)',
    marginBottom: 8,
    alignItems: 'center',
  },
  dailyLogHeaderDate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyLogHeaderText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: 'hsl(25, 15%, 50%)',
    textTransform: 'uppercase',
  },
  dailyLogHeaderTextCenter: {
    textAlign: 'center',
  },
  dailyLogHeaderMenu: {
    width: 32,
  },
  dailyLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 25%, 88%)',
  },
  dailyLogRowAbsent: {
    backgroundColor: 'hsl(45, 93%, 95%)',
  },
  dailyLogDate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyLogDateNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: 'hsl(25, 30%, 20%)',
  },
  dailyLogDateDay: {
    fontSize: 12,
    color: 'hsl(25, 15%, 50%)',
  },
  dailyLogTime: {
    flex: 1,
    fontSize: 14,
    color: 'hsl(25, 30%, 20%)',
    textAlign: 'center',
  },
  dailyLogMenu: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: 'hsl(25, 15%, 50%)',
  },
  yearPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  yearPickerContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '50%',
  },
  yearPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 25%, 88%)',
  },
  yearPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  yearPickerList: {
    paddingHorizontal: 20,
  },
  yearPickerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(30, 25%, 88%)',
  },
  yearPickerItemActive: {
    backgroundColor: 'hsl(30, 40%, 95%)',
  },
  yearPickerItemText: {
    fontSize: 16,
    color: 'hsl(25, 30%, 20%)',
  },
  yearPickerItemTextActive: {
    fontWeight: '700',
    color: 'hsl(25, 30%, 20%)',
  },
  contextMenuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contextMenu: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 180,
    borderWidth: 1,
    borderColor: 'hsl(30, 25%, 88%)',
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  contextMenuText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'hsl(25, 30%, 20%)',
  },
});
