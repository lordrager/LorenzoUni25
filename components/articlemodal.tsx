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
import { updateNewsByTitle } from "../class/News";
import { addWatchedNews, addLikedNews, addDislikedNews } from "@/class/User";
import { 
  createArticleLikedNotification, 
  createArticleDislikedNotification 
} from "@/class/Notification";

interface ArticleModalProps {
  visible: boolean;
  article: { 
    id: string;
    title: string; 
    content_long: string; 
    likes: number; 
    dislikes: number;
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
  const [likePressed, setLikesPressed] = useState(false);
  const [dislikesPressed, setDislikesPressed] = useState(false);
  const [actionPerformed, setActionPerformed] = useState(false);
  const [isMarkedAsWatched, setIsMarkedAsWatched] = useState(false);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (visible && article) {
      setLikes(article.likes);
      setDislikes(article.dislikes);
      setLikesPressed(false);
      setDislikesPressed(false);
      setActionPerformed(false);
      setIsMarkedAsWatched(false);
      
      // Mark article as watched when opened
      if (userId && article.id) {
        markAsWatched(userId, article.id);
      }
    }
  }, [visible, article, userId]);

  const markAsWatched = async (userId: string, articleId: string) => {
    if (isMarkedAsWatched) return;
    
    try {
      console.log("Marking article as watched:", articleId);
      const success = await addWatchedNews(userId, articleId);
      
      if (success) {
        console.log("Successfully marked article as watched");
        setIsMarkedAsWatched(true);
        
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
    setLikesPressed(false);
    setDislikesPressed(false);
    
    console.log("Closing modal, action performed:", actionPerformed);
    
    // If an action was performed, notify the parent component
    if (actionPerformed && article && onArticleAction) {
      if (likePressed) {
        onArticleAction(article.id, 'like');
      } else if (dislikesPressed) {
        onArticleAction(article.id, 'dislike');
      }
    }
    
    onClose(); // Call parent function to close the modal
  };

  const handleLike = async () => {
    if (!article || !userId) return;
    let updatedFields: any = {};

    if (!likePressed && !dislikesPressed) {
      updatedFields = { likes: likes + 1 };
    } else if (likePressed && !dislikesPressed) {
      updatedFields = { likes: likes - 1 };
    } else if (!likePressed && dislikesPressed) {
      updatedFields = { likes: likes + 1, dislikes: dislikes - 1 };
    }

    const success = await updateNewsByTitle(article.title, updatedFields);
    if (success) {
      setLikes(updatedFields.likes || likes);
      setDislikes(updatedFields.dislikes || dislikes);
      setLikesPressed(!likePressed);
      setDislikesPressed(false);
      setActionPerformed(true);
      
      // Mark article as watched
      if (!isMarkedAsWatched) {
        await markAsWatched(userId, article.id);
      }
      
      // Add to user's liked news
      if (!likePressed) {
        await addLikedNews(userId, article.id);
        
        // Create a notification about liking the article using the notification functions
        await createArticleLikedNotification(
          article.id,
          article.title,
          userId
        );
      }
    }
  };

  const handleDislike = async () => {
    if (!article || !userId) return;
    let updatedFields: any = {};

    if (!likePressed && !dislikesPressed) {
      updatedFields = { dislikes: dislikes + 1 };
    } else if (!likePressed && dislikesPressed) {
      updatedFields = { dislikes: dislikes - 1 };
    } else if (likePressed && !dislikesPressed) {
      updatedFields = { dislikes: dislikes + 1, likes: likes - 1 };
    }

    const success = await updateNewsByTitle(article.title, updatedFields);
    if (success) {
      setLikes(updatedFields.likes || likes);
      setDislikes(updatedFields.dislikes || dislikes);
      setDislikesPressed(!dislikesPressed);
      setLikesPressed(false);
      setActionPerformed(true);
      
      // Mark article as watched
      if (!isMarkedAsWatched) {
        await markAsWatched(userId, article.id);
      }
      
      // Add to user's disliked news
      if (!dislikesPressed) {
        await addDislikedNews(userId, article.id);
        
        // Create a notification about disliking the article using the notification functions
        await createArticleDislikedNotification(
          article.id,
          article.title,
          userId
        );
      }
    }
  };

  // Calculate estimated read time based on content length (rough estimate)
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
                <Text style={styles.metadataText}>{likes + dislikes} views</Text>
              </View>
              
              {isMarkedAsWatched && (
                <View style={styles.watchedIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.watchedText}>Read</Text>
                </View>
              )}
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
                disabled={!userId}
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
                disabled={!userId}
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