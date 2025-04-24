import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList, 
  TouchableOpacity, 
  Platform,
  ScrollView 
} from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getUserAchievements } from '@/class/User';
import { getAllAchievements, checkAllAchievements, checkAchievementRequirements } from '@/class/Achievments';

export default function UserAchievements() {
  const auth = getAuth();
  const [userAchievements, setUserAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);
  const [displayAchievements, setDisplayAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingAchievements, setCheckingAchievements] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Toggle for using mock data for UI testing
  const useMockData = false;

  // Define mock achievements
  const mockUserAchievements = ["1", "3"];
  const mockAllAchievements = [
    { id: '1', name: 'First Win', photo: 'trophy', requirements: ['Win your first game'], expPoints: 50 },
    { id: '2', name: 'All-Star', photo: 'star', requirements: ['Score in every game'], expPoints: 100 },
    { id: '3', name: 'Rocket Start', photo: 'rocket', requirements: ['Started your journey with a bang'], expPoints: 25 },
    { id: '4', name: 'News Expert', photo: 'newspaper-o', requirements: ['Read 50 news articles'], expPoints: 150 },
    { id: '5', name: 'Social Butterfly', photo: 'users', requirements: ['Connect with 10 friends'], expPoints: 75 },
  ];

  // Function to load user achievements and check for new ones
  const loadAchievements = async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      // First check if user qualifies for any new achievements
      setCheckingAchievements(true);
      const newAchievementsCount = await checkAllAchievements(userId);
      setCheckingAchievements(false);
      
      // Now get the updated lists
      const userAch = await getUserAchievements(userId);
      setUserAchievements(userAch || []);
      
      const achievements = await getAllAchievements();
      setAllAchievements(achievements);
      
      // If new achievements were unlocked, show a message
      if (newAchievementsCount > 0) {
        // You could add a toast notification or some UI feedback here
        console.log(`${newAchievementsCount} new achievements unlocked!`);
      }
    } catch (error) {
      console.error("Error loading achievements:", error);
      setError("Failed to load achievements. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Check requirements for achievements to show progress
  const checkRequirements = async (userId, achievements) => {
    const updatedAchievements = [];
    
    for (const achievement of achievements) {
      if (!achievement) {
        console.warn("Encountered undefined achievement");
        continue;
      }
      
      if (userAchievements.includes(achievement.id)) {
        // Already unlocked
        updatedAchievements.push({
          ...achievement,
          isUnlocked: true,
          progress: 100,
          icon: achievement.photo || 'certificate',
          progressMessage: "Completed!",
          // Ensure consistent naming for XP display
          expPoints: typeof achievement.expPoints === 'number' ? achievement.expPoints : 0
        });
      } else {
        try {
          // Check requirements
          const result = await checkAchievementRequirements(userId, achievement.id);
          
          // Calculate progress if applicable
          let progress = 0;
          let progressMessage = "Not started";
          
          if (result && result.message) {
            if (achievement.requiredStreak) {
              // Find the streak requirement in the result message
              const match = result.message.match(/Current: (\d+), Required: (\d+)/);
              if (match) {
                const current = parseInt(match[1]);
                const required = parseInt(match[2]);
                progress = Math.min(Math.floor((current / required) * 100), 99); // Cap at 99% if not complete
                progressMessage = `${current}/${required} days`;
              }
            } else if (achievement.requiredLikes) {
              const match = result.message.match(/Current: (\d+), Required: (\d+)/);
              if (match) {
                const current = parseInt(match[1]);
                const required = parseInt(match[2]);
                progress = Math.min(Math.floor((current / required) * 100), 99);
                progressMessage = `${current}/${required} likes`;
              }
            } else if (achievement.requiredDislikes) {
              const match = result.message.match(/Current: (\d+), Required: (\d+)/);
              if (match) {
                const current = parseInt(match[1]);
                const required = parseInt(match[2]);
                progress = Math.min(Math.floor((current / required) * 100), 99);
                progressMessage = `${current}/${required} dislikes`;
              }
            }
          }
        
        } catch (error) {
          console.error(`Error checking requirements for achievement ${achievement.id}:`, error);
          progress = 0;
          progressMessage = "Error checking progress";
        }
        
        updatedAchievements.push({
          ...achievement,
          isUnlocked: false,
          progress,
          icon: achievement.photo || 'certificate',
          progressMessage,
          // Ensure consistent naming for XP display
          expPoints: typeof achievement.expPoints === 'number' ? achievement.expPoints : 0
        });
      }
    }
    
    return updatedAchievements;
  };

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    const user = auth.currentUser;
    if (user) {
      loadAchievements(user.uid);
    } else {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (useMockData) {
      // Simulate a delay for UI preview
      setTimeout(() => {
        setUserAchievements(mockUserAchievements);
        setAllAchievements(mockAllAchievements);
        setLoading(false);
      }, 1000);
    } else {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log("User logged in, fetching achievements:", user.uid);
          await loadAchievements(user.uid);
        } else {
          console.log("User not logged in");
          setError("Please log in to view your achievements");
          setLoading(false);
        }
      });

      return () => unsubscribe(); // Cleanup on unmount
    }
  }, []);

  // Process achievements to show unlocked and locked ones with progress
  useEffect(() => {
    if (allAchievements.length > 0 && auth.currentUser) {
      const processAchievements = async () => {
        try {
          const updatedAchievements = await checkRequirements(auth.currentUser.uid, allAchievements);
          setDisplayAchievements(updatedAchievements);
        } catch (error) {
          console.error("Error processing achievements:", error);
          // Fallback in case of error - display basic achievement data
          const basicAchievements = allAchievements.map(achievement => ({
            ...achievement,
            isUnlocked: userAchievements.includes(achievement.id),
            progress: userAchievements.includes(achievement.id) ? 100 : 0,
            icon: achievement.photo || 'certificate',
            progressMessage: userAchievements.includes(achievement.id) ? "Completed!" : "In progress"
          }));
          setDisplayAchievements(basicAchievements);
        }
      };
      
      processAchievements();
    }
  }, [userAchievements, allAchievements]);

  if (loading) {
    return (
      <LinearGradient
        colors={['#4dc9ff', '#00bfa5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>
            {checkingAchievements ? 'Checking for new achievements...' : 'Loading Achievements...'}
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
        style={styles.container}
      >
        <View style={styles.errorContainer}>
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
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Achievements</Text>
      </View>
      
      {/* Achievement Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {userAchievements.length}
            <Text style={styles.statTotal}>/{allAchievements.length}</Text>
          </Text>
          <Text style={styles.statLabel}>Unlocked</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {allAchievements.reduce((sum, achievement) => {
              // Make sure we're accessing the correct field (expPoints) and it's a number
              if (userAchievements.includes(achievement.id)) {
                const points = typeof achievement.expPoints === 'number' ? achievement.expPoints : 0;
                return sum + points;
              }
              return sum;
            }, 0)}
          </Text>
          <Text style={styles.statLabel}>XP Earned</Text>
        </View>
      </View>
      
      {/* Manual refresh button */}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={() => auth.currentUser && loadAchievements(auth.currentUser.uid)}
        disabled={refreshing}
      >
        <Ionicons name="refresh" size={16} color="#ffffff" />
        <Text style={styles.refreshText}>
          {refreshing ? 'Checking...' : 'Check for New Achievements'}
        </Text>
      </TouchableOpacity>
      
      {displayAchievements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color="#ffffff" />
          <Text style={styles.emptyText}>No achievements available</Text>
          <Text style={styles.emptySubtext}>Check back later for challenges</Text>
        </View>
      ) : (
        <FlatList
          data={displayAchievements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.achievementCard}
              activeOpacity={0.9}
            >
              {/* Card Top Accent */}
              <View style={[
                styles.cardAccent, 
                {backgroundColor: item.isUnlocked ? '#00bcd4' : '#757575'}
              ]} />
              
              <View style={styles.achievementContent}>
                <View style={[
                  styles.iconContainer,
                  {backgroundColor: item.isUnlocked ? 'rgba(0, 188, 212, 0.1)' : 'rgba(117, 117, 117, 0.1)'}
                ]}>
                  <FontAwesome 
                    name={item.icon} 
                    size={28} 
                    color={item.isUnlocked ? 'gold' : '#9e9e9e'} 
                  />
                </View>
                
                <View style={styles.achievementDetails}>
                  <View style={styles.achievementHeader}>
                    <Text style={[
                      styles.achievementTitle,
                      {color: item.isUnlocked ? '#00bcd4' : '#757575'}
                    ]}>
                      {item.name}
                    </Text>
                    
                    {item.isUnlocked && (
                      <View style={styles.expBadge}>
                        <Text style={styles.expText}>+{item.expPoints} XP</Text>
                      </View>
                    )}
                  </View>
                  
                  {item.isUnlocked ? (
                    <Text style={styles.achievementDesc}>
                      {item.requirements && item.requirements.length > 0 
                        ? item.requirements[0] 
                        : item.name}
                    </Text>
                  ) : (
                    <View>
                      <View style={styles.lockedContainer}>
                        <Ionicons name="lock-closed" size={12} color="#757575" />
                        <Text style={styles.lockedText}>
                          {item.requirements && item.requirements.length > 0 
                            ? item.requirements[0] 
                            : item.name} ({item.progressMessage})
                        </Text>
                      </View>
                      
                      {/* Progress bar */}
                      <View style={styles.progressBarContainer}>
                        <View 
                          style={[
                            styles.progressBar, 
                            {width: `${item.progress}%`}
                          ]} 
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  refreshText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  statsContainer: {
    flexDirection: 'row',
    margin: 20,
    marginBottom: 10,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00bcd4',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  statTotal: {
    fontSize: 16,
    color: '#757575',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 15,
    alignSelf: 'center',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  achievementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
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
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  expBadge: {
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.3)',
  },
  expText: {
    fontSize: 12,
    color: '#00838f',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  achievementDesc: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
    fontStyle: 'italic',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00bcd4',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
});