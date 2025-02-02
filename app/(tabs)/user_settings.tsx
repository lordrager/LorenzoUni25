import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
} from "react-native";
import { getAuth, deleteUser, signOut, onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";

export default function UserSettingsScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userName, setUserName] = useState("John Doe");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("English");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const auth = getAuth();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User already logged in:", user.uid);
      } else {
        console.log("User not logged in");
        router.replace("/"); // Redirect if not logged in
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const handleToggleDarkMode = () => {
    setIsDarkMode((previousState) => !previousState);
  };

  const handleSaveChanges = () => {
    console.log("Settings saved!");
    setIsModalVisible(false);
  };

  const handleLogOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth); // Log out the user
      localStorage.removeItem("emailForSignIn");
      localStorage.removeItem("passwordForSignIn");
      Alert.alert("Success", "Logged out successfully!");
      router.replace("/"); // Navigate to index.tsx
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  const handleDeleteUser = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        await deleteUser(user); // Delete user from Firebase
        localStorage.removeItem("emailForSignIn");
        localStorage.removeItem("passwordForSignIn");
        Alert.alert("Success", "User account deleted successfully!");
        router.replace("/"); // Navigate to index.tsx
      } else {
        Alert.alert("Error", "No user is currently logged in.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      Alert.alert("Error", "Failed to delete user. Please try again.");
    }
  };

  return (
    <View style={[styles.container, isDarkMode ? styles.darkMode : styles.lightMode]}>
      <Text style={[styles.header, isDarkMode ? styles.darkText : styles.lightText]}>User Settings</Text>

      {/* Toggle Dark/Light Mode */}
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, isDarkMode ? styles.darkText : styles.lightText]}>Dark Mode</Text>
        <Switch value={isDarkMode} onValueChange={handleToggleDarkMode} />
      </View>

      {/* Change Name */}
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, isDarkMode ? styles.darkText : styles.lightText]}>Name</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
          value={userName}
          onChangeText={setUserName}
        />
      </View>

      {/* Change Password */}
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, isDarkMode ? styles.darkText : styles.lightText]}>Change Password</Text>
        <TextInput
          style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
          secureTextEntry
          placeholder="Enter new password"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Change Language */}
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, isDarkMode ? styles.darkText : styles.lightText]}>Language</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Text style={[styles.languageText, isDarkMode ? styles.darkText : styles.lightText]}>{language}</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      {/* Log Out Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      {/* Delete User Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteUser}>
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>Select Language</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setLanguage("English");
                setIsModalVisible(false);
              }}
            >
              <Text style={styles.modalOptionText}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setLanguage("Spanish");
                setIsModalVisible(false);
              }}
            >
              <Text style={styles.modalOptionText}>Spanish</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setLanguage("French");
                setIsModalVisible(false);
              }}
            >
              <Text style={styles.modalOptionText}>French</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  lightMode: {
    backgroundColor: "#f9f9f9",
  },
  darkMode: {
    backgroundColor: "#333",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  darkText: {
    color: "#fff",
  },
  lightText: {
    color: "#000",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
  },
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
  },
  darkInput: {
    backgroundColor: "#555",
    color: "#fff",
    borderColor: "#666",
  },
  lightInput: {
    backgroundColor: "#fff",
    color: "#000",
    borderColor: "#ccc",
  },
  languageText: {
    fontSize: 16,
    color: "#007BFF",
  },
  saveButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#FF6B6B",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "#FF3B3B",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: 250,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  modalOptionText: {
    fontSize: 16,
  },
  closeButton: {
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#007BFF",
  },
});