import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert 
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/app/firebaseConfig"; // Adjust if your path is different
import { LinearGradient } from "expo-linear-gradient";
import { BootstrapStyles } from "@/app/styles/bootstrap";

export default function PreferredNewsScreen() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const tags = [
    "US", "UK", "War", "Politics", "Technology", "Sports", "Economy", "Health", "Science",
    "Entertainment", "Environment", "Travel", "Education", "Business", "Lifestyle", "Culture", "Art",
    "Food", "Fashion", "Finance", "History"
  ];

  // Check authentication status and retrieve user info on mount
  useEffect(() => {
    console.log("PreferredNews - Component mounted");
    const auth = getAuth();
    const storedUsername = window.localStorage.getItem("usernameForSignUp");
    
    console.log("PreferredNews - Stored username:", storedUsername ? "Found" : "Not found");
    
    if (storedUsername) {
      setUsername(storedUsername);
    }
    
    console.log("PreferredNews - Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("PreferredNews - User found in auth state:", user.email);
        console.log("PreferredNews - Email verified status:", user.emailVerified);
        
        // If user exists, check verification status and set email
        setIsVerified(user.emailVerified);
        setEmail(user.email || "");
        
        if (!user.emailVerified) {
          // If email not verified, redirect back to confirm_email
          console.log("PreferredNews - Email not verified, redirecting to confirm_email");
          Alert.alert(
            "Email Not Verified", 
            "Please verify your email before selecting your preferences.",
            [{ text: "OK", onPress: () => router.replace("/confirm_email") }]
          );
        } else {
          console.log("PreferredNews - Email verified, user can proceed");
        }
      } else {
        console.log("PreferredNews - No user found in auth state, checking localStorage");
        // If no user is signed in, check localStorage
        const storedEmail = window.localStorage.getItem("emailForSignUp");
        if (storedEmail) {
          console.log("PreferredNews - Found email in localStorage:", storedEmail);
          setEmail(storedEmail);
        } else {
          // If no user and no email, redirect to registration
          console.log("PreferredNews - No user information found, redirecting to register");
          Alert.alert("Error", "User information missing. Please start over.");
          router.replace("/register");
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleTagSelect = (tag: string) => {
    console.log("PreferredNews - Tag selected/deselected:", tag);
    setSelectedTags((prevSelectedTags) => {
      const isAlreadySelected = prevSelectedTags.includes(tag);
      const newTags = isAlreadySelected
        ? prevSelectedTags.filter((item) => item !== tag)
        : [...prevSelectedTags, tag];
        
      console.log("PreferredNews - Previous tags count:", prevSelectedTags.length);
      console.log("PreferredNews - New tags count:", newTags.length);
      return newTags;
    });
  };

  const isSubmitDisabled = selectedTags.length < 4 || isLoading || !isVerified;

  const handleSubmit = async () => {
    console.log("PreferredNews - Submit button pressed");
    console.log("PreferredNews - Selected tags count:", selectedTags.length);
    console.log("PreferredNews - Email verified status:", isVerified);
    
    if (selectedTags.length < 4) {
      console.log("PreferredNews - Not enough tags selected");
      Alert.alert("Error", "Please select at least 4 tags.");
      return;
    }

    if (!isVerified) {
      console.log("PreferredNews - Email not verified, redirecting");
      Alert.alert("Error", "Please verify your email before proceeding.");
      router.replace("/confirm_email");
      return;
    }

    console.log("PreferredNews - Starting submission process");
    setIsLoading(true);
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.log("PreferredNews - No authenticated user found");
        throw new Error("User not authenticated");
      }
      
      console.log("PreferredNews - User found:", user.uid);
      console.log("PreferredNews - Saving data to Firestore");
      
      // Save user data to Firestore including the username and selected tags
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        username: username || "User",
        email: user.email,
        tags: selectedTags,
        createdAt: new Date(),
        emailVerified: true
      });
      console.log("PreferredNews - Data saved successfully");

      // Remove stored data after successful registration
      console.log("PreferredNews - Cleaning up localStorage");
      window.localStorage.removeItem("emailForSignUp");
      window.localStorage.removeItem("passwordForSignUp");
      window.localStorage.removeItem("usernameForSignUp");

      // Navigation function to ensure routing works
      const navigateToHome = () => {
        console.log("PreferredNews - Executing navigation to home");
        
        try {
          console.log("PreferredNews - Attempting router.replace to /");
          router.replace("/");
        } catch (navError) {
          console.error("PreferredNews - Navigation error with replace:", navError);
          
          // Try alternative navigation methods if replace fails
          try {
            console.log("PreferredNews - Attempting router.push to /");
            router.push("/");
          } catch (pushError) {
            console.error("PreferredNews - Navigation error with push:", pushError);
            
            // Last resort - use setTimeout
            console.log("PreferredNews - Attempting navigation with timeout");
            setTimeout(() => {
              window.location.href = "/";
            }, 500);
          }
        }
      };

      // Show success message and navigate to home
      console.log("PreferredNews - Registration complete, showing success alert");
      Alert.alert(
        "Setup Complete",
        "Your preferences have been saved successfully!",
        [{ 
          text: "Continue", 
          onPress: () => {
            console.log("PreferredNews - Alert continue button pressed");
            navigateToHome();
          }
        }]
      );
      
      // Fallback navigation in case the Alert callback doesn't work
      // Will execute after a short delay to give the Alert time to display
      setTimeout(() => {
        console.log("PreferredNews - Executing fallback navigation after timeout");
        navigateToHome();
      }, 2000);
      
    } catch (error) {
      console.error("PreferredNews - Error saving preferences:", error);
      Alert.alert("Error", "Failed to save preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    // Confirm if user wants to go back
    Alert.alert(
      "Go Back",
      "Are you sure you want to go back to email verification?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          onPress: () => {
            router.replace("/confirm_email");
          }
        }
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#4dc9ff', '#00bfa5']} // Sky blue to turquoise green
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={BootstrapStyles.container}
    >
      {/* Navigation Header */}
      <View style={[
        BootstrapStyles.flexRow,
        BootstrapStyles.alignItemsCenter,
        BootstrapStyles.py3,
        BootstrapStyles.mb4,
        styles.navHeader
      ]}>
        <TouchableOpacity 
          style={[BootstrapStyles.p2, BootstrapStyles.ml2]} 
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[
          BootstrapStyles.textH3, 
          BootstrapStyles.ml3,
          BootstrapStyles.flexGrow,
          BootstrapStyles.textWhite
        ]}>Get News</Text>
      </View>

      <View style={[styles.container, styles.mainContainer]}>
        <View style={styles.contentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>Choose Your Interests</Text>
          </View>
          
          <View style={styles.cardBody}>
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
              style={[
                styles.button,
                isSubmitDisabled && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Saving..." : "Complete Setup"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 1000,
    backgroundColor: '#00bcd4', // Turquoise color
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  mainContainer: {
    marginTop: 60, // Add space for the fixed header
    paddingTop: 20,
  },
  container: { 
    flex: 1, 
    alignItems: "center", 
    padding: 20,
  },
  contentCard: {
    width: '95%',
    height: 'auto',
    minHeight: '75%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderTopWidth: 5,
    borderTopColor: '#00bcd4',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 0,
  },
  cardHeader: {
    backgroundColor: '#00bcd4',
    width: '100%',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1
  },
  cardHeaderText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardBody: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(240, 248, 255, 0.5)', // Light blue background
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 10, 
    textAlign: "center",
    color: "#fff",
  },
  subtitle: { 
    fontSize: 16, 
    color: "#555", 
    marginBottom: 20, 
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingVertical: 10,
    paddingBottom: 20,
  },
  tagButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    margin: 5,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.3)',
  },
  tagButtonSelected: {
    backgroundColor: "#00bcd4",
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
    width: "95%",
    height: 55,
    backgroundColor: "#00bcd4",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: { 
    backgroundColor: "#ccc",
    shadowOpacity: 0.1,
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});