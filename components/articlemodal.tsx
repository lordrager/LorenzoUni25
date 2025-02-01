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
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../app/firebaseConfig";

interface ArticleModalProps {
  visible: boolean;
  article: { id: string; title: string; content_long: string; likes: number; dislikes: number };
  onClose: () => void;
}

export default function ArticleModal({ visible, article, onClose }: ArticleModalProps) {
  const [likes, setLikes] = useState(article.likes);
  const [dislikes, setDislikes] = useState(article.dislikes);

  useEffect(() => {
    
  }, []);

  const handleLike = async () => {
    const newsRef = doc(db, "news", article.id);
    try {
      await updateDoc(newsRef, { likes: likes + 1 });
      setLikes(likes + 1);
    } catch (error) {
      console.error("Error liking article:", error);
    }
  };

  const handleDislike = async () => {
    const newsRef = doc(db, "news", article.id);
    console.log("Disliking article with ID:", article.id);  
    try {
      await updateDoc(newsRef, { dislikes: dislikes + 1 });
      setDislikes(dislikes + 1);
    } catch (error) {
      console.error("Error disliking article:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>

          {/* Scrollable Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.modalHeader}>{article.title}</Text>
            <Text style={styles.modalText}>{article.content_long}</Text>
          </ScrollView>

          {/* Like & Dislike Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={handleLike}>
              <Feather name="thumbs-up" size={24} color="green" />
              <Text style={styles.buttonText}>{likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleDislike}>
              <Feather name="thumbs-down" size={24} color="red" />
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
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});