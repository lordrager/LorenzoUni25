import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getUser } from "@/class/User"; // Ensure this function fetches user data
import { addMockNewsData } from "@/class/News";

export default function UserNotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const auth = getAuth();

  useEffect(() => {
    //addMockNewsData();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User logged in:", user.uid);
        try {
          const userData = await getUser(user.uid);
          if (userData && userData.notifications) {
            setNotifications(userData.notifications);
          } else {
            setNotifications([]); // No notifications available
          }
        } catch (err) {
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!notifications.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noNotificationsText}>No notifications available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            <Text style={styles.notificationTime}>{item.timestamp}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f9f9" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  errorText: { fontSize: 16, color: "red", textAlign: "center" },
  noNotificationsText: { fontSize: 16, color: "#666", textAlign: "center" },
  
  notificationCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  notificationMessage: { fontSize: 14, color: "#444", marginBottom: 5 },
  notificationTime: { fontSize: 12, color: "#888", textAlign: "right" },
});