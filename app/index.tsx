import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

export default function IndexScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    const checkPermissions = async () => {
      await requestLocationPermission();
      await requestNotificationPermission();
    };

    checkPermissions();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User already logged in:", user.uid);
        router.replace("/user_home"); // Redirect if logged in
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  /** 📍 Request Location Permission */
  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission denied.");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      console.log("User location:", loc.coords);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  /** 🔔 Request Notification Permission */
  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setNotificationPermission(true);
        console.log("Notification permission granted.");
      } else {
        console.warn("Notification permission denied.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in user:", userCredential.user.uid);
      Alert.alert("Success", "Logged in successfully!");
      router.replace("/user_home");
    } catch (error) {
      let errorMessage = "Login failed. Please try again.";
      if (error.code === "auth/invalid-email") errorMessage = "Invalid email address";
      if (error.code === "auth/wrong-password") errorMessage = "Incorrect password";
      if (error.code === "auth/user-not-found") errorMessage = "User not found";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleRegister = () => {
    router.replace("/register");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Login or Register to Continue</Text>

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
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, (!email.includes("@") || password.length < 8) && styles.disabledButton]}
        disabled={!email.includes("@") || password.length < 8}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      {/* Register Button */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      {/* Display Location (For Debugging) */}
      {location && (
        <Text style={styles.infoText}>
          Location: {location.latitude}, {location.longitude}
        </Text>
      )}

      {/* Display Notification Status (For Debugging) */}
      <Text style={styles.infoText}>
        Notifications: {notificationPermission ? "Enabled" : "Disabled"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 20 },
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
  passwordInput: { flex: 1, padding: 15 },
  eyeIcon: { paddingHorizontal: 10 },
  button: {
    width: "100%",
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  disabledButton: { backgroundColor: "#ccc" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  infoText: { fontSize: 14, color: "#666", marginTop: 10 },
});