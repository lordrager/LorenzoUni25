import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getAllUsers } from "@/class/User";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

export default function LeaderboardScreen() {
  const [users, setUsers] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoggedInUser(user.uid);
        console.log("Logged in user:", user.uid);
      } else {
        // If no user is logged in, navigate to the login page.
        router.replace("/");
      }
    });

    // Fetch all users and sort them by level
    const fetchUsers = async () => {
      try {
        const allUsers = await getAllUsers();
        console.log("All users:", allUsers);
        const sortedUsers = allUsers.sort((a, b) => b.level - a.level);
        setUsers(sortedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      {/* Back Arrow in the top left corner */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.replace("/user_settings")}
      >
        <FontAwesome name="arrow-left" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.title}>🏆 Leaderboard</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.item, item.id === loggedInUser && styles.highlight]}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <Text style={styles.name}>{item.profileName}</Text>
            <Text style={styles.level}>Level {item.level}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  rank: {
    fontSize: 18,
    fontWeight: "bold",
    width: 50,
  },
  name: {
    fontSize: 18,
    flex: 1,
  },
  level: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
  },
  highlight: {
    backgroundColor: "#e3f2fd",
  },
});