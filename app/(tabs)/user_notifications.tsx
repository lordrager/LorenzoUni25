import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Platform,
  Alert
} from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getUser, UserNotification, markNotificationAsSeen, addWatchedNews } from "@/class/User";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ArticleModal from "@/components/articlemodal";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { 
  setCurrentUserId, 
  getUserNotifications as getNotifications
} from "@/class/NotificationService";

export default function UserNotificationScreen() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // States for article modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User logged in:", user.uid);
        try {
          // Set user ID in notification service
          setCurrentUserId(user.uid);
          
          const userData = await getUser(user.uid);
          if (userData) {
            setCurrentUser({...userData, id: user.uid});
            
            // Get notifications using the notification service
            await loadNotifications();
          }
        } catch (err) {
          console.error("Error loading notifications:", err);
          setError("Failed to load notifications.");
        } finally {
          setLoading(false);
        }
      } else {
        console.log("User not logged in");
        router.replace("/"); // Redirect if not logged in
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Get notifications from service
      const userNotifications = await getNotifications();
      
      // Sort notifications by date (newest first)
      const sortedNotifications = [...userNotifications].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setNotifications(sortedNotifications);
      console.log(`Loaded ${sortedNotifications.length} notifications`);
      
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle notification click
  const handleNotificationPress = async (notification: UserNotification) => {
    console.log("Notification clicked:", notification);
    
    // If it's not already seen, mark it as seen
    if (!notification.isSeen && notification.id) {
      await markNotificationAsSeen(currentUser.id, notification.id);
      
      // Update the notifications list
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notification.id ? { ...n, isSeen: true } : n
        )
      );
    }
    
    // If notification doesn't have newsId, ignore
    if (!notification.newsId) {
      console.log("No news ID in notification");
      return;
    }
    
    try {
      setLoading(true);
      // Fetch the article data from Firestore
      const articleRef = doc(db, "news", notification.newsId);
      const articleSnap = await getDoc(articleRef);
      
      if (articleSnap.exists()) {
        // Get article data and add ID field
        const articleData = articleSnap.data();
        const articleWithId = { 
          id: articleSnap.id, 
          ...articleData 
        };
        
        console.log("Article data loaded:", articleWithId.title);
        
        // Mark article as watched immediately when opened from notification
        if (currentUser?.id && articleWithId.id) {
          await addWatchedNews(currentUser.id, articleWithId.id);
          console.log(`Article ${articleWithId.id} marked as watched`);
        }
        
        setSelectedArticle(articleWithId);
        setModalVisible(true);
      } else {
        console.log("No article found with ID:", notification.newsId);
        Alert.alert(
          "Article Not Found", 
          "This article is no longer available.",
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      console.error("Error loading article:", err);
      Alert.alert(
        "Error", 
        "Failed to load the article. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle article action (like/dislike)
  const handleArticleAction = async (articleId: string, action: string) => {
    console.log(`Article ${articleId} was ${action}ed`);
    
    // When an article is liked or disliked, update the user data
    const updatedUser = await getUser(currentUser.id);
    if (updatedUser) {
      setCurrentUser({...updatedUser, id: currentUser.id});
    }
    
    // Update the notifications that correspond to this article to show they've been seen
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => {
        if (notification.newsId === articleId) {
          return { ...notification, isSeen: true };
        }
        return notification;
      })
    );
  };

  // Close modal handler
  const handleCloseModal = async () => {
    setModalVisible(false);
    
    // After closing the modal, refresh the user data
    // to ensure liked_news and disliked_news are up to date
    if (currentUser?.id) {
      const updatedUser = await getUser(currentUser.id);
      if (updatedUser) {
        setCurrentUser({...updatedUser, id: currentUser.id});
      }
    }
    
    setSelectedArticle(null);
  };

  // Render notification item with status indicator
  const renderNotificationItem = ({ item }: { item: UserNotification }) => {
    // Check if user has liked or disliked this article
    const isLiked = item.newsId ? currentUser?.liked_news?.includes(item.newsId) : false;
    const isDisliked = item.newsId ? currentUser?.disliked_news?.includes(item.newsId) : false;
    const isWatched = item.newsId ? currentUser?.watched_news?.includes(item.newsId) : false;
    
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.isSeen && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
      >
        {/* Notification type icon */}
        <View style={styles.iconContainer}>
          {item.newsId ? (
            <MaterialIcons name="article" size={24} color="#00bcd4" />
          ) : (
            <Ionicons name="notifications" size={24} color="#9c27b0" />
          )}
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>
            {item.newsId ? "New Article" : "Notification"}
          </Text>
          <Text style={styles.notificationMessage}>{item.description}</Text>
          
          {/* Show interaction indicators if applicable */}
          {item.newsId && (
            <View style={styles.reactionContainer}>
              {isWatched && (
                <View style={[styles.reactionBadge, {backgroundColor: 'rgba(76, 175, 80, 0.1)'}]}>
                  <Ionicons name="eye" size={14} color="#4CAF50" />
                  <Text style={[styles.reactionText, {color: '#4CAF50'}]}>Read</Text>
                </View>
              )}
              
              {isLiked && (
                <View style={[styles.reactionBadge, {backgroundColor: 'rgba(0, 188, 212, 0.1)'}]}>
                  <Ionicons name="thumbs-up" size={14} color="#00bcd4" />
                  <Text style={[styles.reactionText, {color: '#00bcd4'}]}>Liked</Text>
                </View>
              )}
              
              {isDisliked && (
                <View style={[styles.reactionBadge, {backgroundColor: 'rgba(244, 67, 54, 0.1)'}]}>
                  <Ionicons name="thumbs-down" size={14} color="#f44336" />
                  <Text style={[styles.reactionText, {color: '#f44336'}]}>Disliked</Text>
                </View>
              )}
            </View>
          )}
          
          <Text style={styles.notificationTime}>
            {new Date(item.date).toLocaleString()}
          </Text>
        </View>
        
        {!item.isSeen && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };

  if (loading && !notifications.length) {
    return (
      <LinearGradient
        colors={['#4dc9ff', '#00bfa5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
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
        style={styles.gradientContainer}
      >
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ffffff" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#4dc9ff', '#00bfa5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Notifications</Text>
      </View>
      
      {!notifications.length ? (
        <View style={styles.centerContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#ffffff" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            We'll notify you when there's something new
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id || `${Math.random()}`}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadNotifications}
        />
      )}
      
      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal
          visible={modalVisible}
          article={selectedArticle}
          userId={currentUser?.id}
          onClose={handleCloseModal}
          onArticleAction={handleArticleAction}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  container: { 
    flex: 1, 
    backgroundColor: "rgba(249, 249, 249, 0.9)" 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: "#ffffff",
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  errorText: { 
    fontSize: 16, 
    color: "#ffffff", 
    textAlign: "center",
    marginTop: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  notificationCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderLeftWidth: 3,
    borderLeftColor: '#00bcd4',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    marginBottom: 4,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  notificationMessage: { 
    fontSize: 14, 
    color: "#555", 
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  notificationTime: { 
    fontSize: 12, 
    color: "#888", 
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00bcd4',
  },
  reactionContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  reactionText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
});