import { 
  doc, setDoc, getDoc, collection, getDocs, updateDoc,
  query, where, orderBy, limit, arrayUnion
} from "firebase/firestore";
import { db } from "../app/firebaseConfig";

class News {
  constructor(title, date, likes, dislikes, content_long, content_short, tags, country, city) {
    this.title = title;
    this.date = date;
    this.likes = likes;
    this.dislikes = dislikes;
    this.content_long = content_long;
    this.content_short = content_short;
    this.tags = tags;
    this.country = country;
    this.city = city;
  }
}

const newsConverter = {
  toFirestore: (news) => ({
    title: news.title,
    date: news.date,
    likes: news.likes,
    dislikes: news.dislikes,
    content_long: news.content_long,
    content_short: news.content_short,
    tags: news.tags,
    country: news.country,
    city: news.city,
  }),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new News(
      data.title,
      new Date(data.date),
      data.likes,
      data.dislikes,
      data.content_long,
      data.content_short,
      data.tags,
      data.country,
      data.city
    );
  },
};

// New function: Get recent news by tags
export const getRecentNewsByTags = async (tags) => {
  // Calculate date threshold (2 weeks ago)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  try {
    const newsCollection = collection(db, "news").withConverter(newsConverter);
    const q = query(
      newsCollection,
      where("tags", "array-contains-any", tags),
      where("date", ">=", twoWeeksAgo),
      orderBy("date", "desc"),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    // Map each document to include its id
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching recent news:", error);
    return [];
  }
};

export const getAllNews = async () => { 
  const querySnapshot = await getDocs(collection(db, "news"));
  return querySnapshot;
};

// New function: Add mock news data to Firebase
export const addMockNewsData = async () => {
  const mockNews = [
    new News(
      "Breaking: Market Crash Expected",
      new Date(),
      120,
      15,
      "Stock markets are predicted to fall drastically due to global economic instability...",
      "Markets may crash soon!",
      ["finance", "stocks", "economy"],
      "USA",
      "New York"
    ),
    new News(
      "Tech Giants Release New AI",
      new Date(),
      200,
      10,
      "Several major tech companies have unveiled their latest AI models, promising groundbreaking advancements...",
      "New AI models announced!",
      ["technology", "AI", "innovation"],
      "UK",
      "London"
    ),
    new News(
      "Sports Finals: Historic Victory",
      new Date(),
      300,
      5,
      "In an incredible turn of events, the underdogs secured a last-minute victory in the finals...",
      "Underdogs win big!",
      ["sports", "football", "championship"],
      "Spain",
      "Madrid"
    )
  ];

  try {
    for (const article of mockNews) {
      const newsRef = doc(collection(db, "news").withConverter(newsConverter));
      console.log("Adding mock news data...");
      await setDoc(newsRef, newsConverter.toFirestore(article));
      console.log(`Added news with ID: ${newsRef.id}`);
    }
    console.log("Mock news data added successfully.");
  } catch (error) {
    console.error("Error adding mock news data:", error);
  }
};

export const updateNewsByTitle = async (title, updatedFields) => {
  try {
    const newsCollection = collection(db, "news").withConverter(newsConverter);
    const q = query(newsCollection, where("title", "==", title));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log("No news article found with the given title.");
      return false;
    }
    const newsDocRef = querySnapshot.docs[0].ref;
    await updateDoc(newsDocRef, updatedFields, { merge: true });
    console.log(`News article "${title}" updated successfully.`);
    return true;
  } catch (error) {
    console.error("Error updating news article:", error);
    return false;
  }
};

export const addWatchedNews = async (userId, newsId) => {
  if (!userId || !newsId) return;
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      watched_news: arrayUnion(newsId),
    });
    console.log(`News ${newsId} added to watched_news`);
  } catch (error) {
    console.error("Error adding watched news:", error);
  }
};

// New function: Get watched news for a user
export const getLikedNews = async (userId: string) => {
  try {
    // Get the user's document
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.error("User not found");
      return [];
    }
    const userData = userSnap.data();
    // Extract the liked_news array (list of news IDs)
    const likedNewsIds: string[] = userData.liked_news || [];
    
    // For each news ID, fetch the corresponding news document
    const newsPromises = likedNewsIds.map(async (newsId) => {
      const newsRef = doc(db, "news", newsId).withConverter(newsConverter);
      const newsSnap = await getDoc(newsRef);
      return newsSnap.exists() ? newsSnap.data() : null;
    });
    
    const newsResults = await Promise.all(newsPromises);
    // Return only the non-null news items
    return newsResults.filter((news) => news !== null);
  } catch (error) {
    console.error("Error fetching liked news:", error);
    return [];
  }
};