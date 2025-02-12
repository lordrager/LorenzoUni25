import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Disable registration if any field is invalid
  const isRegistrationDisabled =
    !username.trim() ||
    !email.includes("@") ||
    password !== confirmPassword ||
    password.length === 0;

  const auth = getAuth();

  const handleRegistration = async () => {
    // Store the username, email, and password locally for later use.
    window.localStorage.setItem("usernameForSignIn", username);
    window.localStorage.setItem("emailForSignIn", email);
    window.localStorage.setItem("passwordForSignIn", password);
    console.log("Username:", username);
    console.log("Email:", email);
    router.replace("./preffered_news"); // Navigate after successful registration
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      {/* Username Input */}
      <TextInput
        placeholder="User Name"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      {/* Email Input */}
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password Input */}
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Confirm Password Input */}
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Confirm Password"
          style={styles.passwordInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, isRegistrationDisabled && styles.disabledButton]}
        disabled={isRegistrationDisabled}
        onPress={handleRegistration}
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 20, 
    backgroundColor: "#f9f9f9" 
  },
  title: { 
    fontSize: 32, 
    fontWeight: "bold", 
    marginBottom: 20 
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  passwordInput: { 
    flex: 1, 
    padding: 15 
  },
  eyeIcon: { 
    paddingHorizontal: 10 
  },
  button: {
    width: "100%",
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  disabledButton: { 
    backgroundColor: "#ccc" 
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
});