import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet
} from "react-native";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BootstrapStyles } from "@/app/styles/bootstrap";
import loginStyles from "@/app/styles/loginStyles";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }

    setIsLoading(true);
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "Check your email for password reset instructions.");
      router.back();
    } catch (error) {
      let errorMessage = "Password reset failed. Please try again.";
      if (error.code === "auth/invalid-email") errorMessage = "Invalid email address";
      if (error.code === "auth/user-not-found") errorMessage = "User not found";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={loginStyles.gradientBackground.colors}
      start={loginStyles.gradientBackground.start}
      end={loginStyles.gradientBackground.end}
      style={BootstrapStyles.container}
    >
      <View style={[
        BootstrapStyles.container, 
        BootstrapStyles.justifyContentCenter, 
        BootstrapStyles.alignItemsCenter,
        loginStyles.mainContainer
      ]}>
        <View style={[BootstrapStyles.p4, loginStyles.formCard]}>
          {/* Header with back button */}
          <View style={loginStyles.formHeader}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.replace("/")}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={loginStyles.formHeaderText}>Reset Password</Text>
              <View style={styles.spacer} />
            </View>
          </View>
          
          <View style={loginStyles.formBody}>
            <Text style={styles.instructions}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            
            {/* Email Input */}
            <View style={[BootstrapStyles.w100, BootstrapStyles.alignItemsCenter]}>
              <TextInput
                placeholder="Email"
                style={[BootstrapStyles.formControl, loginStyles.formInput]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#777"
              />
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[
                BootstrapStyles.btn,
                loginStyles.actionButton,
                (!email.includes("@")) && loginStyles.disabledButton,
                BootstrapStyles.mt4
              ]}
              disabled={!email.includes("@") || isLoading}
              onPress={handlePasswordReset}
            >
              <Text style={loginStyles.buttonText}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Text>
            </TouchableOpacity>

            {/* Back to Login Button */}
            <TouchableOpacity 
              style={[BootstrapStyles.btn, loginStyles.registerButton]} 
              onPress={() => router.replace("/")}
              disabled={isLoading}
            >
              <Text style={loginStyles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    padding: 8,
  },
  spacer: {
    width: 40, // This creates balance with the back button
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
});