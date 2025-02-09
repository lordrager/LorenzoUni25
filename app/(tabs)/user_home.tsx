import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import ArticleModal from "../../components/articlemodal";
import { router } from "expo-router";
import { getRecentNewsByTags } from "../../class/News";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getUser } from "@/class/User";
import { addWatchedNews } from "@/class/News"; // Import function to save watched news

export default function UserHomeScreen() {
  const [newsArticles, setNewsArticles] = useState([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggedUser, setLoggedUser] = useState(null);
  
  const auth = getAuth();
  const currentArticle = newsArticles[currentArticleIndex];

  useEffect(() => {
    const fetchUserAndNews = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            console.log("User not logged in");
            router.replace("/"); // Redirect to login
            return;
          }

          console.log("User logged in:", user.uid);
          const userData = await getUser(user.uid);
          setLoggedUser(userData);

          if (userData?.tags?.length) {
            console.log("User tags:", userData.tags);

            // Fetch all news by tags
            const newsSnapshot = await getRecentNewsByTags(userData.tags);
            console.log("Fetched news:", newsSnapshot);
            // Filter out watched news
            const unseenNews = newsSnapshot.filter(
              (news) => !userData.watched_news?.includes(news.id)
            );
            console.log("Unseen news:", unseenNews);
            setNewsArticles(unseenNews);
          } else {
            console.log("No tags found for user.");
          }

          setLoading(false);
        });

        return () => unsubscribe(); // Cleanup on unmount
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserAndNews();
  }, []);

  const markAsWatched = async () => {
    if (loggedUser && currentArticle) {
      await addWatchedNews(loggedUser.id, currentArticle.id);
      
      // Remove the watched article from the list
      setNewsArticles((prevArticles) =>
        prevArticles.filter((news) => news.id !== currentArticle.id)
      );

      // Move to the next article
      setCurrentArticleIndex((prev) => (prev < newsArticles.length - 1 ? prev + 1 : 0));
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading News Feed...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!newsArticles.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noArticlesText}>No articles available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.newsCard}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
      >
        <Text style={styles.header}>{currentArticle.title}</Text>
        <Text style={styles.content} numberOfLines={3}>
          {currentArticle.content_short}
        </Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.dislikeButton]}
            onPress={markAsWatched}
          >
            <Text style={styles.buttonText}>Dislike</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.likeButton]}
            onPress={markAsWatched}
          >
            <Text style={styles.buttonText}>Like</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <ArticleModal
        visible={isModalVisible}
        article={currentArticle}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#f0f2f5" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  newsCard: { backgroundColor: "white", borderRadius: 12, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  header: { fontSize: 22, fontWeight: "600", color: "#1a1a1a", marginBottom: 15, textAlign: "center" },
  content: { fontSize: 16, lineHeight: 24, color: "#444", marginBottom: 25 },
  buttonsContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 5 },
  likeButton: { backgroundColor: "#007bff" },
  dislikeButton: { backgroundColor: "#dc3545" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "500" },
  loadingText: { marginTop: 20, fontSize: 16, color: "#666" },
  errorText: { fontSize: 16, color: "#dc3545", textAlign: "center" },
  noArticlesText: { fontSize: 16, color: "#666", textAlign: "center" },
});

export default UserHomeScreen;