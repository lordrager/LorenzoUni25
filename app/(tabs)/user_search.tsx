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

    fetchNews();
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
      filtered = filtered.filter((item) => item.date?.seconds >= new Date(date).getTime());
    }

    // Apply likes filter
    if (likes) {
      filtered = filtered.filter((item) => item.likes >= likes);
    }

    // Apply views filter
    if (views) {
      filtered = filtered.filter((item) => item.total_views >= views);
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

  const renderItem = ({ item }) => {
    const formattedDate = item.date?.seconds
      ? new Date(item.date.seconds * 1000).toLocaleDateString()
      : "Unknown Date";

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.92}
      >
        {/* Card Top Accent */}
        <View style={styles.cardAccent} />
        
        {/* Article Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          
          {/* Metadata */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={14} color="#00bcd4" />
              <Text style={styles.metadataText}>{formattedDate}</Text>
            </View>
            
            {item.country && (
              <View style={styles.metadataItem}>
                <Ionicons name="location-outline" size={14} color="#00bcd4" />
                <Text style={styles.metadataText}>
                  {item.city ? `${item.city}, ` : ''}
                  {item.country}
                </Text>
              </View>
            )}
            
            {(item.likes !== undefined || item.total_views !== undefined) && (
              <View style={styles.metadataItem}>
                <Ionicons name="stats-chart-outline" size={14} color="#00bcd4" />
                <Text style={styles.metadataText}>
                  {item.likes !== undefined ? `${item.likes} likes` : ''}
                  {item.likes !== undefined && item.total_views !== undefined ? ' · ' : ''}
                  {item.total_views !== undefined ? `${item.total_views} views` : ''}
                </Text>
              </View>
            )}
          </View>
          
          {/* Content Preview */}
          <Text style={styles.cardContent}>
            {item.content_short || "No content available"}
          </Text>
        </View>
        
        {/* Tags if available */}
        {item.tags && item.tags.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tagsContainer}
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
      colors={['#4dc9ff', '#00bfa5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>News Search</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color="#777" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for articles..."
            placeholderTextColor="#999"
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
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Filter Articles</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#777" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {/* Sort Options */}
              <Text style={styles.sectionTitle}>Sort By</Text>
              <View style={styles.sortOptionsContainer}>
                {["Relevance", "Newest"].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.sortOption,
                      selectedFilter === filter && styles.selectedSortOption,
                    ]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      selectedFilter === filter && styles.selectedSortOptionText
                    ]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Location Filters */}
              <Text style={styles.sectionTitle}>Location</Text>
              
              <View style={styles.inputContainer}>
                <Ionicons name="globe-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Region..."
                  placeholderTextColor="#999"
                  value={regionSearch}
                  onChangeText={setRegionSearch}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="flag-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Country..."
                  placeholderTextColor="#999"
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="City..."
                  placeholderTextColor="#999"
                  value={citySearch}
                  onChangeText={setCitySearch}
                />
              </View>
              
              {/* Date Filter */}
              <Text style={styles.sectionTitle}>Date</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Date (YYYY-MM-DD)..."
                  placeholderTextColor="#999"
                  value={dateSearch}
                  onChangeText={setDateSearch}
                />
              </View>
              
              {/* Engagement Filters */}
              <Text style={styles.sectionTitle}>Engagement</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="heart-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Minimum likes..."
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={minLikes}
                  onChangeText={setMinLikes}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="eye-outline" size={20} color="#00bcd4" style={styles.inputIcon} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Minimum views..."
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={minViews}
                  onChangeText={setMinViews}
                />
              </View>
            </ScrollView>
            
            {/* Button Container */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={handleClearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
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
    backgroundColor: '#fff',
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
    color: '#333',
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
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
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
    color: '#00bcd4',
    marginBottom:
    8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 5,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  cardPreview: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
  },
  tagsContainer: {
    maxHeight: 38,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
    backgroundColor: '#fff',
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
    borderBottomColor: '#eee',
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
    color: '#333',
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
    borderColor: '#ddd',
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
    color: '#555',
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
    borderColor: '#ddd',
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
    borderTopColor: '#eee',
    padding: 15,
  },
  clearButton: {
    flex: 1,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    marginRight: 10,
  },
  clearButtonText: {
    color: '#777',
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