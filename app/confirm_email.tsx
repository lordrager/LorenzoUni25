import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";

export default function ConfirmEmailScreen() {
  const auth = getAuth();
  const { email, password } = useLocalSearchParams();
  sendSignInLinkToEmail(auth, email, actionCodeSettings)
    .then(() => {
    // The link was successfully sent. Inform the user.
    // Save the email locally so you don't need to ask the user for it again
    // if they open the link on the same device.
      window.localStorage.setItem('emailForSignIn', email);
      window.localStorage.setItem('passwordForSignIn', password);
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    // ...
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Your Email</Text>
      <Text style={styles.subtitle}>
        A verification link is sended to the email address you provided.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 20, textAlign: "center" },
  
});