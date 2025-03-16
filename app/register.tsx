import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { BootstrapStyles } from "@/app/styles/bootstrap";

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

  const handleBackPress = () => {
    router.replace("/");
  };

  return (
    <LinearGradient
      colors={['#4dc9ff', '#00bfa5']} // Sky blue to turquoise green
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={BootstrapStyles.container}
    >
      {/* Navigation Header */}
      <View style={[
        BootstrapStyles.flexRow,
        BootstrapStyles.alignItemsCenter,
        BootstrapStyles.py3,
        BootstrapStyles.mb4,
        styles.navHeader
      ]}>
        <TouchableOpacity 
          style={[BootstrapStyles.p2, BootstrapStyles.ml2]} 
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[
          BootstrapStyles.textH3, 
          BootstrapStyles.ml3,
          BootstrapStyles.flexGrow,
          BootstrapStyles.textWhite
        ]}>Get News</Text>
      </View>

      <View style={[
        BootstrapStyles.container, 
        BootstrapStyles.justifyContentCenter, 
        BootstrapStyles.alignItemsCenter,
        styles.mainContainer
      ]}>
        <Text style={[BootstrapStyles.textH2, BootstrapStyles.textWhite, styles.registerTitle]}>Register</Text>
        <View style={[BootstrapStyles.p4, styles.formCard]}>
          <View style={styles.formHeader}>
            <Text style={styles.formHeaderText}>Register Account</Text>
          </View>
          
          <View style={styles.formBody}>
            {/* Username Input */}
            <View style={[BootstrapStyles.w100, BootstrapStyles.alignItemsCenter]}>
              <TextInput
                placeholder="User Name"
                style={[BootstrapStyles.formControl, styles.formInput]}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor="#777"
              />
            </View>

            {/* Email Input */}
            <View style={[BootstrapStyles.w100, BootstrapStyles.alignItemsCenter]}>
              <TextInput
                placeholder="Email"
                style={[BootstrapStyles.formControl, styles.formInput]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#777"
              />
            </View>

            {/* Password Input */}
            <View style={[BootstrapStyles.w100, BootstrapStyles.alignItemsCenter]}>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Password"
                  style={[BootstrapStyles.formControl, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#777"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#555" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={[BootstrapStyles.w100, BootstrapStyles.alignItemsCenter]}>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Confirm Password"
                  style={[BootstrapStyles.formControl, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#777"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#555" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                BootstrapStyles.btn,
                styles.registerButton,
                isRegistrationDisabled && styles.disabledButton,
                BootstrapStyles.mt4
              ]}
              disabled={isRegistrationDisabled}
              onPress={handleRegistration}
            >
              <Text style={[BootstrapStyles.textWhite, BootstrapStyles.textCenter, styles.buttonText]}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 1000,
    backgroundColor: '#00bcd4', // Turquoise color
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  mainContainer: {
    marginTop: 60, // Add space for the fixed header
    paddingTop: 20,
    height: '100%',
  },
  registerTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    display: 'none', // Hide this since we now have the title in the form header
  },
  formCard: {
    width: '95%', // 95% of the width as requested
    height: '75%', // Increased from 60% to 75% to make it bigger
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderTopWidth: 5,
    borderTopColor: '#00bcd4',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 0, // Remove padding to add it in formBody instead
  },
  formHeader: {
    backgroundColor: '#00bcd4',
    width: '100%',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1
  },
  formHeaderText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  formBody: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(240, 248, 255, 0.5)', // Light blue background
  },
  formInput: {
    width: '95%',
    marginBottom: 20,
    height: 55,
    marginTop: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cde1f9',
    borderRadius: 8,
    shadowColor: '#a6c8ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  passwordContainer: {
    width: '95%',
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
    shadowColor: '#a6c8ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    paddingRight: 40, // Space for the eye icon
    height: 55,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cde1f9',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
    padding: 10,
  },
  registerButton: {
    width: '95%',
    height: 55,
    backgroundColor: '#00bcd4', // Turquoise color
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 20,
  },
  disabledButton: { 
    backgroundColor: '#ccc' 
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});