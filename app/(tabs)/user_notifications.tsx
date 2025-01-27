import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function UserNotificationScreen() {
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