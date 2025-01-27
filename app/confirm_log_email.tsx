import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native"; // For navigation

export default function ConfirmLogEmailScreen() {
  const [verificationCode, setVerificationCode] = useState("");
  const navigation = useNavigation(); // Hook to navigate between screens

  const handleConfirm = () => {
    if (verificationCode === "123456") {
      Alert.alert("Success", "Email verified successfully!");
    } else {
      Alert.alert("Error", "Invalid verification code. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Return Arrow */}
      <TouchableOpacity
        style={styles.returnButton}
        onPress={() => navigation.goBack()} // Navigate back to the previous screen
      >
        <Text style={styles.returnButtonText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Verify Your Email</Text>
      <Text style={styles.description}>
        A verification code has been sent to your email. Please enter the code below to continue.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter verification code"
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={() => Alert.alert("Resent", "Verification code resent!")}
      >
        <Text style={styles.resendButtonText}>Resend Code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  returnButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
  },
  returnButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007BFF",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  input: {
    width: "90%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },
  confirmButton: {
    width: "90%",
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resendButton: {
    marginTop: 10,
  },
  resendButtonText: {
    color: "#007BFF",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});