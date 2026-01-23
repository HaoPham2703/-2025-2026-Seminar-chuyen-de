import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { Clock } from "lucide-react-native";
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from "react-native-svg";

interface ConfirmModalProps {
  isOpen: boolean;
  totalTime: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ isOpen, totalTime, onConfirm, onCancel }: ConfirmModalProps) => {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Animated.View
          entering={ZoomIn.duration(200)}
          exiting={FadeOut}
          style={styles.modalContent}
        >
          {/* Modal Icon */}
          <View style={styles.modalIcon}>
            <Svg width={64} height={64} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="hsl(0, 75%, 55%)" />
                  <Stop offset="100%" stopColor="hsl(0, 65%, 50%)" />
                </LinearGradient>
              </Defs>
              <Circle cx="32" cy="32" r="32" fill="url(#iconGradient)" />
            </Svg>
            <View style={styles.iconContent}>
              <Clock size={32} color="white" strokeWidth={2} />
            </View>
          </View>

          <Text style={styles.modalTitle}>Clock Out?</Text>
          <Text style={styles.modalSubtitle}>You've worked for</Text>
          <Text style={styles.modalTime}>{totalTime}</Text>

          <View style={styles.modalButtons}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    maxWidth: 320,
    width: "100%",
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  iconContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "hsl(25, 30%, 20%)",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "hsl(25, 15%, 50%)",
  },
  modalTime: {
    fontSize: 32,
    fontWeight: "700",
    color: "hsl(25, 30%, 20%)",
    marginTop: 8,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "hsl(30, 30%, 90%)",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "hsl(25, 30%, 20%)",
    textAlign: "center",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "hsl(0, 75%, 55%)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
});

export default ConfirmModal;

