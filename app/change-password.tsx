import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet,
  ActivityIndicator,
  Platform
} from "react-native";
import { getAuth, onAuthStateChanged, 
         EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if user is logged in; if not, redirect to login
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChangePassword = async () => {
    // Basic validation
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setError("Please fill out all fields.");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    
    setError("");
    setIsLoading(true);

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert("Error", "No user logged in.");
      setIsLoading(false);
      return;
    }

    // Create credential using the old password
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    try {
      // Reauthenticate the user with the provided old password
      await reauthenticateWithCredential(user, credential);
      // Update the user's password with the new password
      await updatePassword(user, newPassword);
      Alert.alert(
        "Success", 
        "Password changed successfully.",
        [
          { 
            text: "OK", 
            onPress: () => router.replace("/user_settings") 
          }
        ]
      );
      
      // Clear fields
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      let errorMessage = "Error changing password.";
      
      // Handle specific error codes
      if (error.code === 'auth/wrong-password') {
        errorMessage = "The current password is incorrect.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many unsuccessful attempts. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#4dc9ff', '#00bfa5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace("/user_settings")}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Change Password</Text>
        <View style={styles.headerRight} />
      </View>
      
      <View style={styles.container}>
        <View style={styles.formCard}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={20} color="#e53935" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          {/* Old Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              placeholderTextColor="#999"
              secureTextEntry={!showOldPassword}
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowOldPassword(!showOldPassword)}
            >
              <Ionicons name={showOldPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#777" />
            </TouchableOpacity>
          </View>
          
          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#999"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#777" />
            </TouchableOpacity>
          </View>
          
          {/* Confirm New Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#777" />
            </TouchableOpacity>
          </View>
          
          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsText}>
              Password must be at least 6 characters
            </Text>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => router.replace("/user_settings")}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.confirmButton,
                (!oldPassword || !newPassword || !confirmNewPassword) && styles.disabledButton
              ]} 
              onPress={handleChangePassword}
              disabled={!oldPassword || !newPassword || !confirmNewPassword || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40, // Balances the header
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  formCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: "#e53935",
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 50,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  eyeIcon: {
    padding: 10,
  },
  requirementsContainer: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  requirementsText: {
    color: '#666',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: "#00bcd4",
  },
  disabledButton: {
    backgroundColor: "#b0e0e6",
    opacity: 0.7,
  },
  cancelButtonText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
});