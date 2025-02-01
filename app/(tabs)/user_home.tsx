import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import ArticleModal from "../../components/articlemodal";
import { router } from "expo-router";
import { getAllNews, getRecentNewsByTags, addMockNewsData } from "../../class/News";

export default function UserHomeScreen() {
  const [newsArticles, setNewsArticles] = useState([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentArticle = newsArticles[currentArticleIndex];

  useEffect(() => {
    const initializeApp = async () => {
      try {
        //addMockNewsData();
        const storedEmail = window.localStorage.getItem("emailForSignIn");
        const storedPassword = window.localStorage.getItem("passwordForSignIn");
        if (!storedEmail || !storedPassword) {
          router.replace("/");
          return;
        }
        const newsSnapshot= getRecentNewsByTags(["sports"]).then(snapshot => {
          setNewsArticles(snapshot);
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleNextArticle = () => {
    setCurrentArticleIndex(prev => (prev + 1) % newsArticles.length);
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
            onPress={handleNextArticle}
          >
            <Text style={styles.buttonText}>Dislike</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.likeButton]}
            onPress={handleNextArticle}
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
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  newsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
    textAlign: 'center',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 25,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  likeButton: {
    backgroundColor: '#007bff',
  },
  dislikeButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
  },
  noArticlesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});