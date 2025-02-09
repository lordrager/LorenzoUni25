import React, { useState, useEffect } from 'react';
import { 
  View, Text, Switch, Image, FlatList, StyleSheet, TouchableOpacity, Modal, ActivityIndicator 
} from 'react-native';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { getUser, updateUserNotifications } from '@/class/User'; // Import Firebase functions

const UserSettings = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(false);
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
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

    // Listen for authentication state change
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await fetchUserData(currentUser.uid); // Ensure we await user data
      } else {
        router.replace('/'); // Redirect to login if not logged in
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

      {/* Custom Logout Modal */}
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
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmLogout}
              >
                <Text style={styles.confirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F9F9F9', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  profileSection: { alignItems: 'center', marginBottom: 20 },
  profileIcon: { width: 100, height: 100, borderRadius: 50, marginBottom: 10, borderWidth: 2, borderColor: '#ddd' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#333' },

  infoContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, width: '100%', marginBottom: 20 },
  infoText: { fontSize: 16, color: '#555', paddingVertical: 2 },

  toggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 15, borderRadius: 10, width: '100%', marginBottom: 20 },
  toggleText: { fontSize: 16, color: '#333' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 10 },
  newsItem: { fontSize: 14, color: '#444', paddingVertical: 5 },

  logoutButton: { marginTop: 20, backgroundColor: '#E63946', paddingVertical: 10, paddingHorizontal: 40, borderRadius: 10 },
  logoutText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalText: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 5, marginHorizontal: 5 },
  cancelButton: { backgroundColor: '#ccc' },
  confirmButton: { backgroundColor: '#E63946' },
  cancelText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  confirmText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});

export default UserSettings;