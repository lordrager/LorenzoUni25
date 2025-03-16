import React, { useEffect, useState } from "react";
import {
  View,
  Text,
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
import { BootstrapStyles } from "@/app/styles/bootstrap";

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
            console.log("No user found, redirecting to login");
            // Use try/catch when redirecting to prevent potential crashes
            try {
              router.replace("/");
            } catch (navError) {
              console.error("Navigation error:", navError);
              // Fallback navigation if replace fails
              router.push("/");
            }
            return;
          }

          let userData = await getUser(user.uid);
          if (!userData) {
            console.log("User data not found, redirecting to login");
            try {
              router.replace("/");
            } catch (navError) {
              console.error("Navigation error:", navError);
              // Fallback navigation if replace fails
              router.push("/");
            }
            return;
          }

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
      <View style={[BootstrapStyles.container, BootstrapStyles.justifyContentCenter, BootstrapStyles.alignItemsCenter]}>
        <ActivityIndicator size="large" color={BootstrapStyles.textPrimary.color} />
        <Text style={[BootstrapStyles.textMuted, BootstrapStyles.mt3]}>Loading News Feed...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[BootstrapStyles.container, BootstrapStyles.justifyContentCenter, BootstrapStyles.alignItemsCenter]}>
        <Text style={[BootstrapStyles.textDanger, BootstrapStyles.textCenter]}>Error: {error}</Text>
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
      <View style={[BootstrapStyles.container, BootstrapStyles.justifyContentCenter, BootstrapStyles.alignItemsCenter]}>
        <Text style={[BootstrapStyles.textMuted, BootstrapStyles.textCenter]}>No articles available</Text>
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
    <View style={[BootstrapStyles.container, BootstrapStyles.bgLight, BootstrapStyles.justifyContentCenter]}>
      <TouchableOpacity
        style={[BootstrapStyles.card, BootstrapStyles.shadow]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
      >
        <Text style={[BootstrapStyles.textH3, BootstrapStyles.textCenter, BootstrapStyles.mb3]}>{currentArticle.title}</Text>
        <Text style={[BootstrapStyles.mb4, { fontSize: 16, lineHeight: 24 }]} numberOfLines={3}>
          {currentArticle.content_short}
        </Text>
        <View style={[BootstrapStyles.flexRow, BootstrapStyles.justifyContentBetween, BootstrapStyles.mt3]}>
          <TouchableOpacity
            style={[BootstrapStyles.btn, BootstrapStyles.btnDanger, BootstrapStyles.w50, BootstrapStyles.mr2]}
            onPress={handleDislike}
          >
            <Text style={BootstrapStyles.textWhite}>Dislike</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[BootstrapStyles.btn, BootstrapStyles.btnPrimary, BootstrapStyles.w50, BootstrapStyles.ml2]}
            onPress={handleLike}
          >
            <Text style={BootstrapStyles.textWhite}>Like</Text>
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

// Remove this duplicate export default
// export default UserHomeScreen;