import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert 
} from "react-native";
import { Link, router } from "expo-router";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig"; // Import your Firebase config

export default function PreferredNewsScreen() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const tags = [
    "US", "UK", "War", "Politics", "Technology", "Sports", "Economy", "Health", "Science",
    "Entertainment", "Environment", "Travel", "Education", "Business", "Lifestyle", "Culture", "Art",
    "Food", "Fashion", "Finance", "History"
  ];

  const handleTagSelect = (tag: string) => {
    setSelectedTags((prevSelectedTags) =>
      prevSelectedTags.includes(tag)
        ? prevSelectedTags.filter((item) => item !== tag)
        : [...prevSelectedTags, tag]
    );
  };

  const isSubmitDisabled = selectedTags.length < 4; // Require at least 4 tags

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      Alert.alert("Error", "Please select at least 4 tags.");
      return;
    }

    // Retrieve stored email, password, and username
    const storedEmail = window.localStorage.getItem("emailForSignIn");
    const storedPassword = window.localStorage.getItem("passwordForSignIn");
    const storedUsername = window.localStorage.getItem("usernameForSignIn");

    if (storedEmail && storedPassword && storedUsername) {
      try {
        // Create user with Firebase Authentication
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, storedEmail, storedPassword);
        const uid = userCredential.user.uid; // Get user UID

        // Save user data to Firestore including the username and selected tags
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
          uid: uid,
          username: storedUsername,
          email: storedEmail,
          tags: selectedTags,
          createdAt: new Date(),
        });

        // Remove stored data after successful registration
        window.localStorage.removeItem("emailForSignIn");
        window.localStorage.removeItem("passwordForSignIn");
        window.localStorage.removeItem("usernameForSignIn");

        // Navigate to the home screen
        router.replace("/");
      } catch (error) {
        console.error("Error creating user: ", error);
        Alert.alert("Registration Failed", "Error creating user. Please try again.");
      }
    } else {
      Alert.alert("Error", "Registration data is missing.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preferred News</Text>
      <Text style={styles.subtitle}>
        Please select at least 4 tags that interest you.
      </Text>

      {/* Tags List */}
      <ScrollView contentContainerStyle={styles.tagsContainer}>
        {tags.map((tag, index) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.tagButton,
                isSelected && styles.tagButtonSelected,
              ]}
              onPress={() => handleTagSelect(tag)}
            >
              <Text style={[
                styles.tagText,
                isSelected && styles.tagTextSelected,
              ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.button, isSubmitDisabled && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isSubmitDisabled}
      >
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      {/* Link to go back */}
      <Link href="/confirm_email" style={styles.link}>
        <Text style={styles.linkText}>Go Back</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: "center", 
    padding: 20, 
    backgroundColor: "#f9f9f9" 
  },
  title: { 
    fontSize: 30, 
    fontWeight: "bold", 
    marginBottom: 10, 
    textAlign: "center" 
  },
  subtitle: { 
    fontSize: 16, 
    color: "#555", 
    marginBottom: 20, 
    textAlign: "center" 
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingVertical: 10,
  },
  tagButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    margin: 5,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  tagButtonSelected: {
    backgroundColor: "#6200EE",
  },
  tagText: {
    fontSize: 16,
    color: "#333",
  },
  tagTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  button: {
    width: "100%",
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 15,
  },
  disabledButton: { 
    backgroundColor: "#ccc" 
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  link: { 
    marginTop: 10 
  },
  linkText: { 
    color: "#6200EE", 
    fontSize: 16, 
    textDecorationLine: "underline" 
  },
});