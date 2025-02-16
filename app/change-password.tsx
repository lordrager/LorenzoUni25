// File: app/change_password.tsx
import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet 
} from "react-native";
import { getAuth, onAuthStateChanged, 
         EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { router } from "expo-router";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");

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
    if (newPassword !== confirmNewPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setError("");

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert("Error", "No user logged in.");
      return;
    }

    // Create credential using the old password
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    try {
      // Reauthenticate the user with the provided old password
      await reauthenticateWithCredential(user, credential);
      // Update the user's password with the new password
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password changed successfully.");
      // Optionally, clear fields and navigate back to user settings
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      router.replace("/user_settings");
    } catch (error: any) {
      console.error("Error changing password:", error);
      Alert.alert("Error", error.message || "Error changing password.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Change Password</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Old Password"
        secureTextEntry
        value={oldPassword}
        onChangeText={setOldPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        secureTextEntry
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
        <Text style={styles.buttonText}>Confirm</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.returnButton}
        onPress={() => router.replace("/user_settings")}
      >
        <Text style={styles.buttonText}>Return</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  returnButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
});