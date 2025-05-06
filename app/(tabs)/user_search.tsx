import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator, 
  FlatList, 
  Platform,
  ScrollView
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getAllNews } from "../../class/News";
import { Feather, Ionicons } from "@expo/vector-icons";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { BootstrapStyles } from "@/app/styles/bootstrap";
import { useTheme } from '../ThemeContext';
import ArticleModal from "@/components/articlemodal";
import { getUser } from "@/class/User";
import { addWatchedNews } from "../../class/News";

export default function UserSearchScreen() {
  const [searchText, setSearchText] = useState("");
  const [newsData, setNewsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("Relevance");
  const [regionSearch, setRegionSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [dateSearch, setDateSearch] = useState("");
  const [minLikes, setMinLikes] = useState("");
  const [minViews, setMinViews] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Article modal states
  const [articleModalVisible, setArticleModalVisible] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loggedUser, setLoggedUser] = useState(null);
  const [watchedArticles, setWatchedArticles] = useState(new Set());

  const auth = getAuth();
  
  // Get theme context
  const { darkMode } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User already logged in:", user.uid);
        try {
          const userData = await getUser(user.uid);
          if (userData) {
            setLoggedUser({...userData, id: user.uid});
            
            // Keep track of already watched articles
            if (userData.watched_news) {
              setWatchedArticles(new Set(userData.watched_news));
            }
          }
          await fetchNews();
        } catch (err) {
          console.error("Error loading user data:", err);
          setError("Failed to load user data");
          setLoading(false);
        }
      } else {
        console.log("User not logged in");
        router.replace("/"); // Redirect if not logged in
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  useEffect(() => {
    filterData(searchText, selectedFilter, regionSearch, countrySearch, citySearch, dateSearch, minLikes, minViews);
  }, [searchText, selectedFilter, regionSearch, countrySearch, citySearch, dateSearch, minLikes, minViews, newsData]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const newsSnapshot = await getAllNews();
      const articles = newsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNewsData(articles);
      setFilteredData(articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterData = (text, filter, region, country, city, date, likes, views) => {
    if (!newsData.length) return;
    
    let filtered = [...newsData];

    // Apply search filter
    if (text) {
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(text.toLowerCase())
      );
    }

    // Apply region filter
    if (region) {
      filtered = filtered.filter((item) =>
        item.region?.toLowerCase().includes(region.toLowerCase())
      );
    }

    // Apply country filter
    if (country) {
      filtered = filtered.filter((item) =>
        item.country?.toLowerCase().includes(country.toLowerCase())
      );
    }

    // Apply city filter
    if (city) {
      filtered = filtered.filter((item) =>
        item.city?.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Apply date filter
    if (date) {
      const searchDate = new Date(date).getTime() / 1000;
      filtered = filtered.filter((item) => item.date?.seconds >= searchDate);
    }

    // Apply likes filter
    if (likes) {
      filtered = filtered.filter((item) => (item.likes || 0) >= parseInt(likes));
    }

    // Apply views filter
    if (views) {
      filtered = filtered.filter((item) => (item.total_views || 0) >= parseInt(views));
    }

    // Apply sorting logic
    if (filter === "Newest") {
      filtered.sort((a, b) => {
        const dateA = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(0);
        const dateB = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(0);
        return dateB - dateA;
      });
    } else if (filter === "Relevance") {
      filtered.sort((a, b) => {
        const scoreA = (a.likes || 0) / (a.total_views || 1);
        const scoreB = (b.likes || 0) / (b.total_views || 1);
        return scoreB - scoreA;
      });
    }

    setFilteredData(filtered);
  };

  const handleSubmitFilter = () => {
    setIsModalVisible(false);
  };

  const handleClearFilters = () => {
    setSelectedFilter("Relevance");
    setRegionSearch("");
    setCountrySearch("");
    setCitySearch("");
    setDateSearch("");
    setMinLikes("");
    setMinViews("");
    setIsModalVisible(false);
  };

  // Article interaction functions
  const handleArticlePress = (article) => {
    setSelectedArticle(article);
    setArticleModalVisible(true);
  };

  // Mark article as watched
  const markArticleAsWatched = async (articleId) => {
    if (!loggedUser || !articleId || watchedArticles.has(articleId)) {
      return;
    }
    
    try {
      await addWatchedNews(loggedUser.id, articleId);
      
      // Update local state
      setWatchedArticles(prev => {
        const newSet = new Set(prev);
        newSet.add(articleId);
        return newSet;
      });
    } catch (error) {
      console.error("Error marking article as watched:", error);
    }
  };

  // Handle modal article actions
  const handleArticleAction = async (articleId, action) => {
    if (action === 'watched') {
      setWatchedArticles(prev => {
        const newSet = new Set(prev);
        newSet.add(articleId);
        return newSet;
      });
    }
    
    // Refresh user data after action
    const userData = await getUser(loggedUser.id);
    if (userData) {
      setLoggedUser({...userData, id: loggedUser.id});
    }
  };

  // Close modal handler
  const handleCloseModal = () => {
    setArticleModalVisible(false);
    setSelectedArticle(null);
  };

  // Theme-specific styles
  const dynamicStyles = {
    searchInputContainer: {
      backgroundColor: darkMode ? '#2d2d2d' : '#fff',
    },
    searchInput: {
      color: darkMode ? '#ffffff' : '#333',
    },
    card: {
      backgroundColor: darkMode ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    },
    cardTitle: {
      color: '#00bcd4',
    },
    cardText: {
      color: darkMode ? '#e0e0e0' : '#333',
    },
    metadataText: {
      color: darkMode ? '#bdbdbd' : '#666',
    },
    tagsContainer: {
      backgroundColor: darkMode ? '#2d2d2d' : '#f8f8f8',
      borderTopColor: darkMode ? '#444444' : '#eee',
    },
    // Modal styles
    modalBackground: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContainer: {
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
    },
    modalHeader: {
      borderBottomColor: darkMode ? '#444444' : '#eee',
    },
    sectionTitle: {
      color: darkMode ? '#e0e0e0' : '#333',
    },
    sortOption: {
      borderColor: darkMode ? '#444444' : '#ddd',
    },
    sortOptionText: {
      color: darkMode ? '#e0e0e0' : '#555',
    },
    inputContainer: {
      borderColor: darkMode ? '#444444' : '#ddd',
      backgroundColor: darkMode ? '#2d2d2d' : '#fff',
    },
    modalInput: {
      color: darkMode ? '#ffffff' : '#333',
    },
    modalButtonContainer: {
      borderTopColor: darkMode ? '#444444' : '#eee',
    },
    clearButton: {
      borderColor: darkMode ? '#444444' : '#ddd',
    },
    clearButtonText: {
      color: darkMode ? '#e0e0e0' : '#777',
    },
  };

  const renderItem = ({ item }) => {
    const formattedDate = item.date?.seconds
      ? new Date(item.date.seconds * 1000).toLocaleDateString()
      : "Unknown Date";
      
    const isLiked = loggedUser?.liked_news?.includes(item.id);
    const isDisliked = loggedUser?.disliked_news?.includes(item.id);
    const isWatched = watchedArticles.has(item.id);

    return (
      <TouchableOpacity 
        style={[styles.card, dynamicStyles.card]}
        activeOpacity={0.92}
        onPress={() => handleArticlePress(item)}
      >
        {/* Card Top Accent */}
        <View style={styles.cardAccent} />
        
        {/* Article Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>
            {item.title}
          </Text>
          
          {/* Metadata */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={14} color="#00bcd4" />
              <Text style={[styles.metadataText, dynamicStyles.metadataText]}>
                {formattedDate}
              </Text>
            </View>
            
            {item.country && (
              <View style={styles.metadataItem}>
                <Ionicons name="location-outline" size={14} color="#00bcd4" />
                <Text style={[styles.metadataText, dynamicStyles.metadataText]}>
                  {item.city ? `${item.city}, ` : ''}
                  {item.country}
                </Text>
              </View>
            )}
            
            {(item.likes !== undefined || item.total_views !== undefined) && (
              <View style={styles.metadataItem}>
                <Ionicons name="stats-chart-outline" size={14} color="#00bcd4" />
                <Text style={[styles.metadataText, dynamicStyles.metadataText]}>
                  {item.likes !== undefined ? `${item.likes} likes` : ''}
                  {item.likes !== undefined && item.total_views !== undefined ? ' · ' : ''}
                  {item.total_views !== undefined ? `${item.total_views} views` : ''}
                </Text>
              </View>
            )}
            
            {/* Status indicators */}
            <View style={styles.statusContainer}>
              {isWatched && (
                <View style={styles.statusBadge}>
                  <Ionicons name="eye" size={12} color="#4CAF50" />
                </View>
              )}
              {isLiked && (
                <View style={styles.statusBadge}>
                  <Ionicons name="thumbs-up" size={12} color="#00bcd4" />
                </View>
              )}
              {isDisliked && (
                <View style={styles.statusBadge}>
                  <Ionicons name="thumbs-down" size={12} color="#f44336" />
                </View>
              )}
            </View>
          </View>
          
          {/* Content Preview */}
          <Text style={[styles.cardContent, dynamicStyles.cardText]} numberOfLines={4}>
            {item.content_short || "No content available"}
          </Text>
        </View>
        
        {/* Tags if available */}
        {item.tags && item.tags.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={[styles.tagsContainer, dynamicStyles.tagsContainer]}
            contentContainerStyle={styles.tagsContent}
          >
            {item.tags.map((tag, idx) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={darkMode ? ['#00838f', '#00796b'] : ['#4dc9ff', '#00bfa5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>News Search</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, dynamicStyles.searchInputContainer]}>
          <Feather name="search" size={20} color={darkMode ? "#aaa" : "#777"} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, dynamicStyles.searchInput]}
            placeholder="Search for articles..."
            placeholderTextColor={darkMode ? "#aaa" : "#999"}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setIsModalVisible(true)}
        >
          <Feather name="sliders" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#ffffff" />
          <Text style={styles.emptyText}>No matching articles found</Text>
          <Text style={styles.emptySubtext}>Try different search terms or filters</Text>
        </View>
      ) : (
        <FlatList 
          data={filteredData} 
          renderItem={renderItem} 
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalBackground, dynamicStyles.modalBackground]}>
          <View style={[styles.modalContainer, dynamicStyles.modalContainer]}>
            <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
              <Text style={styles.modalHeaderText}>Filter Articles</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {/* Sort Options */}
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Sort By</Text>
              <View style={styles.sortOptionsContainer}>
                {["Relevance", "Newest"].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.sortOption,
                      dynamicStyles.sortOption,
                      selectedFilter === filter && styles.selectedSortOption,
                    ]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      dynamicStyles.sortOptionText,
                      selectedFilter === filter && styles.selectedSortOptionText
                    ]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Location Filters */}
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Location</Text>
              
              <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
                <Ionicons name="globe-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={[styles.modalInput, dynamicStyles.modalInput]}
                  placeholder="Region..."
                  placeholderTextColor={darkMode ? "#aaa" : "#999"}
                  value={regionSearch}
                  onChangeText={setRegionSearch}
                />
              </View>
              
              <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
                <Ionicons name="flag-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={[styles.modalInput, dynamicStyles.modalInput]}
                  placeholder="Country..."
                  placeholderTextColor={darkMode ? "#aaa" : "#999"}
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                />
              </View>
              
              <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
                <Ionicons name="location-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={[styles.modalInput, dynamicStyles.modalInput]}
                  placeholder="City..."
                  placeholderTextColor={darkMode ? "#aaa" : "#999"}
                  value={citySearch}
                  onChangeText={setCitySearch}
                />
              </View>
              
              {/* Date Filter */}
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Date</Text>
              <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
                <Ionicons name="calendar-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={[styles.modalInput, dynamicStyles.modalInput]}
                  placeholder="Date (YYYY-MM-DD)..."
                  placeholderTextColor={darkMode ? "#aaa" : "#999"}
                  value={dateSearch}
                  onChangeText={setDateSearch}
                />
              </View>
              
              {/* Engagement Filters */}
              <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Engagement</Text>
              <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
                <Ionicons name="heart-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={[styles.modalInput, dynamicStyles.modalInput]}
                  placeholder="Minimum likes..."
                  placeholderTextColor={darkMode ? "#aaa" : "#999"}
                  keyboardType="numeric"
                  value={minLikes}
                  onChangeText={setMinLikes}
                />
              </View>
              
              <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
                <Ionicons name="eye-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={[styles.modalInput, dynamicStyles.modalInput]}
                  placeholder="Minimum views..."
                  placeholderTextColor={darkMode ? "#aaa" : "#999"}
                  keyboardType="numeric"
                  value={minViews}
                  onChangeText={setMinViews}
                />
              </View>
            </ScrollView>
            
            {/* Button Container */}
            <View style={[styles.modalButtonContainer, dynamicStyles.modalButtonContainer]}>
              <TouchableOpacity 
                style={[styles.clearButton, dynamicStyles.clearButton]} 
                onPress={handleClearFilters}
              >
                <Text style={[styles.clearButtonText, dynamicStyles.clearButtonText]}>Clear All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={handleSubmitFilter}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal
          visible={articleModalVisible}
          article={selectedArticle}
          userId={loggedUser?.id}
          onClose={handleCloseModal}
          onArticleAction={handleArticleAction}
          isDarkMode={darkMode}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  filterButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#00bcd4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
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
    backgroundColor: '#00bcd4',
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    alignItems: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  statusBadge: {
    marginLeft: 6,
  },
  metadataText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  tagsContainer: {
    maxHeight: 38,
    borderTopWidth: 1,
  },
  tagsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
  },
  tagChip: {
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.3)',
  },
  tagText: {
    fontSize: 11,
    color: '#00838f',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#fff',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
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
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '80%',
    borderRadius: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    backgroundColor: '#00bcd4',
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  modalCloseButton: {
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  sortOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 8,
  },
  selectedSortOption: {
    backgroundColor: '#00bcd4',
    borderColor: '#00bcd4',
  },
  sortOptionText: {
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  selectedSortOptionText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 45,
  },
  inputIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    height: '100%',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 15,
  },
  clearButton: {
    flex: 1,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 25,
    marginRight: 10,
  },
  clearButtonText: {
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  applyButton: {
    flex: 1,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00bcd4',
    borderRadius: 25,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
});