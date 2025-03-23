// @/utils/authUtils.js
import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { createOrUpdateUserInFirestore } from "./userUtils";
import { getUser } from "@/class/User";

const auth = getAuth();

/**
 * Handle email/password login
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {function} setIsLoading - Function to set loading state
 */
export const handleEmailLogin = async (email, password, setIsLoading) => {
  if (!email || !password) {
    Alert.alert("Error", "Please enter email and password");
    return;
  }

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
        router.push("/");
      }
    } else {
      console.log("User authenticated but no user data found");
      Alert.alert("Account Issue", "Your account exists but profile data is missing. Please contact support.");
    }
  } catch (error) {
    let errorMessage = "Login failed. Please try again.";
    if (error.code === "auth/invalid-email") errorMessage = "Invalid email address";
    if (error.code === "auth/wrong-password") errorMessage = "Incorrect password";
    if (error.code === "auth/user-not-found") errorMessage = "User not found";
    Alert.alert("Error", errorMessage);
  } finally {
    setIsLoading(false);
  }
};

/**
 * Navigate to registration screen
 */
export const navigateToRegister = () => {
  try {
    router.replace("/register");
  } catch (navError) {
    console.error("Navigation error:", navError);
    router.push("/register");
  }
};

/**
 * Navigate to forgot password screen
 */
export const navigateToForgotPassword = () => {
  try {
    router.push("/forgot_password");
  } catch (navError) {
    console.error("Navigation error:", navError);
  }
};

/**
 * Handle Google sign in
 * @param {function} setIsLoading - Function to set loading state
 */
export const handleGoogleSignIn = async (setIsLoading) => {
  setIsLoading(true);
  try {
    // On web, we can use signInWithPopup
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create or update user in Firestore
      const isNewUser = await createOrUpdateUserInFirestore(user);
      
      // Navigate user based on whether they're new or existing
      if (isNewUser) {
        Alert.alert("Welcome!", "Your account has been created successfully.");
      }
      
      router.replace("/user_home");
    } else {
      // For native, we'd need to use a deeper integration
      Alert.alert(
        "Google Sign In",
        "To fully implement this, you'll need the expo-auth-session package or React Native Firebase SDK for native platforms."
      );
    }
  } catch (error) {
    console.error("Error with Google sign in:", error);
    Alert.alert("Error", "Google sign in failed: " + (error.message || "Unknown error"));
  } finally {
    setIsLoading(false);
  }
};

/**
 * Handle Apple sign in
 * @param {function} setIsLoading - Function to set loading state
 */
export const handleAppleSignIn = async (setIsLoading) => {
  setIsLoading(true);
  try {
    if (Platform.OS === 'ios') {
      Alert.alert(
        "Apple Sign In",
        "To fully implement this, you'll need the expo-apple-authentication package for iOS."
      );
    } else if (Platform.OS === 'web') {
      const provider = new OAuthProvider('apple.com');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create or update user in Firestore
      const isNewUser = await createOrUpdateUserInFirestore(user);
      
      // Navigate user based on whether they're new or existing
      if (isNewUser) {
        Alert.alert("Welcome!", "Your account has been created successfully.");
      }
      
      router.replace("/user_home");
    } else {
      Alert.alert("Not Available", "Apple Sign In is only available on iOS devices and web");
    }
  } catch (error) {
    console.error("Error with Apple sign in:", error);
    Alert.alert("Error", "Apple sign in failed: " + (error.message || "Unknown error"));
  } finally {
    setIsLoading(false);
  }
};

/**
 * Handle Facebook sign in
 * @param {function} setIsLoading - Function to set loading state
 */
export const handleFacebookSignIn = async (setIsLoading) => {
  setIsLoading(true);
  try {
    // On web, we can use signInWithPopup
    if (Platform.OS === 'web') {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create or update user in Firestore
      const isNewUser = await createOrUpdateUserInFirestore(user);
      
      // Navigate user based on whether they're new or existing
      if (isNewUser) {
        Alert.alert("Welcome!", "Your account has been created successfully.");
      }
      
      router.replace("/user_home");
    } else {
      Alert.alert(
        "Facebook Sign In",
        "To fully implement this, you'll need the expo-auth-session package or React Native Firebase SDK for native platforms."
      );
    }
  } catch (error) {
    console.error("Error with Facebook sign in:", error);
    Alert.alert("Error", "Facebook sign in failed: " + (error.message || "Unknown error"));
  } finally {
    setIsLoading(false);
  }
};

/**
 * Check if user is authenticated and redirect accordingly
 * @returns {Promise<function>} Unsubscribe function
 */
export const checkAuthentication = async () => {
  return new Promise((resolve, reject) => {
    try {
      const auth = getAuth();
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
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
            }
          } catch (dataError) {
            console.error("Error fetching user data:", dataError);
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