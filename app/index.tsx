import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BootstrapStyles } from "@/app/styles/bootstrap";
import loginStyles from "@/app/styles/loginStyles";
import { checkPermissions } from "@/utils/permissionUtils";
import { 
  handleEmailLogin, 
  navigateToRegister, 
  navigateToForgotPassword,
  handleGoogleSignIn,
  handleAppleSignIn,
  handleFacebookSignIn,
  checkAuthentication
} from "@/utils/authUtils";

export default function IndexScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for permissions and authentication on mount
  useEffect(() => {
    // Check permissions
    checkPermissions(setLocation);
    
    // Check if user is already authenticated
    let unsubscribeAuth;
    checkAuthentication()
      .then(unsubscribe => {
        unsubscribeAuth = unsubscribe;
      })
      .catch(err => {
        console.error("Failed to set up authentication:", err);
      });
    
    // Cleanup function
    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, []);

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
          <View style={loginStyles.formHeader}>
            <Text style={loginStyles.formHeaderText}>Welcome Back</Text>
          </View>
          
          <View style={loginStyles.formBody}>
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

            {/* Password Input */}
            <View style={[BootstrapStyles.w100, BootstrapStyles.alignItemsCenter]}>
              <View style={loginStyles.passwordContainer}>
                <TextInput
                  placeholder="Password"
                  style={[BootstrapStyles.formControl, loginStyles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#777"
                />
                <TouchableOpacity
                  style={loginStyles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#555" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => navigateToForgotPassword()} style={loginStyles.forgotPasswordLink}>
              <Text style={loginStyles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                BootstrapStyles.btn,
                loginStyles.actionButton,
                (!email.includes("@") || password.length < 6) && loginStyles.disabledButton,
              ]}
              disabled={!email.includes("@") || password.length < 6 || isLoading}
              onPress={() => handleEmailLogin(email, password, setIsLoading)}
            >
              <Text style={loginStyles.buttonText}>
                {isLoading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity 
              style={[BootstrapStyles.btn, loginStyles.registerButton]} 
              onPress={() => navigateToRegister()}
              disabled={isLoading}
            >
              <Text style={loginStyles.buttonText}>Register</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={loginStyles.divider}>
              <View style={loginStyles.dividerLine} />
              <Text style={loginStyles.dividerText}>OR</Text>
              <View style={loginStyles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={loginStyles.socialButtonsContainer}>
              <TouchableOpacity 
                style={loginStyles.socialButton} 
                onPress={() => handleGoogleSignIn(setIsLoading)}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={24} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={loginStyles.socialButton} 
                onPress={() => handleAppleSignIn(setIsLoading)}
                disabled={isLoading}
              >
                <Ionicons name="logo-apple" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={loginStyles.socialButton} 
                onPress={() => handleFacebookSignIn(setIsLoading)}
                disabled={isLoading}
              >
                <Ionicons name="logo-facebook" size={24} color="#3b5998" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}