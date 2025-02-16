import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import ArticleModal from "../../components/articlemodal";
import StreakModal from "@/components/streakmodal";
import { router } from "expo-router";
import { getRecentNewsByTags } from "../../class/News";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getUser,
  updateStreak,
  addWatchedNews,
  addLikedNews,
  addDislikedNews,
} from "@/class/User";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const { height } = Dimensions.get("window");

export default function UserHomeScreen() {
  const [newsArticles, setNewsArticles] = useState([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggedUser, setLoggedUser] = useState(null);
  const [firstLoginToday, setFirstLoginToday] = useState(false);

  const auth = getAuth();
  const currentArticle = newsArticles[currentArticleIndex];

  useEffect(() => {}, [firstLoginToday]);

  useEffect(() => {
    const fetchUserAndNews = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            router.replace("/"); // Redirect to login
            return;
          }

          let userData = await getUser(user.uid);
          if (!userData) return;

          // Compute previous login info BEFORE updating the streak.
          const prevLastLogin = userData.last_login
            ? new Date(userData.last_login)
            : null;
          const now = new Date();
          const todayString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
          const prevLoginString = prevLastLogin
            ? `${prevLastLogin.getFullYear()}-${prevLastLogin.getMonth() + 1}-${prevLastLogin.getDate()}`
            : "";
          
          // isFirstLogin is true if the previous login is not today.
          const isFirstLogin = prevLoginString !== todayString;
          // Update the streak (which updates last_login) and re-fetch user data.
          await updateStreak(user.uid);
          userData = await getUser(user.uid);
          // Ensure loggedUser has an id property
          setLoggedUser({ ...userData, id: user.uid });

          // Fetch articles only after updating the streak.
          if (userData?.tags?.length) {
            const newsSnapshot = await getRecentNewsByTags(userData.tags);
            const unseenNews = newsSnapshot.filter(
              (news) => !userData.watched_news?.includes(news.id)
            );
            setNewsArticles(unseenNews);
          }

          // Finished loading articles.
          setLoading(false);

          // Show the streak modal if it is the first login today and auto-hide it after 3 seconds.
          if (isFirstLogin) {
            setFirstLoginToday(true);
            setTimeout(() => {
              setFirstLoginToday(false);
            }, 3000);
          }
        });
        return () => unsubscribe();
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserAndNews();
  }, []);

  // New logic for Like and Dislike buttons:
  const handleLike = async () => {
    if (loggedUser && currentArticle) {
      console.log("Liked article:", currentArticle.title);
      console.log("User ID:", loggedUser.id);
      console.log("Article ID:", currentArticle.id);
      const success = await addLikedNews(loggedUser.id, currentArticle.id);
      if (success) {
        setNewsArticles((prevArticles) =>
          prevArticles.filter((news) => news.id !== currentArticle.id)
        );
        setCurrentArticleIndex((prev) =>
          prev < newsArticles.length - 1 ? prev + 1 : 0
        );
      }
    }
  };

  const handleDislike = async () => {
    if (loggedUser && currentArticle) {
      const success = await addDislikedNews(loggedUser.id, currentArticle.id);
      if (success) {
        setNewsArticles((prevArticles) =>
          prevArticles.filter((news) => news.id !== currentArticle.id)
        );
        setCurrentArticleIndex((prev) =>
          prev < newsArticles.length - 1 ? prev + 1 : 0
        );
      }
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
        {loggedUser && (
          <StreakModal
            visible={firstLoginToday}
            streak={loggedUser.streak}
            level={loggedUser.level}
            experience={loggedUser.experience}
            onClose={() => setFirstLoginToday(false)}
          />
        )}
      </View>
    );
  }

  if (!newsArticles.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noArticlesText}>No articles available</Text>
        {loggedUser && (
          <StreakModal
            visible={firstLoginToday}
            streak={loggedUser.streak}
            level={loggedUser.level}
            experience={loggedUser.experience}
            onClose={() => setFirstLoginToday(false)}
          />
        )}
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
            onPress={handleDislike}
          >
            <Text style={styles.buttonText}>Dislike</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.likeButton]}
            onPress={handleLike}
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

      {loggedUser && (
        <StreakModal
          visible={firstLoginToday}
          streak={loggedUser.streak}
          level={loggedUser.level}
          experience={loggedUser.experience}
          onClose={() => setFirstLoginToday(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f2f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  newsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 15,
    textAlign: "center",
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
    marginBottom: 25,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  likeButton: {
    backgroundColor: "#007bff",
  },
  dislikeButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
  },
  noArticlesText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default UserHomeScreen;