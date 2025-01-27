import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Modal } from "react-native";

export default function UserSearchScreen() {
  const allData = [
    { id: "1", title: "Breaking News: Article 1", date: "2025-01-19", region: "USA" },
    { id: "2", title: "Latest Trends: Article 2", date: "2025-01-18", region: "UK" },
    { id: "3", title: "Tech Updates: Article 3", date: "2025-01-15", region: "USA" },
    { id: "4", title: "New Research: Article 4", date: "2025-01-12", region: "Canada" },
    { id: "5", title: "Sports Highlights: Article 5", date: "2025-01-10", region: "Australia" },
  ];

  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState(allData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("Relevance");

  const handleSearch = (text) => {
    setSearchText(text);
    filterData(text, selectedFilter); // Apply the filter along with search
  };

  const handleFilter = () => {
    filterData(searchText, selectedFilter); // Re-apply the filter based on the current search text
    setIsModalVisible(false);
  };

  const filterData = (searchText, filter) => {
    let filtered = allData.filter(item =>
      item.title.toLowerCase().includes(searchText.toLowerCase())
    );

    if (filter === "Newest") {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
    } else if (filter === "Region") {
      filtered.sort((a, b) => a.region.localeCompare(b.region)); // Sort by region alphabetically
    }

    setFilteredData(filtered);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text>{item.title}</Text>
      <Text style={styles.date}>{item.date} | {item.region}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search Articles</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for articles..."
        value={searchText}
        onChangeText={handleSearch}
      />
      
      <TouchableOpacity style={styles.filterButton} onPress={() => setIsModalVisible(true)}>
        <Text style={styles.filterButtonText}>Filter</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>Select Filter</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => setSelectedFilter("Relevance")}
            >
              <Text style={styles.modalOptionText}>Relevance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => setSelectedFilter("Newest")}
            >
              <Text style={styles.modalOptionText}>Newest</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => setSelectedFilter("Region")}
            >
              <Text style={styles.modalOptionText}>Region</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleFilter}>
              <Text style={styles.applyButtonText}>Apply Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 8,
  },
  filterButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: "center",
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  date: {
    fontSize: 12,
    color: "#777",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: 300,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  modalOptionText: {
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  closeButton: {
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#007BFF",
  },
});