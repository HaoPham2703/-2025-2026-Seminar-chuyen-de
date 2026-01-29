import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { QrCode } from "lucide-react-native";
import ClockButton from "./ClockButton";
import TimeStats from "./TimeStats";
import LocationStatus from "./LocationStatus";
import ConfirmModal from "./ConfirmModal";
import StatusNotification from "./StatusNotification";
import EmployeeQrCard from "./EmployeeQrCard";
import { getEmployeeProfile } from "@/src/services/employeeService";
import { getCurrentAttendance, clockIn, clockOut, type AttendanceRecord } from "@/src/services/attendanceService";
import { getAuthToken } from "@/src/services/api";
import { RefreshableScrollView } from "@/components/refreshable-scroll-view";
import { useTabReload } from "@/hooks/use-tab-reload";
import { useTheme } from "@/src/hooks/use-theme";

const Index = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState<"success" | "late" | null>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [employeeCode, setEmployeeCode] = useState<string>("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Register reload function for tab double press
  const handleReload = useCallback(async () => {
    if (employeeId) {
      await loadUserData();
    }
  }, [employeeId]);

  const { scrollViewRef } = useTabReload(handleReload, 'index');

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
            setClockInTime(new Date(attendanceData.attendance.clockIn.time));
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
      setEmployeeCode(profileData.employee.employeeId || "");
      setQrCode(profileData.employee.qrCode?.code || null);

      // Load current attendance
      if (profileData.employee.id) {
        try {
          const attendanceData = await getCurrentAttendance(profileData.employee.id);
          if (attendanceData.attendance && attendanceData.isClockedIn && !attendanceData.isClockedOut) {
            setIsClockedIn(true);
            setClockInTime(new Date(attendanceData.attendance.clockIn.time));
            
            // Start timer to update working hours
            const interval = setInterval(() => {
              setCurrentTime(new Date());
            }, 1000);
            setTimerInterval(interval);
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

  const handleClockAction = async () => {
    if (isClockedIn) {
      setShowConfirmModal(true);
    } else {
      // Clock In via API
      try {
        if (!employeeId) {
          Alert.alert("Error", "Employee ID not found");
          return;
        }

        const result = await clockIn({
          employeeId,
          method: "MOBILE_APP",
        });

        const now = new Date(result.clockInTime);
        setClockInTime(now);
        setIsClockedIn(true);
        
        // Show notification
        setNotification(result.isLate ? "late" : "success");
        
        // Start timer to update working hours
        const interval = setInterval(() => {
          setCurrentTime(new Date());
        }, 1000);
        setTimerInterval(interval);

        // Reload attendance data
        const attendanceData = await getCurrentAttendance(employeeId);
        setCurrentAttendance(attendanceData.attendance);
      } catch (error: any) {
        console.error("Clock in error:", error);
        Alert.alert("Error", error.message || "Failed to clock in");
      }
    }
  };

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

        {/* QR Code Button */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(300)}
        >
          <TouchableOpacity
            style={[styles.qrButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowQrModal(true)}
            activeOpacity={0.7}
          >
            <QrCode size={20} color={colors.accent} />
            <Text style={[styles.qrButtonText, { color: colors.accent }]}>Mã QR của tôi</Text>
          </TouchableOpacity>
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
        employeeName={userName}
        employeeCode={employeeCode}
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

