import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  OAuthProvider,
} from "firebase/auth";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

export default function IndexScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(false);
  
  // Two separate states for the two modals
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const auth = getAuth();

  useEffect(() => {
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

  // Location Modal Handlers
  const handleAllowLocation = async () => {
    await requestLocationPermission();
    setShowLocationModal(false);
    setShowNotificationModal(true); // Show notifications modal next
  };

  const handleDenyLocation = () => {
    Alert.alert(
      "Location Permission Required",
      "Location permission is required for the app to work properly."
    );
    setShowLocationModal(false);
    setShowNotificationModal(true); // Proceed to notifications modal even if location is denied
  };

  // Notification Modal Handlers
  const handleAllowNotification = async () => {
    await requestNotificationPermission();
    setShowNotificationModal(false);
  };

  const handleDenyNotification = () => {
    Alert.alert(
      "Notification Permission Required",
      "Notification permission is required for the app to work properly."
    );
    setShowNotificationModal(false);
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in user:", userCredential.user.uid);
      Alert.alert("Success", "Logged in successfully!");
      router.replace("/user_home");
    } catch (error: any) {
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

  // Social login functions (placeholders—you can implement your Firebase logic here)
  const handleGoogleLogin = async () => {
    try {
      Alert.alert("Google Sign In", "Google sign in pressed (logic not implemented)");
    } catch (error) {
      console.error("Error with Google sign in:", error);
      Alert.alert("Error", "Google sign in failed");
    }
  };

  const handleAppleLogin = async () => {
    try {
      Alert.alert("Apple Sign In", "Apple sign in pressed (logic not implemented)");
    } catch (error) {
      console.error("Error with Apple sign in:", error);
      Alert.alert("Error", "Apple sign in failed");
    }
  };

  // Facebook login function
  const handleFacebookLogin = async () => {
    try {
      Alert.alert("Facebook Sign In", "Facebook sign in pressed (logic not implemented)");
    } catch (error) {
      console.error("Error with Facebook sign in:", error);
      Alert.alert("Error", "Facebook sign in failed");
    }
  };

  return (
    <View style={styles.container}>
      {/* Modal for Location Permission */}
      <Modal visible={showLocationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Location Permission Required</Text>
            <Text style={styles.modalMessage}>
              This app requires access to your location. Please grant location permission.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleAllowLocation}>
                <Text style={styles.modalButtonText}>Allow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonDeny]} onPress={handleDenyLocation}>
                <Text style={styles.modalButtonText}>Deny</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for Notification Permission */}
      <Modal visible={showNotificationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Notification Permission Required</Text>
            <Text style={styles.modalMessage}>
              This app requires access to notifications. Please grant notification permission.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleAllowNotification}>
                <Text style={styles.modalButtonText}>Allow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonDeny]} onPress={handleDenyNotification}>
                <Text style={styles.modalButtonText}>Deny</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
      <TouchableOpacity onPress={() => router.push("/forgot_password")}>
  <Text style={{ color: "#007bff", textAlign: "center", marginTop: 10 }}>
    Forgot Password?
  </Text>
</TouchableOpacity>


      {/* Register Button */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      {/* Social Login Buttons */}
      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
          <Ionicons name="logo-google" size={24} color="#EA4335" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin}>
          <Ionicons name="logo-apple" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={handleFacebookLogin}>
          <Ionicons name="logo-facebook" size={24} color="#3b5998" />
        </TouchableOpacity>
      </View>

      {/* Display Location (For Debugging) */}
      {location && (
        <Text style={styles.infoText}>
          Location: {location.latitude}, {location.longitude}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20, 
    backgroundColor: "#f9f9f9" 
  },
  title: { 
    fontSize: 32, 
    fontWeight: "bold", 
    marginBottom: 10 
  },
  subtitle: { 
    fontSize: 16, 
    color: "#555", 
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
  infoText: { 
    fontSize: 14, 
    color: "#666", 
    marginTop: 10 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#6200EE",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonDeny: {
    backgroundColor: "#D32F2F",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  socialContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  socialButton: {
    width: 50,
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    borderRadius: 8,
  },
});
