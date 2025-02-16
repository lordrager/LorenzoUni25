import React, { useState, useEffect } from 'react';
import { 
  View, Text, Switch, Image, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, ScrollView 
} from 'react-native';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { getUser, updateUserNotifications, updateProfileIcon, updateUsername } from '@/class/User';

const UserSettings = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(false);
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
          if (userData && userData.notifications) {
            setNotifications(userData.notifications);
          } else {
            setNotifications([]); // No notifications available
          }
          setUser(userData);
          // Read dark mode setting from window.localStorage
          const storedDarkMode = window.localStorage.getItem("darkMode");
          if (storedDarkMode !== null) {
            setDarkMode(JSON.parse(storedDarkMode));
          }
        } catch (err) {
          console.error("Failed to load notifications.");
          setError("Failed to load notifications.");
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

  const toggleNotifications = async () => {
    if (!user) return;
    const newStatus = !notifications;
    setNotifications(newStatus);
    await updateUserNotifications(user.id, newStatus);
  };

  const changeProfileIcon = async () => {
    if (newProfileIcon) {
      await updateProfileIcon(user.id, newProfileIcon);
      setUser({ ...user, profileIcon: newProfileIcon });
      setProfileIconModalVisible(false);
    }
  };

  const changeUsername = async () => {
    if (newUsername) {
      const success = await updateUsername(user.uid, newUsername);
      if (success) {
        setUser({ ...user, profileName: newUsername });
        console.log("Username updated:", newUsername);
      }
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
    }
    setLogoutModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading user data...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No user data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, darkMode && styles.darkContainer]}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image source={{ uri: user.profileIcon || 'https://example.com/user-avatar.png' }} style={styles.profileIcon} />
        <Text style={styles.profileName}>{user.profileName}</Text>
        <TouchableOpacity onPress={() => setProfileIconModalVisible(true)} style={styles.iconChangeButton}>
          <Text style={styles.iconChangeText}>Change Profile Icon</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setNewUsername(user.profileName); setUsernameModalVisible(true); }} style={styles.iconChangeButton}>
          <Text style={styles.iconChangeText}>Change Username</Text>
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Streak: {user.streak} days</Text>
        <Text style={styles.infoText}>Level: {user.level}</Text>
        <Text style={styles.infoText}>Experience: {user.experience} XP</Text>
        <Text style={styles.infoText}>Rank: {user.rank}</Text>
      </View>

      {/* Notifications Toggle */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>Enable Notifications</Text>
        <Switch value={notifications} onValueChange={toggleNotifications} />
      </View>

      {/* Dark Mode Toggle */}
      <View style={styles.darkModeContainer}>
        <Text style={styles.darkModeText}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={handleDarkModeToggle} />
      </View>

      {/* Leaderboards Section (Touchable) */}
      <TouchableOpacity onPress={() => router.push('/leaderboard')} style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Leaderboards</Text>
        <FlatList
          data={user.leaderboard || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Text style={styles.newsItem}>• {item.username}: {item.score}</Text>}
        />
      </TouchableOpacity>

      {/* Liked News Section (Touchable) */}
      <TouchableOpacity onPress={() => router.push('/liked_news')} style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Liked News</Text>
        <FlatList
          data={user.likedNews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Text style={styles.newsItem}>• {item.title}</Text>}
        />
      </TouchableOpacity>

      {/* Change Password Button (placed under Liked News) */}
      <TouchableOpacity 
        style={styles.changePasswordButton} 
        onPress={() => router.push('/change-password')}
      >
        <Text style={styles.changePasswordButtonText}>Change Password</Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={() => setLogoutModalVisible(true)}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Profile Icon Change Modal */}
      <Modal
        visible={isProfileIconModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileIconModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Profile Icon</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter Image URL"
              placeholderTextColor="#ccc"
              value={newProfileIcon}
              onChangeText={setNewProfileIcon}
            />
            <TouchableOpacity style={styles.modalButton} onPress={changeProfileIcon}>
              <Text style={styles.modalButtonText}>Change Icon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setProfileIconModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
              placeholderTextColor="#ccc"
              value={newUsername}
              onChangeText={setNewUsername}
            />
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => { changeUsername(); setUsernameModalVisible(false); }}
            >
              <Text style={styles.modalButtonText}>Change Username</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setUsernameModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1,
    padding: 15, 
    backgroundColor: '#333', 
    alignItems: 'center' 
  },
  darkContainer: { backgroundColor: '#000' },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileSection: { 
    alignItems: 'center', 
    marginBottom: 15 
  },
  profileIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    marginBottom: 8, 
    borderWidth: 2, 
    borderColor: '#ddd' 
  },
  profileName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  iconChangeButton: { 
    marginTop: 5, 
    padding: 8, 
    backgroundColor: '#007AFF', 
    borderRadius: 5 
  },
  iconChangeText: { 
    color: '#fff', 
    fontSize: 14 
  },
  infoContainer: { 
    backgroundColor: '#444', 
    padding: 10, 
    borderRadius: 10, 
    width: '100%', 
    marginBottom: 15 
  },
  infoText: { 
    fontSize: 14, 
    color: '#ddd', 
    paddingVertical: 2 
  },
  toggleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#444', 
    padding: 10, 
    borderRadius: 10, 
    width: '100%', 
    marginBottom: 15 
  },
  toggleText: { 
    fontSize: 14, 
    color: '#fff' 
  },
  darkModeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#444', 
    padding: 10, 
    borderRadius: 10, 
    width: '100%', 
    marginBottom: 15 
  },
  darkModeText: { 
    fontSize: 14, 
    color: '#fff' 
  },
  sectionContainer: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#444',
    borderRadius: 10,
    padding: 10,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff',
    marginBottom: 5,
  },
  newsItem: { 
    fontSize: 12, 
    color: '#bbb', 
    paddingVertical: 3 
  },
  changePasswordButton: { 
    marginVertical: 10, 
    backgroundColor: '#007AFF', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 10 
  },
  changePasswordButtonText: { 
    fontSize: 14, 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  logoutButton: { 
    marginTop: 15, 
    backgroundColor: '#E63946', 
    paddingVertical: 8, 
    paddingHorizontal: 20, 
    borderRadius: 10 
  },
  logoutText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  modalContent: { 
    backgroundColor: '#444', 
    padding: 20, 
    borderRadius: 10, 
    width: '80%', 
    alignItems: 'center' 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    color: '#fff' 
  },
  modalText: { 
    fontSize: 14, 
    color: '#ddd', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  modalButton: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 5, 
    marginHorizontal: 5 
  },
  cancelButton: { 
    backgroundColor: '#888' 
  },
  confirmButton: { 
    backgroundColor: '#E63946' 
  },
  cancelButtonText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  confirmButtonText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  inputField: { 
    height: 35, 
    borderColor: '#ddd', 
    borderWidth: 1, 
    borderRadius: 5, 
    width: '100%', 
    marginBottom: 10, 
    paddingHorizontal: 8, 
    color: '#fff' 
  },
});

export default UserSettings;