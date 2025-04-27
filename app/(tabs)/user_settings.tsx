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

const UserSettings = () => {
  const [user, setUser] = useState(null);
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isProfileIconModalVisible, setProfileIconModalVisible] = useState(false);
  const [isUsernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newProfileIcon, setNewProfileIcon] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState("");
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log("User logged in:", currentUser.uid);
        try {
          const userData = await getUser(currentUser.uid);
          setUser({...userData, id: currentUser.uid});
          
          // Read dark mode setting from localStorage
          const storedDarkMode = window.localStorage.getItem("darkMode");
          if (storedDarkMode !== null) {
            setDarkMode(JSON.parse(storedDarkMode));
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

  const handleDarkModeToggle = (value) => {
    setDarkMode(value);
    window.localStorage.setItem('darkMode', JSON.stringify(value));
    setUser({ ...user, darkMode: value });
    console.log("Dark mode set to", value);
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

  if (loading) {
    return (
      <LinearGradient
        colors={['#4dc9ff', '#00bfa5']}
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
        colors={['#4dc9ff', '#00bfa5']}
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
      colors={['#4dc9ff', '#00bfa5']}
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
        <View style={styles.profileSection}>
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
            <Text style={styles.profileName}>{user.profileName || 'User'}</Text>
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
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.streak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Lvl {user.level || 1}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.experience || 0}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {/* Dark Mode Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="moon" size={22} color={darkMode ? "#00bcd4" : "#757575"} />
              <Text style={styles.settingText}>Dark Mode</Text>
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
            style={styles.settingItem}
            onPress={() => router.push('/liked_news')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="heart" size={22} color="#757575" />
              <Text style={styles.settingText}>Liked Articles</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#757575" />
          </TouchableOpacity>
          
          {/* Leaderboard */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/leaderboard')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="trophy" size={22} color="#757575" />
              <Text style={styles.settingText}>Leaderboard</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#757575" />
          </TouchableOpacity>
          
          {/* Change Password */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/change-password')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="lock-closed" size={22} color="#757575" />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#757575" />
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Profile Picture</Text>
            
            {user.profileIcon && (
              <Image 
                source={{ uri: user.profileIcon }} 
                style={styles.previewImage} 
              />
            )}
            
            <TextInput
              style={styles.inputField}
              placeholder="Enter image URL"
              placeholderTextColor="#999"
              value={newProfileIcon}
              onChangeText={setNewProfileIcon}
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setProfileIconModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Username</Text>
            
            <TextInput
              style={styles.inputField}
              placeholder="Enter new username"
              placeholderTextColor="#999"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setUsernameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalText}>Are you sure you want to logout?</Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    color: '#333',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    color: '#757575',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
  },
  settingsSection: {
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    color: '#333',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#fff', 
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
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  modalText: { 
    fontSize: 16, 
    color: '#555', 
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
    borderColor: '#ddd', 
    borderWidth: 1, 
    borderRadius: 8, 
    width: '100%', 
    marginBottom: 20, 
    paddingHorizontal: 12, 
    color: '#333',
    backgroundColor: '#f9f9f9',
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
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
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
    color: '#555',
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