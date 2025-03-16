import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { BootstrapStyles } from "@/app/styles/bootstrap";
import { getUser } from "@/class/User";

// Global variables to track permissions (not persisted across app restarts)
let locationPermissionRequested = false;
let notificationPermissionRequested = false;

export default function IndexScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const auth = getAuth();

  // Async function for authentication checking - defined outside useEffect
  const checkAuthentication = async () => {
    return new Promise((resolve, reject) => {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            console.log("User authenticated:", user.uid);
            try {
              // Check if user data exists in database before redirecting
              const userData = await getUser(user.uid);
              if (userData) {
                console.log("User data found, navigating to home screen");
                await router.replace("/user_home"); // Redirect only if user data exists
              } else {
                console.log("User authenticated but no user data found");
                // Option: Could sign out the user here to fix broken state
                // await auth.signOut();
              }
            } catch (dataError) {
              console.error("Error fetching user data:", dataError);
              // Don't redirect if we can't verify user data exists
            }
          }
          // Resolve with the unsubscribe function
          resolve(unsubscribe);
        });
      } catch (err) {
        console.error("Authentication check error:", err);
        reject(err);
      }
    });
  };

  // Check for permissions only once
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check if location permission hasn't been requested yet
        if (!locationPermissionRequested) {
          console.log("Requesting location permission for the first time");
          const { status } = await Location.requestForegroundPermissionsAsync();
          console.log("Location permission status:", status);
          
          locationPermissionRequested = true;
          
          if (status === "granted") {
            try {
              // Get location if permission granted
              let loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
              });
              setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
              console.log("User location obtained:", loc.coords);
            } catch (locError) {
              console.error("Failed to get location:", locError);
            }
          }
        }
        
        // Check if notification permission hasn't been requested yet
        if (!notificationPermissionRequested) {
          console.log("Requesting notification permission for the first time");
          const { status } = await Notifications.requestPermissionsAsync();
          console.log("Notification permission status:", status);
          
          notificationPermissionRequested = true;
          
          if (status === "granted") {
            console.log("Notification permission granted");
          }
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
      }
    };
    
    checkPermissions();

    // Variable to store unsubscribe function
    let unsubscribeAuth;

    // Call the async authentication function
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

  const handleLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in user:", userCredential.user.uid);
      
      // Check if user data exists before redirecting
      const userData = await getUser(userCredential.user.uid);
      if (userData) {
        Alert.alert("Success", "Logged in successfully!");
        try {
          router.replace("/user_home");
        } catch (navError) {
          console.error("Navigation error:", navError);
          // Fallback navigation if replace fails
          router.push("/");
        }
      } else {
        console.log("User authenticated but no user data found");
        Alert.alert("Account Issue", "Your account exists but profile data is missing. Please contact support.");
      }
    } catch (error: any) {
      let errorMessage = "Login failed. Please try again.";
      if (error.code === "auth/invalid-email") errorMessage = "Invalid email address";
      if (error.code === "auth/wrong-password") errorMessage = "Incorrect password";
      if (error.code === "auth/user-not-found") errorMessage = "User not found";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    try {
      router.replace("/register");
    } catch (navError) {
      console.error("Navigation error:", navError);
      // Fallback navigation if replace fails
      router.push("/register");
    }
  };

  const handleForgotPassword = () => {
    try {
      router.push("/forgot_password");
    } catch (navError) {
      console.error("Navigation error:", navError);
    }
  };

  // Social login functions
  const handleGoogleLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // On web, we can use signInWithPopup
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        // For native, we'd need to use a deeper integration
        // This is a simplified example - in a real app, you'd need to integrate
        // with the native Google Sign-In SDK
        console.log("Attempting Google sign in on native platform");
        Alert.alert(
          "Google Sign In",
          "To fully implement this, you'll need the expo-auth-session package or React Native Firebase SDK for native platforms."
        );
        
        // Mock successful login for demonstration
        // In a real implementation, you would get the idToken from Google SDK
        // and create a credential with it
        
        // const credential = GoogleAuthProvider.credential(idToken);
        // await signInWithCredential(auth, credential);
      }
    } catch (error) {
      console.error("Error with Google sign in:", error);
      Alert.alert("Error", "Google sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (Platform.OS === 'ios') {
        // On iOS, you'd need to use the native Apple Sign In
        // This is a simplified example
        Alert.alert(
          "Apple Sign In",
          "To fully implement this, you'll need the expo-apple-authentication package for iOS."
        );
        
        // In a real implementation:
        // 1. Get Apple identity token
        // 2. Create Firebase credential
        // const credential = OAuthProvider.credential('apple.com', {
        //   idToken: appleCredential.identityToken,
        // });
        // 3. Sign in with Firebase
        // await signInWithCredential(auth, credential);
      } else if (Platform.OS === 'web') {
        // On web, we can use the OAuthProvider
        const provider = new OAuthProvider('apple.com');
        await signInWithPopup(auth, provider);
      } else {
        Alert.alert("Not Available", "Apple Sign In is only available on iOS devices and web");
      }
    } catch (error) {
      console.error("Error with Apple sign in:", error);
      Alert.alert("Error", "Apple sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // On web, we can use signInWithPopup
      if (Platform.OS === 'web') {
        const provider = new FacebookAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        // For native, we'd need a deeper integration
        // This is a simplified example
        Alert.alert(
          "Facebook Sign In",
          "To fully implement this, you'll need the expo-auth-session package or React Native Firebase SDK for native platforms."
        );
        
        // In a real implementation, you would get the access token from Facebook SDK
        // and create a credential with it
        
        // const credential = FacebookAuthProvider.credential(accessToken);
        // await signInWithCredential(auth, credential);
      }
    } catch (error) {
      console.error("Error with Facebook sign in:", error);
      Alert.alert("Error", "Facebook sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[BootstrapStyles.container, BootstrapStyles.bgLight, BootstrapStyles.justifyContentCenter, BootstrapStyles.alignItemsCenter]}>
      <Text style={[BootstrapStyles.textH1, BootstrapStyles.mb1]}>Welcome</Text>
      <Text style={[BootstrapStyles.textSecondary, BootstrapStyles.mb3]}>Login or Register to Continue</Text>

      {/* Email Input */}
      <View style={[BootstrapStyles.formGroup, BootstrapStyles.w100]}>
        <TextInput
          placeholder="Email"
          style={BootstrapStyles.formControl}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password Input */}
      <View style={[BootstrapStyles.formGroup, BootstrapStyles.w100]}>
        <View style={[BootstrapStyles.inputGroup]}>
          <TextInput
            placeholder="Password"
            style={[BootstrapStyles.formControl, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={{ 
              padding: 15, 
              backgroundColor: '#fff', 
              borderWidth: 1, 
              borderColor: '#ced4da', 
              borderLeftWidth: 0,
              borderTopRightRadius: 4, 
              borderBottomRightRadius: 4 
            }} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[
          BootstrapStyles.btn, 
          BootstrapStyles.w100, 
          BootstrapStyles.mb2,
          (!email.includes("@") || password.length < 8) ? BootstrapStyles.bgSecondary : BootstrapStyles.btnPrimary
        ]}
        disabled={!email.includes("@") || password.length < 8 || isLoading}
        onPress={handleLogin}
      >
        <Text style={BootstrapStyles.textWhite}>
          {isLoading ? "Logging in..." : "Log In"}
        </Text>
      </TouchableOpacity>

      {/* Register Button */}
      <TouchableOpacity 
        style={[BootstrapStyles.btn, BootstrapStyles.btnSecondary, BootstrapStyles.w100, BootstrapStyles.mb2]} 
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={BootstrapStyles.textWhite}>Register</Text>
      </TouchableOpacity>

      {/* Forgot Password link - MOVED below Register button */}
      <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
        <Text style={[BootstrapStyles.textPrimary, BootstrapStyles.mb3]}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={[BootstrapStyles.w100, { flexDirection: 'row', alignItems: 'center', marginVertical: 15 }]}>
        <View style={{ flex: 1, height: 1, backgroundColor: '#ced4da' }} />
        <Text style={{ marginHorizontal: 10, color: '#6c757d' }}>OR</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#ced4da' }} />
      </View>

      {/* Social Login Buttons */}
      <View style={[BootstrapStyles.flexRow, BootstrapStyles.justifyContentCenter, BootstrapStyles.mt2]}>
        <TouchableOpacity 
          style={[BootstrapStyles.card, BootstrapStyles.justifyContentCenter, BootstrapStyles.alignItemsCenter, { width: 50, height: 50, margin: 5 }]} 
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <Ionicons name="logo-google" size={24} color="#EA4335" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[BootstrapStyles.card, BootstrapStyles.justifyContentCenter, BootstrapStyles.alignItemsCenter, { width: 50, height: 50, margin: 5 }]} 
          onPress={handleAppleLogin}
          disabled={isLoading}
        >
          <Ionicons name="logo-apple" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[BootstrapStyles.card, BootstrapStyles.justifyContentCenter, BootstrapStyles.alignItemsCenter, { width: 50, height: 50, margin: 5 }]} 
          onPress={handleFacebookLogin}
          disabled={isLoading}
        >
          <Ionicons name="logo-facebook" size={24} color="#3b5998" />
        </TouchableOpacity>
      </View>
    </View>
  );
}