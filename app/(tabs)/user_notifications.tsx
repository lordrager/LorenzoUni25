import React, {useEffect} from "react";
import { View, Text, StyleSheet } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth"

export default function UserNotificationScreen() {

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

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to Your Notifications</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9f9f9" },
  text: { fontSize: 24, fontWeight: "bold" },
});