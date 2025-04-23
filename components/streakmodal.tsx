// File: components/streakmodal.tsx
import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
} from "react-native";

interface StreakModalProps {
  visible: boolean;
  streak: number;
  level: number;
  experience: number; // Expected to be between 0 and 100
  onClose?: () => void;
}

export default function StreakModal({
  visible,
  streak,
  level,
  experience,
  onClose,
}: StreakModalProps) {
  useEffect(() => {
    console.log("StreakModal rendered. Visible:", visible);
  }, [visible]);

  if (!visible) return null; // Hide modal when not visible

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalHeader}>Streak Info</Text>
          <Text style={styles.modalText}>Streak: {streak}</Text>
          <Text style={styles.modalText}>Level: {level}</Text>
          <Text style={styles.modalText}>Experience: {experience}</Text>
          <View style={styles.statusBarContainer}>
            <View style={[styles.statusBarFill, { width: `${experience}%` }]} />
            <Text style={styles.statusBarText}>{experience}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start", // Place at the top
    alignItems: "center",
    paddingTop: 20, // Adjust as needed
  },
  modalContent: {
    width: "90%",
    height: "15%", // Increased height to accommodate the status bar
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 2,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
  },
  statusBarContainer: {
    marginTop: 8,
    width: "100%",
    height: 20, // Height of the status bar
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
  },
  statusBarFill: {
    height: "100%",
    backgroundColor: "#007bff",
  },
  statusBarText: {
    position: "absolute",
    right: 5,
    color: "#fff",
    fontWeight: "bold",
  },
});