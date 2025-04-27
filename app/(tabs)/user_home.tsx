import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ArticleModal from "../../components/articlemodal";
import StreakModal from "@/components/streakmodal";
import { router } from "expo-router";
import { getRecentNewsByTags, incrementNewsLikes, incrementNewsDislikes } from "../../class/News";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getUser,
  updateStreak,
  addWatchedNews,
  addLikedNews,
  addDislikedNews,
} from "@/class/User";
import { Feather } from "@expo/vector-icons";
import { BootstrapStyles } from "@/app/styles/bootstrap";

export default function UserHomeScreen() {
  const [newsArticles, setNewsArticles] = useState([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggedUser, setLoggedUser] = useState(null);
  const [firstLoginToday, setFirstLoginToday] = useState(false);
  const [watchedArticles, setWatchedArticles] = useState(new Set());

  const auth = getAuth();
  const currentArticle = newsArticles.length > 0 ? newsArticles[currentArticleIndex] : null;

  useEffect(() => {}, [firstLoginToday]);

  useEffect(() => {
    const fetchUserAndNews = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            console.log("No user found, redirecting to login");
            try {
              router.replace("/");
            } catch (navError) {
              console.error("Navigation error:", navError);
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
              router.push("/");
            }
            return;
          }

          // Compute previous login info
          const prevLastLogin = userData.last_login
            ? new Date(userData.last_login)
            : null;
          const now = new Date();
          const todayString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
          const prevLoginString = prevLastLogin
            ? `${prevLastLogin.getFullYear()}-${prevLastLogin.getMonth() + 1}-${prevLastLogin.getDate()}`
            : "";
          
          // isFirstLogin is true if the previous login is not today
          const isFirstLogin = prevLoginString !== todayString;
          await updateStreak(user.uid);
          userData = await getUser(user.uid);
          setLoggedUser({ ...userData, id: user.uid });
          
          // Keep track of already watched articles
          if (userData.watched_news) {
            setWatchedArticles(new Set(userData.watched_news));
          }

          // Fetch articles
          if (userData?.tags?.length) {
            const newsSnapshot = await getRecentNewsByTags(userData.tags);
            
            // Filter out already watched news
            const watchedNewsSet = new Set(userData.watched_news || []);
            const unseenNews = newsSnapshot.filter(
              (news) => !watchedNewsSet.has(news.id)
            );
            setNewsArticles(unseenNews);
          } 

          setLoading(false);

          // Show the streak modal if first login today
          if (isFirstLogin) {
            setFirstLoginToday(true);
            setTimeout(() => {
              setFirstLoginToday(false);
            }, 3000);
          }
        });
        return () => unsubscribe();
      } catch (err) {
        const errorMessage = err?.message || "Unknown error occurred";
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchUserAndNews();
  }, []);

  // Mark article as watched
  const markArticleAsWatched = async (articleId) => {
    if (!loggedUser || !articleId || watchedArticles.has(articleId)) {
      return;
    }
    
    try {
      await addWatchedNews(loggedUser.id, articleId);
      
      // Update local state
      setWatchedArticles(prev => {
        const newSet = new Set(prev);
        newSet.add(articleId);
        return newSet;
      });
    } catch (error) {
      console.error("Error marking article as watched:", error);
    }
  };

  // Handle Like function
  const handleLike = async () => {
    if (!loggedUser || !currentArticle) {
      return;
    }
    
    console.log("Liking article:", currentArticle.id);
    try {
      // Mark as watched
      await markArticleAsWatched(currentArticle.id);
      
      // Update the news document
      await incrementNewsLikes(currentArticle.id);
      
      // Add to user's liked news
      const success = await addLikedNews(loggedUser.id, currentArticle.id);
      
      if (success) {
        moveToNextArticle(currentArticle.id);
      } 
    } catch (error) {
      console.error("Error liking article:", error);
    }
  };

  // Handle Dislike function
  const handleDislike = async () => {
    if (!loggedUser || !currentArticle) {
      return;
    }
    
    console.log("Disliking article:", currentArticle.id);
    try {
      // Mark as watched
      await markArticleAsWatched(currentArticle.id);
      
      // Update the news document
      await incrementNewsDislikes(currentArticle.id);
      
      // Add to user's disliked news
      const success = await addDislikedNews(loggedUser.id, currentArticle.id);
      
      if (success) {
        moveToNextArticle(currentArticle.id);
      } 
    } catch (error) {
      console.error("Error disliking article:", error);
    }
  };

  // Move to next article
  const moveToNextArticle = (articleId) => {
    const nextIndex = currentArticleIndex < newsArticles.length - 1 ? currentArticleIndex + 1 : 0;
    
    setNewsArticles((prevArticles) => 
      prevArticles.filter((news) => news.id !== articleId)
    );
    
    if (nextIndex >= newsArticles.length - 1) {
      setCurrentArticleIndex(0);
    } else {
      setCurrentArticleIndex(nextIndex);
    }
  };

  // Handle modal article actions
  const handleArticleAction = (articleId, action) => {
    if (action === 'watched') {
      setWatchedArticles(prev => {
        const newSet = new Set(prev);
        newSet.add(articleId);
        return newSet;
      });
    }
    
    // Move to next article for likes and dislikes
    if (action === 'like' || action === 'dislike') {
      moveToNextArticle(articleId);
    }
  };

  // Close modal handler
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#4dc9ff', '#00bfa5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={BootstrapStyles.container}
      >
        <View style={[BootstrapStyles.container, BootstrapStyles.justifyContentCenter, BootstrapStyles.alignItemsCenter]}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={[BootstrapStyles.mt3, {color: '#ffffff', fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto'}]}>
            Loading News Feed...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#4dc9ff', '#00bfa5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={BootstrapStyles.container}
      >
        <View style={[BootstrapStyles.container, BootstrapStyles.justifyContentCenter, BootstrapStyles.alignItemsCenter]}>
          <Text style={[
            BootstrapStyles.textCenter, 
            {
              color: '#ffffff',
              fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto'
            }
          ]}>
            Error: {error}
          </Text>
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
      </LinearGradient>
    );
  }

  if (!newsArticles.length) {
    return (
      <LinearGradient
        colors={['#4dc9ff', '#00bfa5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={BootstrapStyles.container}
      >
        <View style={[BootstrapStyles.container, BootstrapStyles.justifyContentCenter, BootstrapStyles.alignItemsCenter]}>
          <Text style={[
            BootstrapStyles.textCenter, 
            {
              color: '#ffffff', 
              fontSize: 20,
              fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
              letterSpacing: 0.5,
            }
          ]}>
            No more articles available
          </Text>
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
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#4dc9ff', '#00bfa5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        {currentArticle && (
          <TouchableOpacity
            style={styles.articleCard}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.92}
          >
            {/* Article Border Accent */}
            <View style={styles.accentBorder} />
            
            {/* Article Title and Content */}
            <View style={styles.articleContent}>
              <Text style={styles.articleTitle}>
                {currentArticle.title}
              </Text>
              <Text style={styles.articlePreview} numberOfLines={4}>
                {currentArticle.content_short}
              </Text>
            </View>
            
            {/* Article Actions */}
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={styles.dislikeButton}
                onPress={handleDislike}
              >
                <Feather name="thumbs-down" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Dislike</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.likeButton}
                onPress={handleLike}
              >
                <Feather name="thumbs-up" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Like</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Article Modal */}
      {currentArticle && (
        <ArticleModal
          visible={isModalVisible}
          article={currentArticle}
          userId={loggedUser?.id}
          onClose={handleCloseModal}
          onArticleAction={handleArticleAction}
        />
      )}

      {/* Streak Modal */}
      {loggedUser && (
        <StreakModal
          visible={firstLoginToday}
          streak={loggedUser.streak}
          level={loggedUser.level}
          experience={loggedUser.experience}
          onClose={() => setFirstLoginToday(false)}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  articleCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
      }
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  accentBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#00bcd4',
  },
  articleContent: {
    padding: 24,
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00bcd4',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
    letterSpacing: 0.25,
    lineHeight: 32,
  },
  articlePreview: {
    fontSize: 17,
    lineHeight: 26,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
    letterSpacing: 0.3,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00bcd4',
    borderRadius: 30,
    paddingVertical: 13,
    paddingHorizontal: 22,
    width: '48%',
    ...Platform.select({
      ios: {
        shadowColor: '#00bcd4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  dislikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    borderRadius: 30,
    paddingVertical: 13,
    paddingHorizontal: 22,
    width: '48%',
    ...Platform.select({
      ios: {
        shadowColor: '#f44336',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.5,
  },
});