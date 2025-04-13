import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  onAuthStateChanged
} from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { BootstrapStyles } from "@/app/styles/bootstrap";

export default function ConfirmEmailScreen() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userCreated, setUserCreated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showVerificationStatus, setShowVerificationStatus] = useState(false);

  // Retrieve stored credentials on mount
  useEffect(() => {
    console.log("ConfirmEmail - Component mounted, retrieving credentials");
    const storedEmail = window.localStorage.getItem("emailForSignUp");
    const storedPassword = window.localStorage.getItem("passwordForSignUp");
    const storedUsername = window.localStorage.getItem("usernameForSignUp");
    
    console.log("ConfirmEmail - Stored email:", storedEmail ? "Found" : "Not found");
    console.log("ConfirmEmail - Stored username:", storedUsername ? "Found" : "Not found");
    
    if (storedEmail && storedPassword && storedUsername) {
      setEmail(storedEmail);
      setPassword(storedPassword);
      setUsername(storedUsername);
      console.log("ConfirmEmail - Creating user account with email:", storedEmail);
      createUserAccount(storedEmail, storedPassword);
    } else {
      // If no stored credentials, redirect back to register
      console.log("ConfirmEmail - Missing credentials, redirecting to register");
      Alert.alert("Error", "Registration information missing. Please start over.");
      router.replace("/register");
    }
  }, []);

  // Check authentication state and email verification status
  useEffect(() => {
    const auth = getAuth();
    console.log("ConfirmEmail - Setting up auth state listener");
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("ConfirmEmail - Auth state changed. User:", user.email);
        console.log("ConfirmEmail - Email verified status:", user.emailVerified);
        
        // Update verification status whenever auth state changes
        const wasVerified = isEmailVerified;
        setIsEmailVerified(user.emailVerified);
        
        // If user just verified their email (by clicking the link)
        if (user.emailVerified && !wasVerified) {
          console.log("ConfirmEmail - Email just verified, showing alert");
          setShowVerificationStatus(true);
          Alert.alert(
            "Email Verified", 
            "Your email has been successfully verified! You can now continue to preferences.",
            [{ 
              text: "Continue", 
              onPress: () => {
                console.log("ConfirmEmail - Auto-navigating to preferences after verification");
                goToPreferences();
              } 
            }]
          );
        }
      } else {
        console.log("ConfirmEmail - No user found in auth state change");
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [isEmailVerified]);

  // Handle countdown for resend email button
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Create user account in Firebase
  const createUserAccount = async (email, password) => {
    if (!email || !password || userCreated) {
      console.log("ConfirmEmail - Create account skipped:", !email ? "No email" : !password ? "No password" : "Already created");
      return;
    }
    
    console.log("ConfirmEmail - Starting user account creation");
    setIsVerifying(true);
    
    try {
      const auth = getAuth();
      console.log("ConfirmEmail - Creating user with Firebase");
      // Create new user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("ConfirmEmail - User created successfully:", user.uid);
      
      // Send verification email
      console.log("ConfirmEmail - Sending verification email");
      await sendEmailVerification(user);
      console.log("ConfirmEmail - Verification email sent successfully");
      
      // Start countdown for resend button
      setCountdown(60);
      setUserCreated(true);
      
      Alert.alert(
        "Verification Email Sent", 
        "We've sent a verification link to your email. Please check your inbox and click the link to verify your account."
      );
    } catch (error) {
      console.error("ConfirmEmail - Error creating user account:", error);
      console.log("ConfirmEmail - Error code:", error.code);
      
      let errorMessage = "Failed to create account. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        console.log("ConfirmEmail - Email already in use");
        errorMessage = "This email is already in use. Please try another email or login.";
        router.replace("/register");
      } else if (error.code === "auth/invalid-email") {
        console.log("ConfirmEmail - Invalid email format");
        errorMessage = "Invalid email address. Please check your email format.";
        router.replace("/register");
      } else if (error.code === "auth/weak-password") {
        console.log("ConfirmEmail - Weak password");
        errorMessage = "Password is too weak. Please choose a stronger password.";
        router.replace("/register");
      }
      
      Alert.alert("Account Creation Error", errorMessage);
    } finally {
      console.log("ConfirmEmail - Account creation process complete");
      setIsVerifying(false);
    }
  };

  // Check email verification status before proceeding
  const checkEmailVerification = async () => {
    const auth = getAuth();
    console.log("ConfirmEmail - Checking email verification status");
    setIsVerifying(true);
    
    try {
      // Force refresh user to get latest emailVerified status
      if (auth.currentUser) {
        console.log("ConfirmEmail - Found current user, reloading to get fresh data");
        await auth.currentUser.reload();
        const user = auth.currentUser;
        console.log("ConfirmEmail - User reloaded, verification status:", user.emailVerified);
        
        if (user.emailVerified) {
          // Email is verified, proceed to preferences
          console.log("ConfirmEmail - Email is verified, proceeding to preferences");
          goToPreferences();
        } else {
          // Email not verified, show warning
          console.log("ConfirmEmail - Email not verified, showing resend option");
          Alert.alert(
            "Email Not Verified", 
            "Please check your email and click the verification link before continuing. Would you like us to send another verification email?",
            [
              { text: "No", style: "cancel" },
              { text: "Yes", onPress: sendVerificationEmail }
            ]
          );
        }
      } else {
        console.log("ConfirmEmail - No current user found");
        throw new Error("User not found");
      }
    } catch (error) {
      console.error("ConfirmEmail - Error checking verification:", error);
      Alert.alert("Error", "Failed to check email verification status. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Send verification email
  const sendVerificationEmail = async () => {
    const auth = getAuth();
    console.log("ConfirmEmail - Attempting to send verification email");
    
    try {
      setIsVerifying(true);
      
      const user = auth.currentUser;
      if (!user) {
        console.log("ConfirmEmail - No current user found for verification email");
        throw new Error("User not found. Please refresh the page.");
      }
      
      console.log("ConfirmEmail - User found, sending verification email to:", user.email);
      // Send verification email
      await sendEmailVerification(user);
      console.log("ConfirmEmail - Verification email sent successfully");
      
      // Start countdown for resend button
      setCountdown(60);
      
      Alert.alert(
        "Verification Email Sent", 
        "We've sent a verification link to your email. Please check your inbox and click the link to verify your account."
      );
    } catch (error) {
      console.error("ConfirmEmail - Error sending verification email:", error);
      Alert.alert("Error", "Failed to send verification email. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Go to preferences page
  const goToPreferences = () => {
    console.log("ConfirmEmail - Navigating to preferences page");
    setIsVerifying(true);
    try {
      // Directly navigate to preffered_news
      console.log("ConfirmEmail - Attempting to replace route with preffered_news");
      router.replace("/preffered_news");
    } catch (error) {
      console.error("ConfirmEmail - Navigation error:", error);
      // Fallback navigation if the first attempt fails
      console.log("ConfirmEmail - Using fallback navigation with timeout");
      setTimeout(() => {
        router.push("/preffered_news");
      }, 300);
      
      if (error) {
        Alert.alert("Error", "Failed to navigate. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackPress = () => {
    router.replace("/register");
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
        <View style={[BootstrapStyles.p4, styles.formCard]}>
          <View style={styles.formHeader}>
            <Text style={styles.formHeaderText}>Verify Your Email</Text>
          </View>
          
          <View style={styles.formBody}>
            <Ionicons name="mail" size={70} color="#00bcd4" style={styles.emailIcon} />
            
            <Text style={styles.verificationTitle}>Email Verification Required</Text>
            
            <Text style={styles.verificationText}>
              We've created your account, but you need to verify your email address.
              An email has been sent to:
            </Text>
            
            <Text style={styles.emailText}>
              {email}
            </Text>
            
            <Text style={styles.instructionsText}>
              Please check your inbox and click on the verification link. Then continue to complete your profile.
            </Text>

            {/* Verification Status */}
            {showVerificationStatus && isEmailVerified && (
              <View style={styles.verificationStatusContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.verificationStatusText}>Email Verified Successfully!</Text>
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                BootstrapStyles.btn,
                styles.actionButton,
                isVerifying && styles.disabledButton,
                BootstrapStyles.mt4
              ]}
              disabled={isVerifying}
              onPress={checkEmailVerification}
            >
              <Text style={[BootstrapStyles.textWhite, BootstrapStyles.textCenter, styles.buttonText]}>
                {isVerifying ? "Please wait..." : "Continue to Preferences"}
              </Text>
            </TouchableOpacity>

            {/* Resend Email Button */}
            <TouchableOpacity
              style={[
                BootstrapStyles.btn,
                styles.resendButton,
                (countdown > 0 || isVerifying) && styles.disabledButton,
                BootstrapStyles.mt3
              ]}
              disabled={countdown > 0 || isVerifying}
              onPress={sendVerificationEmail}
            >
              <Text style={[styles.resendButtonText]}>
                {countdown > 0 ? `Resend Email (${countdown}s)` : "Resend Verification Email"}
              </Text>
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
  formCard: {
    width: '95%', // 95% of the width as requested
    height: '75%',
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
    padding: 0,
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
  emailIcon: {
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  verificationText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00bcd4',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  instructionsText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  verificationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  verificationStatusText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  actionButton: {
    width: '95%',
    height: 55,
    backgroundColor: '#00bcd4', // Turquoise color
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  resendButton: {
    width: '95%',
    height: 55,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00bcd4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: { 
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: '#00bcd4',
  },
});