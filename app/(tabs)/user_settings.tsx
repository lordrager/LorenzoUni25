import React, { useState, useEffect } from 'react';
import { 
  View, Text, Switch, Image, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator 
} from 'react-native';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { getUser, updateUserNotifications, updateProfileIcon, updateUsername } from '@/class/User'; // Import Firebase functions

const UserSettings = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(false);
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isProfileIconModalVisible, setProfileIconModalVisible] = useState(false);
  const [newProfileIcon, setNewProfileIcon] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async (uid) => {
      try {
        if (!uid) return;
        const userData = await getUser(uid);
        if (userData) {
          setUser(userData);
          setNotifications(userData.notificationsEnabled);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      } else {
        router.replace('/'); // Redirect to login if not logged in
      }
    });

    return () => unsubscribe();
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
      await updateUsername(user.id, newUsername);
      setUser({ ...user, profileName: newUsername });
    }
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
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image source={{ uri: user.profileIcon || 'https://example.com/user-avatar.png' }} style={styles.profileIcon} />
        <Text style={styles.profileName}>{user.profileName}</Text>
        <TouchableOpacity onPress={() => setProfileIconModalVisible(true)} style={styles.iconChangeButton}>
          <Text style={styles.iconChangeText}>Change Profile Icon</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setNewUsername(user.profileName)} style={styles.iconChangeButton}>
          <Text style={styles.iconChangeText}>Change Username</Text>
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Level: {user.level}</Text>
        <Text style={styles.infoText}>HP Needed: {user.hpNeededForNextLevel}</Text>
        <Text style={styles.infoText}>Rank: {user.rank}</Text>
        <Text style={styles.infoText}>Login Streak: {user.loginStreak} days</Text>
      </View>

      {/* Notifications Toggle */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>Enable Notifications</Text>
        <Switch value={notifications} onValueChange={toggleNotifications} />
      </View>

      {/* Leaderboards */}
      <Text style={styles.sectionTitle}>Leaderboards</Text>
      {/* Example leaderboard data */}
      <FlatList
        data={user.leaderboard || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text style={styles.newsItem}>• {item.username}: {item.score}</Text>}
      />

      {/* Liked News Section */}
      <Text style={styles.sectionTitle}>Liked News</Text>
      <FlatList
        data={user.likedNews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text style={styles.newsItem}>• {item.title}</Text>}
      />

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#333', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  profileSection: { alignItems: 'center', marginBottom: 20 },
  profileIcon: { width: 100, height: 100, borderRadius: 50, marginBottom: 10, borderWidth: 2, borderColor: '#ddd' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  iconChangeButton: { marginTop: 10, padding: 10, backgroundColor: '#007AFF', borderRadius: 5 },
  iconChangeText: { color: '#fff' },

  infoContainer: { backgroundColor: '#444', padding: 15, borderRadius: 10, width: '100%', marginBottom: 20 },
  infoText: { fontSize: 16, color: '#ddd', paddingVertical: 2 },

  toggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#444', padding: 15, borderRadius: 10, width: '100%', marginBottom: 20 },
  toggleText: { fontSize: 16, color: '#fff' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 10, color: '#fff' },
  newsItem: { fontSize: 14, color: '#bbb', paddingVertical: 5 },

  logoutButton: { marginTop: 20, backgroundColor: '#E63946', paddingVertical: 10, paddingHorizontal: 40, borderRadius: 10 },
  logoutText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { backgroundColor: '#444', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#fff' },
  modalText: { fontSize: 16, color: '#ddd', textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 5, marginHorizontal: 5 },
  cancelButton: { backgroundColor: '#888' },
  confirmButton: { backgroundColor: '#E63946' },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  confirmButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  inputField: { height: 40, borderColor: '#ddd', borderWidth: 1, borderRadius: 5, width: '100%', marginBottom: 10, paddingHorizontal: 10, color: '#fff' },
});

export default UserSettings;