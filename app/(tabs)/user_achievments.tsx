import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getUserAchievements } from '@/class/User';

export default function UserAchievements() {
  const auth = getAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Toggle for using mock data for UI testing
  const useMockData = true;

  // Define mock achievements
  const mockAchievements = [
    { id: '1', icon: 'trophy', title: 'First Win', description: 'Won your first game.' },
    { id: '2', icon: 'star', title: 'All-Star', description: 'Scored in every game.' },
    { id: '3', icon: 'rocket', title: 'Rocket Start', description: 'Started your journey with a bang.' },
  ];

  useEffect(() => {
    if (useMockData) {
      // Simulate a delay for UI preview
      setTimeout(() => {
        setAchievements(mockAchievements);
        setLoading(false);
      }, 1000);
    } else {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log("User already logged in:", user.uid);
          try {
            const userAch = await getUserAchievements(user.uid);
            setAchievements(userAch);
          } catch (error) {
            console.error("Error fetching achievements:", error);
          }
        } else {
          console.log("User not logged in");
          // Optionally, you can load mock data here if needed.
        }
        setLoading(false);
      });

      return () => unsubscribe(); // Cleanup on unmount
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="gray" />
        <Text style={styles.loadingText}>Loading Achievements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Achievements</Text>
      {achievements.length === 0 ? (
        <Text style={styles.noAchievements}>No achievements yet</Text>
      ) : (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  noAchievements: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});