import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { getAllNews } from "../../class/News";
import { Feather } from "@expo/vector-icons";

export default function UserSearchScreen() {
  const [searchText, setSearchText] = useState("");
  const [newsData, setNewsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("Relevance");
  const [regionSearch, setRegionSearch] = useState("");
  const [tempFilter, setTempFilter] = useState("Relevance");
  const [tempRegion, setTempRegion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNews();
  }, []);

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

  const handleSearch = (text) => {
    setSearchText(text);
    filterData(text, selectedFilter, regionSearch);
  };

  const filterData = (searchText, filter, regionFilter) => {
    let filtered = newsData.filter((item) =>
      item.title.toLowerCase().includes(searchText.toLowerCase())
    );

    if (regionFilter) {
      filtered = filtered.filter((item) =>
        item.region.toLowerCase().includes(regionFilter.toLowerCase())
      );
    }

    if (filter === "Newest") {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
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
    setSelectedFilter(tempFilter);
    setRegionSearch(tempRegion);
    filterData(searchText, tempFilter, tempRegion);
    setIsModalVisible(false);
  };

  const handleClearFilters = () => {
    setTempFilter("Relevance");
    setTempRegion("");
    setSelectedFilter("Relevance");
    setRegionSearch("");
    filterData(searchText, "Relevance", "");
    setIsModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.date}>
        {item.date} | {item.region}
      </Text>
      <Text style={styles.content}>{item.content_short || "No content available"}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search Articles</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for articles..."
          value={searchText}
          onChangeText={handleSearch}
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
              style={styles.regionInput}
              placeholder="Search region..."
              value={tempRegion}
              onChangeText={setTempRegion}
            />

            {/* Sorting Options */}
            <Text style={styles.sectionTitle}>Sort By:</Text>
            {["Relevance", "Newest"].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.modalOption,
                  tempFilter === filter && styles.selectedOption,
                ]}
                onPress={() => setTempFilter(filter)}
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

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingLeft: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  filterButton: {
    backgroundColor: "#007BFF",
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },

  // News Box Styles
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  date: { fontSize: 12, color: "#777", marginBottom: 10 },
  content: { fontSize: 14, color: "#333" },

  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContainer: { backgroundColor: "#fff", padding: 20, borderRadius: 10, width: 320 },
  modalHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  regionInput: { height: 40, borderColor: "#ddd", borderWidth: 1, paddingLeft: 10, borderRadius: 8, backgroundColor: "#f8f8f8", marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  submitButton: { flex: 1, backgroundColor: "#007BFF", padding: 12, borderRadius: 8, alignItems: "center", marginRight: 10 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  clearButton: { flex: 1, backgroundColor: "#FF4444", padding: 12, borderRadius: 8, alignItems: "center" },
  clearButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});