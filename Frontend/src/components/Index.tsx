import { RefreshableScrollView } from "@/components/refreshable-scroll-view";
import { useTabReload } from "@/hooks/use-tab-reload";
import { useTheme } from "@/src/hooks/use-theme";
import { getAuthToken } from "@/src/services/api";
import { clockOut, getCurrentAttendance, type AttendanceRecord } from "@/src/services/attendanceService";
import { getEmployeeProfile, getEmployeeQrCode } from "@/src/services/employeeService";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ClockButton from "./ClockButton";
import ConfirmModal from "./ConfirmModal";
import EmployeeQrCard from "./EmployeeQrCard";
import LocationStatus from "./LocationStatus";
import StatusNotification from "./StatusNotification";
import TimeStats from "./TimeStats";

const Index = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState<"success" | "late" | null>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState<number | null>(null);
  const [qrExpiresIn, setQrExpiresIn] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const qrPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasClockedInRef = useRef<boolean>(false);

  // Register reload function for tab double press
  const handleReload = useCallback(async () => {
    if (employeeId) {
      await loadUserData();
    }
  }, [employeeId]);

  useTabReload(handleReload, 'index');

  // Load user info and current attendance
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      // Check if token exists before making API calls
      const token = await getAuthToken();
      if (!token) {
        console.warn('No token found, skipping data load');
        setLoading(false);
        return;
      }

      if (isMounted && !isLoadingData) {
        setIsLoadingData(true);
        await loadUserData();
        setIsLoadingData(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Refresh attendance when screen is focused (avoid needing manual reload)
  useFocusEffect(
    useCallback(() => {
      if (!employeeId) return () => {};
      let cancelled = false;

      (async () => {
        try {
          const token = await getAuthToken();
          if (!token) return;
          const attendanceData = await getCurrentAttendance(employeeId);
          if (cancelled) return;

          setCurrentAttendance(attendanceData.attendance);
          if (attendanceData.attendance && attendanceData.isClockedIn && !attendanceData.isClockedOut) {
            setIsClockedIn(true);
            if (attendanceData.attendance.clockIn?.time) {
              setClockInTime(new Date(attendanceData.attendance.clockIn.time));
            }
          } else {
            setIsClockedIn(false);
            setClockInTime(null);
          }
        } catch (e) {
          // non-critical
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [employeeId])
  );

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load user data from API
  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Verify token exists
      const token = await getAuthToken();
      if (!token) {
        console.warn('No token available for API call');
        setLoading(false);
        return;
      }

      // Load employee profile
      const profileData = await getEmployeeProfile();
      const firstName = profileData.employee.personalInfo.firstName || "";
      const lastName = profileData.employee.personalInfo.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim() || profileData.user.email;
      setUserName(fullName);
      setUserRole(profileData.employee.employment.position || "Employee");
      setEmployeeId(profileData.employee.id);
      setQrCode(profileData.employee.qrToken || profileData.employee.qrCode?.code || null);
      setQrExpiresIn(profileData.employee.qrTokenExpiresIn ?? null);
      setQrCountdown(profileData.employee.qrTokenExpiresIn ?? null);

      // Load current attendance
      if (profileData.employee.id) {
        try {
          const attendanceData = await getCurrentAttendance(profileData.employee.id);
          if (attendanceData.attendance && attendanceData.isClockedIn && !attendanceData.isClockedOut) {
            setIsClockedIn(true);
            if (attendanceData.attendance.clockIn?.time) {
              setClockInTime(new Date(attendanceData.attendance.clockIn.time));
            }
            
            // Start timer to update working hours
            const interval = setInterval(() => {
              setCurrentTime(new Date());
            }, 1000);
            setTimerInterval(interval as ReturnType<typeof setInterval>);
          }
          setCurrentAttendance(attendanceData.attendance);
        } catch (attendanceError: any) {
          console.warn("Error loading attendance (non-critical):", attendanceError);
          // Don't show alert for attendance error, just log it
        }
      }
    } catch (error: any) {
      console.error("Error loading user data:", error);
      // Only show alert for critical errors (not authentication errors that might be temporary)
      if (error.message && !error.message.includes('Authentication')) {
        Alert.alert("Error", error.message || "Failed to load user data");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const day = date.getDate();
    const dayPadded = day.toString().padStart(2, "0");
    return `${weekday} | ${month} ${dayPadded}`;
  };

  const getWorkingHours = () => {
    if (!clockInTime) return "00:00";
    const diff = currentTime.getTime() - clockInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const getBreakTime = () => {
    if (!currentAttendance) return "00:00";
    const breakMinutes = currentAttendance.breakDuration || 0;
    const hours = Math.floor(breakMinutes / 60);
    const minutes = breakMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const getOvertime = () => {
    if (!currentAttendance) return "00:00";
    const overtimeMinutes = currentAttendance.overtimeDuration || 0;
    const hours = Math.floor(overtimeMinutes / 60);
    const minutes = overtimeMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  // Check if late (clocked in after 9:00 AM)
  const isLate = () => {
    if (!clockInTime) return false;
    const clockInHour = clockInTime.getHours();
    const clockInMinute = clockInTime.getMinutes();
    return clockInHour > 9 || (clockInHour === 9 && clockInMinute > 0);
  };

  const refreshQr = useCallback(async () => {
    if (!employeeId) return;
    try {
      const qrResponse = await getEmployeeQrCode(employeeId);
      if (qrResponse?.qrToken) {
        setQrCode(qrResponse.qrToken);
      }
      if (typeof qrResponse?.expiresIn === "number") {
        setQrExpiresIn(qrResponse.expiresIn);
        setQrCountdown(qrResponse.expiresIn);
      }
    } catch {
      // ignore
    }
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) return;

    refreshQr();

    // Refresh QR token before it expires.
    const expiresSec = Math.max(qrExpiresIn ?? 10, 5);
    const intervalMs = Math.max((expiresSec - 1) * 1000, 3000);
    const interval = setInterval(refreshQr, intervalMs);

    return () => clearInterval(interval);
  }, [employeeId, qrExpiresIn, refreshQr]);

  useEffect(() => {
    if (qrCountdown === null) return;

    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          return qrExpiresIn ?? 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrCountdown, qrExpiresIn]);

  useEffect(() => {
    if (!showQrModal) return;
    refreshQr();
  }, [showQrModal, refreshQr]);

  const handleClockAction = async () => {
    if (isClockedIn) {
      setShowConfirmModal(true);
    } else {
      setShowQrModal(true);
    }
  };

  // Theo dõi để tự đóng modal + reload khi admin quét clock-in thành công
  useEffect(() => {
    if (!showQrModal || !employeeId) return;

    wasClockedInRef.current = isClockedIn;

    qrPollIntervalRef.current = setInterval(async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        const data = await getCurrentAttendance(employeeId);
        if (!qrPollIntervalRef.current) return;

        const justClockedIn = data.isClockedIn && !data.isClockedOut;
        if (justClockedIn && !wasClockedInRef.current) {
          clearInterval(qrPollIntervalRef.current);
          qrPollIntervalRef.current = null;
          setIsClockedIn(true);
          if (data.attendance?.clockIn?.time) {
            setClockInTime(new Date(data.attendance.clockIn.time));
          }
          setShowQrModal(false);
          loadUserData();
        }
      } catch { /* ignore */ }
    }, 2000);

    return () => {
      if (qrPollIntervalRef.current) {
        clearInterval(qrPollIntervalRef.current);
        qrPollIntervalRef.current = null;
      }
    };
  }, [showQrModal, employeeId]);

  const handleConfirmClockOut = async () => {
    try {
      if (!employeeId) {
        Alert.alert("Error", "Employee ID not found");
        return;
      }

      await clockOut({
        employeeId,
      });

      setIsClockedIn(false);
      setClockInTime(null);
      
      // Stop timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      setShowConfirmModal(false);

      // Reload attendance data
      const attendanceData = await getCurrentAttendance(employeeId);
      setCurrentAttendance(attendanceData.attendance);
    } catch (error: any) {
      console.error("Clock out error:", error);
      Alert.alert("Error", error.message || "Failed to clock out");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefreshableScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 20, 40) }
        ]}
        showsVerticalScrollIndicator={false}
        onRefresh={handleReload}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.header}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <Text style={[styles.welcomeText, { color: colors.text }]}>
                <Text style={[styles.welcomeHighlight, { color: colors.accent }]}>Welcome,</Text> {userName || "User"}
              </Text>
              <Text style={[styles.roleText, { color: colors.textSecondary }]}>{userRole || "Employee"}</Text>
            </>
          )}
        </Animated.View>

        {/* Time Display */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={styles.timeDisplay}
        >
          <Text style={[styles.currentTime, { color: colors.text }]}>{formatTime(currentTime)}</Text>
          <Text style={[styles.currentDate, { color: colors.textSecondary }]}>{formatDate(currentTime)}</Text>
        </Animated.View>

        {/* Clock Button */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(300)}
        >
          <ClockButton 
            isClockedIn={isClockedIn} 
            isLate={isLate()}
            onClick={handleClockAction} 
          />
        </Animated.View>

        {/* Location Status */}
        <LocationStatus isNearOffice={true} />

        {/* Time Stats */}
        <TimeStats
          workHours={getWorkingHours()}
          breakTime={getBreakTime()}
          overtime={getOvertime()}
          isClockedIn={isClockedIn}
          clockInTime={clockInTime ? formatTime(clockInTime) : undefined}
        />
      </RefreshableScrollView>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        totalTime={getWorkingHours()}
        onConfirm={handleConfirmClockOut}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Status Notification */}
      <StatusNotification
        type={notification}
        time={clockInTime ? formatTime(clockInTime) : undefined}
        onClose={() => setNotification(null)}
      />

      {/* QR Code Modal */}
      <EmployeeQrCard
        visible={showQrModal}
        onClose={() => setShowQrModal(false)}
        qrValue={qrCode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
  },
  welcomeHighlight: {
    // Color applied dynamically
  },
  roleText: {
    fontSize: 14,
    marginTop: 4,
  },
  timeDisplay: {
    alignItems: "center",
    marginBottom: 32,
  },
  currentTime: {
    fontSize: 64,
    fontWeight: "700",
    letterSpacing: -1,
  },
  currentDate: {
    marginTop: 8,
    fontSize: 14,
  },
  swipeHint: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default Index;
