import { BlurView } from "expo-blur";
import React, { ReactNode } from "react";
import {
  Animated,
  DimensionValue,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  slideAnim: Animated.Value;
  children: ReactNode;
  height?: DimensionValue;
}

export const ModalSheet = ({
  visible,
  onClose,
  slideAnim,
  children,
  height = "60%",
}: ModalSheetProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlayBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>

      <Animated.View
        style={[styles.modalSheet, { transform: [{ translateY: slideAnim }], height }]}
      >
        <BlurView intensity={20} tint="light" style={styles.blurContainer}>
          <View style={styles.whiteGlassOverlay} />
          {children}
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    zIndex: 1,
  },
  modalSheet: {
    position: "absolute",
    bottom: 5,
    left: 7,
    right: 7,
    height: "60%",
    zIndex: 2,
    borderRadius: 35,
    overflow: "hidden",
    backgroundColor: "#f1f1f14f",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  blurContainer: {
    flex: 1,
  },
  whiteGlassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
});
