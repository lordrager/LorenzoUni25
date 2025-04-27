import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { addWatchedNews} from "../class/News";
import { addLikedNews, addDislikedNews, getUser, removeDislikedNews, removeLikedNews } from "@/class/User";

interface ArticleModalProps {
  visible: boolean;
  article: { 
    id: string;
    title: string; 
    content_long: string; 
    likes: number; 
    dislikes: number;
    total_views: number;
    tags?: string[];
    date?: string;
  } | null;
  userId?: string;
  onClose: () => void;
  onArticleAction?: (articleId: string, action: 'like' | 'dislike' | 'watched') => void;
}

export default function ArticleModal({ 
  visible, 
  article, 
  userId,
  onClose,
  onArticleAction 
}: ArticleModalProps) {
  const [likes, setLikes] = useState(article?.likes || 0);
  const [dislikes, setDislikes] = useState(article?.dislikes || 0);
  const [totalViews, setTotalViews] = useState(article?.total_views || 0);
  const [likePressed, setLikesPressed] = useState(false);
  const [dislikesPressed, setDislikesPressed] = useState(false);
  const [actionPerformed, setActionPerformed] = useState(false);
  const [isMarkedAsWatched, setIsMarkedAsWatched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userLikedNews, setUserLikedNews] = useState<string[]>([]);
  const [userDislikedNews, setUserDislikedNews] = useState<string[]>([]);
  const [userWatchedNews, setUserWatchedNews] = useState<string[]>([]);

  // Check user's interaction history when the modal opens
  useEffect(() => {
    const fetchUserData = async () => {
      if (visible && article && userId) {
        setIsLoading(true);
        
        try {
          const userData = await getUser(userId);
          
          if (userData) {
            // Store the arrays in state for easier access
            setUserLikedNews(userData.liked_news || []);
            setUserDislikedNews(userData.disliked_news || []);
            setUserWatchedNews(userData.watched_news || []);
            
            // Check if this article is in any of the arrays
            const hasLiked = userData.liked_news?.includes(article.id) || false;
            const hasDisliked = userData.disliked_news?.includes(article.id) || false;
            const hasWatched = userData.watched_news?.includes(article.id) || false;
            
            console.log(`Article ${article.id} interaction status:`, {
              liked: hasLiked,
              disliked: hasDisliked,
              watched: hasWatched
            });
            
            // Set the UI state based on previous interactions
            setLikesPressed(hasLiked);
            setDislikesPressed(hasDisliked);
            setIsMarkedAsWatched(hasWatched);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserData();
  }, [visible, article, userId]);

  // Reset numerical states when modal opens/closes
  useEffect(() => {
    if (visible && article) {
      setLikes(article.likes);
      setDislikes(article.dislikes);
      setActionPerformed(false);
      
      // Mark article as watched when opened (only if not already watched)
      if (userId && article.id && !userWatchedNews.includes(article.id)) {
        markAsWatched(userId, article.id);
      }
    }
  }, [visible, article, userId, userWatchedNews]);

  const markAsWatched = async (userId: string, articleId: string) => {
    // Skip if already watched
    if (userWatchedNews.includes(articleId)) return;
    
    try {
      console.log("Marking article as watched:", articleId);
      const success = await addWatchedNews(userId, articleId);
      
      if (success) {
        console.log("Successfully marked article as watched");
        setIsMarkedAsWatched(true);
        
        // Update local state
        setUserWatchedNews(prev => [...prev, articleId]);
        
        // Notify parent component
        if (onArticleAction) {
          onArticleAction(articleId, 'watched');
        }
      }
    } catch (error) {
      console.error("Error marking article as watched:", error);
    }
  };

  const handleClose = () => {
    console.log("Closing modal, action performed:", actionPerformed);
    
    // If an action was performed, notify the parent component
    if (actionPerformed && article && onArticleAction) {
      if (likePressed && !userLikedNews.includes(article.id)) {
        onArticleAction(article.id, 'like');
      } else if (dislikesPressed && !userDislikedNews.includes(article.id)) {
        onArticleAction(article.id, 'dislike');
      }
    }
    
    onClose(); // Call parent function to close the modal
  };

  const handleLike = async () => {
    if (!article || !userId || isLoading) return;
    
    const articleId = article.id;
    
    // First, check what state we're in based on the user's arrays
    const isAlreadyLiked = userLikedNews.includes(articleId);
    const isAlreadyDisliked = userDislikedNews.includes(articleId);
    
    try {
      let success = false;
      
      // If already liked, remove the like
      if (isAlreadyLiked) {
        success = await removeLikedNews(userId, articleId);
        
        if (success) {
          // Update UI state
          setLikesPressed(false);
          setActionPerformed(true);
          
          // Update local count
          setLikes(likes - 1);
          
          // Update local state arrays
          setUserLikedNews(prev => prev.filter(id => id !== articleId));
        }
      } 
      // If already disliked, remove dislike and add like
      else if (isAlreadyDisliked) {
        // First remove the dislike
        const removeDislikeSuccess = await removeDislikedNews(userId, articleId);
        
        if (removeDislikeSuccess) {
          // Then add the like
          success = await addLikedNews(userId, articleId);
          
          if (success) {
            // Update UI state
            setLikesPressed(true);
            setDislikesPressed(false);
            setActionPerformed(true);
            
            // Update local counts
            setLikes(likes + 1);
            setDislikes(dislikes - 1);
            
            // Update local state arrays
            setUserLikedNews(prev => [...prev, articleId]);
            setUserDislikedNews(prev => prev.filter(id => id !== articleId));
          }
        }
      } 
      // Normal case - not liked or disliked yet
      else {
        success = await addLikedNews(userId, articleId);
        
        if (success) {     
          // Update UI state
          setLikesPressed(true);
          setActionPerformed(true);
          
          // Update local count
          setLikes(likes + 1);
          
          // Update local state arrays
          setUserLikedNews(prev => [...prev, articleId]);
        }
      }
      
      // Mark article as watched if needed (in all cases)
      if (!userWatchedNews.includes(articleId)) {
        await markAsWatched(userId, articleId);
      }
    } catch (error) {
      console.error("Error handling article like:", error);
    }
  };
  
  const handleDislike = async () => {
    if (!article || !userId || isLoading) return;
    
    const articleId = article.id;
    
    // First, check what state we're in based on the user's arrays
    const isAlreadyLiked = userLikedNews.includes(articleId);
    const isAlreadyDisliked = userDislikedNews.includes(articleId);
    
    try {
      let success = false;
      
      // If already disliked, remove the dislike
      if (isAlreadyDisliked) {
        success = await removeDislikedNews(userId, articleId);
        
        if (success) {
          // Update UI state
          setDislikesPressed(false);
          setActionPerformed(true);
          
          // Update local count
          setDislikes(dislikes - 1);
          
          // Update local state arrays
          setUserDislikedNews(prev => prev.filter(id => id !== articleId));
        }
      } 
      // If already liked, remove like and add dislike
      else if (isAlreadyLiked) {
        // First remove the like
        const removeLikeSuccess = await removeLikedNews(userId, articleId);
        
        if (removeLikeSuccess) {
          // Then add the dislike
          success = await addDislikedNews(userId, articleId);
          
          if (success) {
            // Update UI state
            setLikesPressed(false);
            setDislikesPressed(true);
            setActionPerformed(true);
            
            // Update local counts
            setLikes(likes - 1);
            setDislikes(dislikes + 1);
            
            // Update local state arrays
            setUserDislikedNews(prev => [...prev, articleId]);
            setUserLikedNews(prev => prev.filter(id => id !== articleId));
          }
        }
      } 
      // Normal case - not liked or disliked yet
      else {
        success = await addDislikedNews(userId, articleId);
        
        if (success) {
          // Update UI state
          setDislikesPressed(true);
          setActionPerformed(true);
          
          // Update local count
          setDislikes(dislikes + 1);
          
          // Update local state arrays
          setUserDislikedNews(prev => [...prev, articleId]);
        }
      }
      
      // Mark article as watched if needed (in all cases)
      if (!userWatchedNews.includes(articleId)) {
        await markAsWatched(userId, articleId);
      }
    } catch (error) {
      console.error("Error handling article dislike:", error);
    }
  };

  // Calculate estimated read time based on content length
  const getReadTime = (text: string): number => {
    // Average reading speed: ~200 words per minute
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return Math.max(1, minutes); // Minimum 1 minute read time
  };

  if (!visible || !article) return null; // Hide modal when closed

  const readTimeMinutes = getReadTime(article.content_long);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header with title */}
            <View style={styles.headerContainer}>
              <Text style={styles.modalHeader}>{article.title}</Text>
              
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Article Metadata */}
            <View style={styles.metadataContainer}>
              {article.date && (
                <View style={styles.metadataItem}>
                  <Ionicons name="calendar-outline" size={16} color="#00bcd4" />
                  <Text style={styles.metadataText}>{article.date}</Text>
                </View>
              )}
              
              <View style={styles.metadataItem}>
                <Ionicons name="time-outline" size={16} color="#00bcd4" />
                <Text style={styles.metadataText}>{readTimeMinutes} min read</Text>
              </View>
              
              <View style={styles.metadataItem}>
                <Ionicons name="eye-outline" size={16} color="#00bcd4" />
                <Text style={styles.metadataText}>{totalViews} views</Text>
              </View>
            </View>

            {/* Tags if available */}
            {article.tags && article.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {article.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Scrollable Content */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.modalText}>{article.content_long}</Text>
            </ScrollView>
            {/* Like & Dislike Buttons */}
<View style={styles.actions}>
  <TouchableOpacity 
    style={[styles.button, likePressed && styles.likeButtonActive]} 
    onPress={handleLike}
    disabled={!userId || isLoading}
  >
    <Feather 
      name="thumbs-up" 
      size={24} 
      color={likePressed ? "#fff" : "#00bcd4"} 
    />
    <Text style={[
      styles.buttonText, 
      { color: likePressed ? "#fff" : "#00bcd4" }
    ]}>
      {likes}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity 
    style={[styles.button, dislikesPressed && styles.dislikeButtonActive]} 
    onPress={handleDislike}
    disabled={!userId || isLoading}
  >
    <Feather 
      name="thumbs-down" 
      size={24} 
      color={dislikesPressed ? "#fff" : "#f44336"} 
    />
    <Text style={[
      styles.buttonText, 
      { color: dislikesPressed ? "#fff" : "#f44336" }
    ]}>
      {dislikes}
    </Text>
  </TouchableOpacity>
</View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "92%",
    height: "85%",
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  headerContainer: {
    backgroundColor: "#00bcd4",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    paddingRight: 30,
  },
  metadataContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  metadataText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  watchedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 'auto',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  watchedText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 3,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
  },
  tag: {
    backgroundColor: "rgba(0, 188, 212, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 188, 212, 0.3)",
  },
  tagText: {
    fontSize: 12,
    color: "#00838f",
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    textAlign: "justify",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f9f9f9",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  likeButtonActive: {
    backgroundColor: "#00bcd4",
    borderColor: "#00bcd4",
  },
  dislikeButtonActive: {
    backgroundColor: "#f44336",
    borderColor: "#f44336",
  },
});