import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, FlatList } from "react-native";
import { getAllNews } from "../../class/News";
import { Feather } from "@expo/vector-icons";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";

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
      <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>
          {formattedDate} | {item.region} | {item.city} | {item.country}
        </Text>
        <Text style={styles.content}>{item.content_short || "No content available"}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search Articles</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for articles..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.filterButton} onPress={() => setIsModalVisible(true)}>
          <Feather name="filter" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <FlatList data={filteredData} renderItem={renderItem} keyExtractor={(item) => item.id} />
      )}

      {/* Filter Modal */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>Filter Articles</Text>

            {/* Search Region */}
            <TextInput
              style={styles.input}
              placeholder="Search region..."
              value={regionSearch}
              onChangeText={setRegionSearch}
            />

            {/* Search Country */}
            <TextInput
              style={styles.input}
              placeholder="Search country..."
              value={countrySearch}
              onChangeText={setCountrySearch}
            />

            {/* Search City */}
            <TextInput
              style={styles.input}
              placeholder="Search city..."
              value={citySearch}
              onChangeText={setCitySearch}
            />

            {/* Date filter */}
            <TextInput
              style={styles.input}
              placeholder="Search by date (YYYY-MM-DD)..."
              value={dateSearch}
              onChangeText={setDateSearch}
            />

            {/* Likes filter */}
            <TextInput
              style={styles.input}
              placeholder="Minimum likes..."
              keyboardType="numeric"
              value={minLikes}
              onChangeText={setMinLikes}
            />

            {/* Views filter */}
            <TextInput
              style={styles.input}
              placeholder="Minimum views..."
              keyboardType="numeric"
              value={minViews}
              onChangeText={setMinViews}
            />

            {/* Sorting Options */}
            <Text style={styles.sectionTitle}>Sort By:</Text>
            {["Relevance", "Newest"].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.modalOption,
                  selectedFilter === filter && styles.selectedOption,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={styles.modalOptionText}>{filter}</Text>
              </TouchableOpacity>
            ))}

            {/* Submit & Clear Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFilter}>
                <Text style={styles.submitButtonText}>Apply Filters</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 20, backgroundColor: "#f9f9f9" },
  header: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  searchContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  searchInput: { flex: 1, height: 40, borderColor: "#ccc", borderWidth: 1, paddingLeft: 10, borderRadius: 8, backgroundColor: "#fff" },
  filterButton: { backgroundColor: "#007BFF", padding: 8, borderRadius: 5, marginLeft: 10, alignItems: "center", justifyContent: "center", width: 40, height: 40 },
  card: { backgroundColor: "#fff", padding: 15, marginBottom: 15, borderRadius: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  date: { fontSize: 12, color: "#777", marginBottom: 10 },
  content: { fontSize: 14, color: "#333" },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContainer: { width: 300, padding: 20, backgroundColor: "#fff", borderRadius: 10 },
  modalHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  input: { height: 40, borderColor: "#ccc", borderWidth: 1, paddingLeft: 10, borderRadius: 8, marginBottom: 15 },
  sectionTitle: { fontSize: 16, marginBottom: 10 },
  modalOption: { padding: 10, borderBottomWidth: 1, borderColor: "#ccc" },
  selectedOption: { backgroundColor: "#007BFF" },
  modalOptionText: { fontSize: 16 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  submitButton: { backgroundColor: "#007BFF", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  submitButtonText: { color: "#fff", fontSize: 16 },
  clearButton: { backgroundColor: "#ccc", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  clearButtonText: { fontSize: 16 },
  closeButton: { marginTop: 15, alignItems: "center" },
  closeButtonText: { fontSize: 16, color: "#007BFF" },
});