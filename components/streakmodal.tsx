// File: components/streakmodal.tsx
import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

  // Calculate experience percentage capped at 100
  const expPercentage = Math.min(experience, 100);
  
  // Generate flame icons based on streak count (max 5 visible)
  const renderStreakFlames = () => {
    const flameCount = Math.min(streak, 5);
    const flames = [];
    
    for (let i = 0; i < flameCount; i++) {
      flames.push(
        <Ionicons 
          key={i} 
          name="flame" 
          size={24} 
          color={i < 3 ? "#ff9800" : "#ff5722"} 
          style={styles.flameIcon}
        />
      );
    }
    
    return flames;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          
          {/* Header */}
          <View style={styles.headerContainer}>
            <Ionicons name="trophy" size={30} color="#00bcd4" />
            <Text style={styles.modalHeader}>Daily Streak</Text>
          </View>
          
          {/* Streak section */}
          <View style={styles.streakContainer}>
            <View style={styles.streakIconContainer}>
              {renderStreakFlames()}
            </View>
            <Text style={styles.streakValue}>{streak} Day{streak !== 1 ? 's' : ''}</Text>
          </View>
          
          {/* Level and Experience */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="#00bcd4" />
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>{level}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={20} color="#00bcd4" />
              <Text style={styles.statLabel}>XP</Text>
              <Text style={styles.statValue}>{experience}</Text>
            </View>
          </View>
          
          {/* XP Progress bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Next Level</Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${expPercentage}%` }
                ]} 
              />
              <Text style={styles.progressText}>{expPercentage}%</Text>
            </View>
          </View>
          
          {/* Motivational message */}
          <Text style={styles.motivationalText}>
            {streak > 7 
              ? "Amazing streak! Keep it up!" 
              : streak > 3 
                ? "You're on fire! Don't stop now!"
                : "Come back tomorrow to increase your streak!"}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 50,
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 188, 212, 0.3)", // Light turquoise border
  },
  closeButton: {
    position: "absolute",
    top: -12,
    right: -12,
    backgroundColor: "#00bcd4",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  modalHeader: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#00bcd4",
  },
  streakContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  streakIconContainer: {
    flexDirection: "row",
    marginBottom: 5,
  },
  flameIcon: {
    marginHorizontal: 2,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 15,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginVertical: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  progressContainer: {
    width: "100%",
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  progressBarContainer: {
    height: 24,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#00bcd4",
    borderRadius: 12,
  },
  progressText: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    textAlignVertical: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  motivationalText: {
    fontSize: 14,
    color: "#00bcd4",
    fontWeight: "500",
    textAlign: "center",
    fontStyle: "italic",
  },
});