import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { updateNewsByTitle } from "../class/News";

interface ArticleModalProps {
  visible: boolean;
  article: { title: string; content_long: string; likes: number; dislikes: number } | null;
  onClose: () => void;
}

export default function ArticleModal({ visible, article, onClose }: ArticleModalProps) {
  const [likes, setLikes] = useState(article?.likes || 0);
  const [dislikes, setDislikes] = useState(article?.dislikes || 0);
  const [likePressed, setLikesPressed] = useState(false);
  const [dislikesPressed, setDislikesPressed] = useState(false);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (visible && article) {
      setLikes(article.likes);
      setDislikes(article.dislikes);
      setLikesPressed(false);
      setDislikesPressed(false);
    }
  }, [visible, article]);

  const handleClose = () => {
    setLikesPressed(false);
    setDislikesPressed(false);
    console.log("Closing modal");
    onClose(); // Call parent function to close the modal
  };

  const handleLike = async () => {
    if (!article) return;
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
    }
  };

  const handleDislike = async () => {
    if (!article) return;
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
    }
  };

  if (!visible || !article) return null; // Hide modal when closed

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>

          {/* Scrollable Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.modalHeader}>{article.title}</Text>
            <Text style={styles.modalText}>{article.content_long}</Text>
          </ScrollView>

          {/* Like & Dislike Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, likePressed && styles.likeButton]} 
              onPress={handleLike}
            >
              <Feather name="thumbs-up" size={24} color="white" />
              <Text style={styles.buttonText}>{likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, dislikesPressed && styles.dislikeButton]} 
              onPress={handleDislike}
            >
              <Feather name="thumbs-down" size={24} color="white" />
              <Text style={styles.buttonText}>{dislikes}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FF3B30",
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingTop: 30,
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
    textAlign: "justify",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: "#ddd",
    marginTop: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: 10,
    backgroundColor: "gray",
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  likeButton: {
    backgroundColor: "blue",
  },
  dislikeButton: {
    backgroundColor: "red",
  },
});