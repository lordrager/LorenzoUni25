// File: app/liked_news.tsx
import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity 
} from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { getLikedNews } from "@/class/News";

export default function LikedNewsScreen() {
  const [likedNews, setLikedNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if the user is logged in; if not, redirect to login.
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/");
      } else {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Once we have a userId, fetch liked news.
  useEffect(() => {
    const fetchLikedNews = async () => {
      if (userId) {
        try {
          const news = await getLikedNews(userId);
          setLikedNews(news);
        } catch (error) {
          console.error("Error fetching liked news:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchLikedNews();
  }, [userId]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.itemBox}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemSnippet}>{item.content_short}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (likedNews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace("/user_settings")}
        >
          <FontAwesome name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.noItemsText}>No liked news available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.replace("/user_settings")}
      >
        <FontAwesome name="arrow-left" size={24} color="#000" />
      </TouchableOpacity>
      
      <Text style={styles.header}>Liked News</Text>
      <FlatList
        data={likedNews}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 50, // Space for the back arrow
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 10,
    zIndex: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  itemBox: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  itemSnippet: {
    fontSize: 16,
    color: "#555",
  },
  noItemsText: {
    fontSize: 18,
    color: "#666",
  },
});