import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from "firebase/auth";

const achievements = [
  { id: '1', title: 'First Like', description: 'Liked your first article', icon: 'thumbs-up' },
  { id: '2', title: 'News Explorer', description: 'Read 10 articles', icon: 'book' },
  { id: '3', title: 'Trendsetter', description: 'Posted a trending comment', icon: 'fire' },
];

export default function UserAchievements() {

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User already logged in:", user.uid);
      } else {
        console.log("User not logged in");
        router.replace("/"); // Redirect if not logged in
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Achievements</Text>
      <FlatList
        data={achievements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.achievement}>
            <FontAwesome name={item.icon} size={24} color="gold" style={styles.icon} />
            <View>
              <Text style={styles.achievementTitle}>{item.title}</Text>
              <Text style={styles.achievementDesc}>{item.description}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  icon: {
    marginRight: 10,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  achievementDesc: {
    fontSize: 14,
    color: '#666',
  },
});