import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export default function IndexScreen() {

  const auth = getAuth();

  useEffect(() => {
    const storedEmail = window.localStorage.getItem("emailForSignIn");
    const storedPassword = window.localStorage.getItem("passwordForSignIn");
    console.log('Executing');
    const handleLogin = async () => {
      try {
        console.log(storedEmail);
        const userCredential = await signInWithEmailAndPassword(auth, storedEmail, storedPassword);
        const user = userCredential.user;
        console.log("Logged in user:");
        // Successful login
        Alert.alert("Success", "Logged in successfully!");
        router.replace("./user_home"); // Navigate after successful login
      } catch (error: any) {
        // Handle specific error cases
        let errorMessage = "Login failed. Please try again.";
        if (error.code === 'auth/invalid-email') {
          errorMessage = "Invalid email address";
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = "Incorrect password";
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = "User not found";
        }
        Alert.alert("Error", errorMessage);
      }
    };
    handleLogin();
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLoginDisabled = !email.includes("@") || password.length < 8;

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Logged in user:");
      // Successful login
      Alert.alert("Success", "Logged in successfully!");
      router.replace("/user_home"); // Navigate after successful login
      window.localStorage.setItem('emailForSignIn', email);
      window.localStorage.setItem('passwordForSignIn', password);
    } catch (error: any) {
      // Handle specific error cases
      let errorMessage = "Login failed. Please try again.";
      if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "User not found";
      }
      Alert.alert("Error", errorMessage);
    }
  };

  const handleRegister = () => {
    console.log("Register button pressed");
    router.replace("./register");
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
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="#555"
          />
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, isLoginDisabled && styles.disabledButton]}
        disabled={isLoginDisabled}
        onPress={handleLogin}
      >
          <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      {/* Register Link */}
      <TouchableOpacity
        style={[styles.button]}
        onPress={handleRegister}
      >
          <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
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
  registerButton: { backgroundColor: "#03DAC5", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});