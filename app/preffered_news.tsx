import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, CheckBox } from "react-native";
import { Link } from "expo-router";

export default function PreferredNewsScreen() {
  const [selectedTags, setSelectedTags] = useState([]);

  const tags = [
    "US", "UK", "War", "Politics", "Technology", "Sports", "Economy", "Health", "Science",
    "Entertainment", "Environment", "Travel", "Education", "Business", "Lifestyle", "Culture", "Art",
    "Food", "Fashion", "Finance", "History"
  ];

  const handleTagSelect = (tag) => {
    setSelectedTags((prevSelectedTags) =>
      prevSelectedTags.includes(tag)
        ? prevSelectedTags.filter((item) => item !== tag)
        : [...prevSelectedTags, tag]
    );
  };

  const isSubmitDisabled = selectedTags.length < 4; // Ensure at least 4 tags are selected

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preferred News</Text>
      <Text style={styles.subtitle}>
        Please select at least 4 tags that interest you.
      </Text>

      {/* List of tags */}
      <ScrollView style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tagItem}>
            <CheckBox
              value={selectedTags.includes(tag)}
              onValueChange={() => handleTagSelect(tag)}
            />
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Submit Button */}
      <Link href="/user_home" style={styles.link}>
      <Text style={[styles.button, isSubmitDisabled && styles.disabledButton]}>Submit</Text>
      </Link>

      {/* Link to go back */}
      <Link href="/confirm_email" style={styles.link}>
        <Text style={styles.linkText}>Go Back</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 20, textAlign: "center" },
  tagsContainer: { width: "100%", maxHeight: 300, marginBottom: 20 },
  tagItem: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  tagText: { fontSize: 16, marginLeft: 10 },
  button: {
    width: "100%",
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  disabledButton: { backgroundColor: "#ccc" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link: { marginTop: 15 },
  linkText: { color: "#6200EE", fontSize: 16, textDecorationLine: "underline" },
});