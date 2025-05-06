import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Switch, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ActivityIndicator, 
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { getUser, updateProfileIcon, updateUsername } from '@/class/User';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

// Add this function to your User class or create it as a separate function
const updateUserDarkMode = async (userId, darkMode) => {
  try {
    // Import firebase functions if not already imported
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../firebaseConfig');
    
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { darkMode: darkMode });
    return true;
  } catch (error) {
    console.error("Error updating user dark mode:", error);
    return false;
  }
};

const UserSettings = () => {
  const [user, setUser] = useState(null);
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isProfileIconModalVisible, setProfileIconModalVisible] = useState(false);
  const [isUsernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newProfileIcon, setNewProfileIcon] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const auth = getAuth();
  const router = useRouter();
  
  // Get theme context
  const { darkMode, setDarkMode } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log("User logged in:", currentUser.uid);
        try {
          const userData = await getUser(currentUser.uid);
          setUser({...userData, id: currentUser.uid});
          
          // Set dark mode from user preferences if it exists
          if (userData && userData.darkMode !== undefined) {
            setDarkMode(userData.darkMode);
          }
          
        } catch (err) {
          console.error("Failed to load user data:", err);
          setError("Failed to load user profile.");
        } finally {
          setLoading(false);
        }
      } else {
        console.log("User not logged in");
        router.replace("/"); // Redirect if not logged in
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const changeProfileIcon = async () => {
    if (!newProfileIcon) {
      Alert.alert("Invalid Input", "Please enter a valid image URL");
      return;
    }
    
    try {
      setLoading(true);
      await updateProfileIcon(user.id, newProfileIcon);
      setUser({ ...user, profileIcon: newProfileIcon });
      setProfileIconModalVisible(false);
      Alert.alert("Success", "Profile picture updated successfully");
    } catch (error) {
      console.error("Error updating profile icon:", error);
      Alert.alert("Error", "Failed to update profile picture");
    } finally {
      setLoading(false);
    }
  };

  const changeUsername = async () => {
    if (!newUsername || newUsername.trim() === '') {
      Alert.alert("Invalid Input", "Username cannot be empty");
      return;
    }
    
    try {
      setLoading(true);
      const success = await updateUsername(user.id, newUsername);
      if (success) {
        setUser({ ...user, profileName: newUsername });
        setUsernameModalVisible(false);
        Alert.alert("Success", "Username updated successfully");
      } else {
        Alert.alert("Error", "Failed to update username");
      }
    } catch (error) {
      console.error("Error updating username:", error);
      Alert.alert("Error", "Failed to update username");
    } finally {
      setLoading(false);
    }
  };

  const handleDarkModeToggle = async (value) => {
    // Update the theme context
    setDarkMode(value);
    
    // Update the user object locally
    setUser({ ...user, darkMode: value });
    
    // Save to database
    if (user && user.id) {
      try {
        await updateUserDarkMode(user.id, value);
      } catch (error) {
        console.error("Failed to update dark mode setting:", error);
      }
    }
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/'); // Navigate to login screen
      console.log('User logged out');
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
    setLogoutModalVisible(false);
  };

  // Styles that depend on dark mode
  const dynamicStyles = {
    card: {
      backgroundColor: darkMode ? '#1e1e1e' : 'rgba(255, 255, 255, 0.95)',
      borderColor: darkMode ? '#333333' : '#e0e0e0',
    },
    text: {
      color: darkMode ? '#ffffff' : '#333333',
    },
    modalContent: {
      backgroundColor: darkMode ? '#121212' : '#ffffff',
    },
    modalText: {
      color: darkMode ? '#e0e0e0' : '#555555',
    },
    border: {
      borderColor: darkMode ? '#333333' : '#f0f0f0',
    },
    iconColor: darkMode ? '#00bcd4' : '#757575',
  };

  if (loading) {
    return (
      <LinearGradient
        colors={darkMode ? ['#00838f', '#00796b'] : ['#4dc9ff', '#00bfa5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient
        colors={darkMode ? ['#00838f', '#00796b'] : ['#4dc9ff', '#00bfa5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No user data found. Please log in again.</Text>
          <TouchableOpacity 
            style={styles.returnButton} 
            onPress={() => router.replace("/")}
          >
            <Text style={styles.buttonText}>Return to Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={darkMode ? ['#00838f', '#00796b'] : ['#4dc9ff', '#00bfa5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Profile Settings</Text>
        </View>
        
        {/* Profile Section */}
        <View style={[styles.profileSection, dynamicStyles.card]}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user.profileIcon || 'https://via.placeholder.com/150' }} 
              style={styles.profileIcon} 
            />
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={() => {
                setNewProfileIcon(user.profileIcon || '');
                setProfileIconModalVisible(true);
              }}
            >
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={[styles.profileName, dynamicStyles.text]}>{user.profileName || 'User'}</Text>
            <TouchableOpacity 
              style={styles.editNameButton}
              onPress={() => { 
                setNewUsername(user.profileName || ''); 
                setUsernameModalVisible(true); 
              }}
            >
              <Text style={styles.editNameText}>Edit Profile</Text>
              <Ionicons name="pencil" size={14} color="#00bcd4" style={{marginLeft: 4}} />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Stats */}
        <View style={[styles.statsContainer, dynamicStyles.card]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.streak || 0}</Text>
            <Text style={[styles.statLabel, { color: darkMode ? '#bdbdbd' : '#757575' }]}>Streak</Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: darkMode ? '#333333' : '#e0e0e0' }]} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Lvl {user.level || 1}</Text>
            <Text style={[styles.statLabel, { color: darkMode ? '#bdbdbd' : '#757575' }]}>Level</Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: darkMode ? '#333333' : '#e0e0e0' }]} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.experience || 0}</Text>
            <Text style={[styles.statLabel, { color: darkMode ? '#bdbdbd' : '#757575' }]}>XP</Text>
          </View>
        </View>

        {/* Settings List */}
        <View style={[styles.settingsSection, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text, { borderBottomColor: darkMode ? '#333333' : '#f0f0f0' }]}>
            Settings
          </Text>
          
          {/* Dark Mode Toggle */}
          <View style={[styles.settingItem, { borderBottomColor: darkMode ? '#333333' : '#f0f0f0' }]}>
            <View style={styles.settingContent}>
              <Ionicons name="moon" size={22} color={darkMode ? "#00bcd4" : "#757575"} />
              <Text style={[styles.settingText, dynamicStyles.text]}>Dark Mode</Text>
            </View>
            <Switch 
              value={darkMode} 
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: "#D1D1D1", true: "rgba(0, 188, 212, 0.4)" }}
              thumbColor={darkMode ? "#00bcd4" : "#f4f3f4"}
            />
          </View>
          
          {/* Liked News */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: darkMode ? '#333333' : '#f0f0f0' }]}
            onPress={() => router.push('/liked_news')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="heart" size={22} color={dynamicStyles.iconColor} />
              <Text style={[styles.settingText, dynamicStyles.text]}>Liked Articles</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={dynamicStyles.iconColor} />
          </TouchableOpacity>
          
          {/* Leaderboard */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: darkMode ? '#333333' : '#f0f0f0' }]}
            onPress={() => router.push('/leaderboard')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="trophy" size={22} color={dynamicStyles.iconColor} />
              <Text style={[styles.settingText, dynamicStyles.text]}>Leaderboard</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={dynamicStyles.iconColor} />
          </TouchableOpacity>
          
          {/* Change Password */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: darkMode ? '#333333' : '#f0f0f0' }]}
            onPress={() => router.push('/change-password')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="lock-closed" size={22} color={dynamicStyles.iconColor} />
              <Text style={[styles.settingText, dynamicStyles.text]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={dynamicStyles.iconColor} />
          </TouchableOpacity>
          
          {/* Logout */}
          <TouchableOpacity 
            style={[styles.settingItem, styles.logoutItem]}
            onPress={() => setLogoutModalVisible(true)}
          >
            <View style={styles.settingContent}>
              <Ionicons name="log-out" size={22} color="#e53935" />
              <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Profile Icon Change Modal */}
      <Modal
        visible={isProfileIconModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileIconModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <Text style={[styles.modalTitle, dynamicStyles.text]}>Change Profile Picture</Text>
            
            {user.profileIcon && (
              <Image 
                source={{ uri: user.profileIcon }} 
                style={styles.previewImage} 
              />
            )}
            
            <TextInput
              style={[styles.inputField, { 
                backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                color: darkMode ? '#ffffff' : '#333333',
                borderColor: darkMode ? '#444444' : '#ddd'
              }]}
              placeholder="Enter image URL"
              placeholderTextColor={darkMode ? '#888888' : '#999999'}
              value={newProfileIcon}
              onChangeText={setNewProfileIcon}
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { borderColor: darkMode ? '#444444' : '#ddd' }]} 
                onPress={() => setProfileIconModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: darkMode ? '#e0e0e0' : '#555555' }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={changeProfileIcon}
              >
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Username Change Modal */}
      <Modal
        visible={isUsernameModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setUsernameModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <Text style={[styles.modalTitle, dynamicStyles.text]}>Change Username</Text>
            
            <TextInput
              style={[styles.inputField, { 
                backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                color: darkMode ? '#ffffff' : '#333333',
                borderColor: darkMode ? '#444444' : '#ddd'
              }]}
              placeholder="Enter new username"
              placeholderTextColor={darkMode ? '#888888' : '#999999'}
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { borderColor: darkMode ? '#444444' : '#ddd' }]} 
                onPress={() => setUsernameModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: darkMode ? '#e0e0e0' : '#555555' }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={changeUsername}
              >
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={isLogoutModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <Text style={[styles.modalTitle, dynamicStyles.text]}>Confirm Logout</Text>
            <Text style={[styles.modalText, dynamicStyles.modalText]}>Are you sure you want to logout?</Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { borderColor: darkMode ? '#444444' : '#ddd' }]} 
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: darkMode ? '#e0e0e0' : '#555555' }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, styles.logoutConfirmButton]} 
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  loadingText: { 
    fontSize: 16, 
    color: "#ffffff",
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  errorText: {
    fontSize: 16, 
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  profileSection: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
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
  avatarContainer: {
    position: 'relative',
  },
  profileIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 3, 
    borderColor: '#00bcd4' 
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00bcd4',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  editNameButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editNameText: {
    color: '#00bcd4',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00bcd4',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  settingsSection: {
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#e53935',
  },
  returnButton: { 
    backgroundColor: "#00bcd4", 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 8,
    marginTop: 20, 
  },
  buttonText: { 
    color: "#ffffff", 
    fontSize: 16, 
    fontWeight: "600",
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  modalContent: { 
    borderRadius: 12, 
    width: '85%', 
    padding: 20, 
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  modalText: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputField: { 
    height: 45, 
    borderWidth: 1,
    borderRadius: 8, 
    width: '100%', 
    marginBottom: 20, 
    paddingHorizontal: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderRadius: 8, 
    marginHorizontal: 5,
  },
  cancelButton: { 
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  confirmButton: { 
    backgroundColor: '#00bcd4', 
  },
  logoutConfirmButton: {
    backgroundColor: '#e53935',
  },
  cancelButtonText: { 
    fontSize: 16, 
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  confirmButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
});

export default UserSettings;