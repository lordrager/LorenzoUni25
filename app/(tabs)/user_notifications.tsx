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
import { getUser } from "@/class/User";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ArticleModal from "@/components/articlemodal";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { 
  Notification,
  getUserNotifications, 
  setCurrentUserId, 
  markNotificationAsRead,
  clearAllNotifications,
  addMockNotifications
} from "@/class/Notification";

export default function UserNotificationScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
          // Set user ID in notification system
          setCurrentUserId(user.uid);
          
          const userData = await getUser(user.uid);
          if (userData) {
            setCurrentUser({...userData, id: user.uid});
            
            // Get notifications using the function approach
            const userNotifications = await getUserNotifications();
            setNotifications(userNotifications);
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

  // Function to handle notification click
  const handleNotificationPress = async (notification: Notification) => {
    console.log("Notification clicked:", notification);
    
    // If it's not already read, mark it as read
    if (!notification.read && notification.id) {
      await markNotificationAsRead(notification.id);
      
      // Update the notifications list
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    }
    
    // If notification doesn't have articleId, ignore
    if (!notification.data?.articleId) {
      console.log("No article ID in notification");
      return;
    }
    
    try {
      setLoading(true);
      // Fetch the article data from Firestore
      const articleRef = doc(db, "news", notification.data.articleId);
      const articleSnap = await getDoc(articleRef);
      
      if (articleSnap.exists()) {
        // Get article data and add ID field
        const articleData = articleSnap.data();
        const articleWithId = { 
          id: articleSnap.id, 
          ...articleData 
        };
        
        console.log("Article data loaded:", articleWithId.title);
        setSelectedArticle(articleWithId);
        setModalVisible(true);
      } else {
        console.log("No article found with ID:", notification.data.articleId);
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
  const handleArticleAction = (articleId: string, action: string) => {
    console.log(`Article ${articleId} was ${action}ed`);
    // Refresh notifications after article action if needed
    refreshNotifications();
  };
  
  // Refresh notifications
  const refreshNotifications = async () => {
    try {
      setLoading(true);
      if (currentUser?.id) {
        const userNotifications = await getUserNotifications();
        setNotifications(userNotifications);
      }
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Close modal handler
  const handleCloseModal = () => {
    setModalVisible(false);
  };
  
  // Clear all notifications
  const handleClearAll = async () => {
    if (!currentUser?.id) return;
    
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await clearAllNotifications();
              setNotifications([]);
            } catch (error) {
              console.error("Error clearing notifications:", error);
              Alert.alert("Error", "Failed to clear notifications");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // Add mock notifications (for testing)
  const handleAddMockNotifications = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      
      // Create some mock notifications
      const success = await addMockNotifications(5);
      
      if (success) {
        await refreshNotifications();
        Alert.alert("Success", "Mock notifications added");
      } else {
        Alert.alert("Error", "Failed to add mock notifications");
      }
    } catch (error) {
      console.error("Error adding mock notifications:", error);
      Alert.alert("Error", "Failed to add mock notifications");
    } finally {
      setLoading(false);
    }
  };

  // Create a very simple mock notification directly (fallback if other methods fail)
  const createSimpleMockNotification = () => {
    const now = new Date();
    const mockNotification = new Notification(
      `notif_${Date.now()}`,
      "Test Notification",
      "This is a test notification created directly in the UI",
      now.toISOString(),
      "system",
      {},
      false
    );
    
    setNotifications(prevNotifications => [mockNotification, ...prevNotifications]);
  };

  // Render notification item with status indicator
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    // Check if user has liked or disliked this article
    const isLiked = currentUser?.liked_news?.includes(item.data?.articleId);
    const isDisliked = currentUser?.disliked_news?.includes(item.data?.articleId);
    
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.read && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
      >
        {/* Notification type icon */}
        <View style={styles.iconContainer}>
          {item.type === 'article' && (
            <MaterialIcons name="article" size={24} color="#00bcd4" />
          )}
          {item.type === 'achievement' && (
            <MaterialIcons name="emoji-events" size={24} color="#ffc107" />
          )}
          {item.type === 'system' && (
            <Ionicons name="notifications" size={24} color="#9c27b0" />
          )}
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          
          {/* Article reaction indicators if applicable */}
          {item.type === 'article' && (
            <View style={styles.reactionContainer}>
              {isLiked && (
                <View style={styles.reactionBadge}>
                  <Ionicons name="thumbs-up" size={14} color="#00bcd4" />
                  <Text style={styles.reactionText}>Liked</Text>
                </View>
              )}
              {isDisliked && (
                <View style={styles.reactionBadge}>
                  <Ionicons name="thumbs-down" size={14} color="#f44336" />
                  <Text style={[styles.reactionText, {color: '#f44336'}]}>Disliked</Text>
                </View>
              )}
            </View>
          )}
          
          <Text style={styles.notificationTime}>
            {typeof item.timestamp === 'string' 
              ? new Date(item.timestamp).toLocaleString() 
              : item.timestamp && typeof item.timestamp.toDate === 'function'
                ? item.timestamp.toDate().toLocaleString()
                : 'Recent'}
          </Text>
        </View>
        
        {!item.read && <View style={styles.unreadIndicator} />}
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
          
          {/* Add test buttons for debugging */}
          <View style={styles.debugButtonsContainer}>
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={handleAddMockNotifications}
            >
              <Text style={styles.debugButtonText}>Add Mock Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={createSimpleMockNotification}
            >
              <Text style={styles.debugButtonText}>Add Simple Mock</Text>
            </TouchableOpacity>
          </View>
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
        
        {/* Add action buttons */}
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleClearAll}
            >
              <Ionicons name="trash-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={refreshNotifications}
            >
              <Ionicons name="refresh-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {!notifications.length ? (
        <View style={styles.centerContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#ffffff" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            We'll notify you when there's something new
          </Text>
          
          {/* For testing only - remove in production */}
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleAddMockNotifications}
          >
            <Text style={styles.testButtonText}>Add Test Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={createSimpleMockNotification}
          >
            <Text style={styles.testButtonText}>Add Simple Mock</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id || `${Math.random()}`}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={refreshNotifications}
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
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
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
  testButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  testButtonText: {
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  debugButtonsContainer: {
    marginTop: 20,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugButton: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: 220,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
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
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  reactionText: {
    fontSize: 12,
    color: '#00bcd4',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
});