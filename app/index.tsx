import React, { useState, useEffect, useRef } from "react";
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router } from "expo-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { 
  registerForPushNotificationsAsync, 
  setupNotificationListeners,
  storePushToken,
  startNotificationsListener,
  stopNotificationsListener,
  sendLocalNotification
} from "@/class/PushNotificationService";

// Configure notification behavior for the app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function IndexScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Notification related states
  const [lastNotificationDate, setLastNotificationDate] = useState<string | null>(null);
  const [notificationListenerActive, setNotificationListenerActive] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Check for permissions and authentication on mount
  useEffect(() => {
    // Check permissions
    checkPermissions(setLocation);
    
    // Load last notification date from storage
    const loadLastNotificationDate = async () => {
      try {
        const storedDate = await AsyncStorage.getItem('lastNotificationDate');
        if (storedDate) {
          setLastNotificationDate(storedDate);
        }
      } catch (error) {
        console.error("Error loading last notification date:", error);
      }
    };

    loadLastNotificationDate();
    
    // Set up notification listeners
    const unsubscribeNotifications = setupNotificationListeners(
      notification => {
        console.log('Notification received while app in foreground:', notification);
      },
      response => {
        console.log('User tapped notification:', response);
        
        // Handle notification interaction - navigate to appropriate screen
        const data = response.notification.request.content.data;
        
        if (data?.newsId) {
          // Navigate to the article
          router.navigate({
            pathname: "/news-detail",
            params: { id: data.newsId }
          });
        } else {
          // Navigate to notifications screen
          router.navigate("/user_notifications");
        }
      }
    );
    
    // Set up auth listener for notifications
    const auth = getAuth();
    
    // Check if user is already authenticated and set up notification listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User authenticated, setting up notification services");
        
        // Register for push notifications when user is authenticated
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await storePushToken(user.uid, token);
        }
        
        // Start listening for new notifications
        if (!notificationListenerActive) {
          startNotificationsListener(
            user.uid,
            lastNotificationDate,
            handleNewNotification
          );
          setNotificationListenerActive(true);
        }
      } else {
        console.log("User not authenticated, stopping notification services");
        
        // Stop listening for notifications when user logs out
        if (notificationListenerActive) {
          stopNotificationsListener();
          setNotificationListenerActive(false);
        }
      }
    });
    
    // Cleanup function
    return () => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
      unsubscribeAuth();
      if (notificationListenerActive) {
        stopNotificationsListener();
      }
    };
  }, [lastNotificationDate, notificationListenerActive]);

  // Handle new notifications from Firestore
  const handleNewNotification = async (notification) => {
    // Update last notification date in state and storage
    setLastNotificationDate(notification.date);
    await AsyncStorage.setItem('lastNotificationDate', notification.date);
    
    // Send a local notification
    let title = "New Notification";
    let body = notification.description;
    
    // If it's a news notification, use a specific title
    if (notification.newsId) {
      title = "New Article Available";
    }
    
    // Send the local notification
    await sendLocalNotification(title, body, {
      newsId: notification.newsId,
      notificationId: notification.id
    });
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