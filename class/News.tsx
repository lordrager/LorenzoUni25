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
  const twoWeeksAgoISO = twoWeeksAgo.toISOString();
  try {
    const newsCollection = await collection(db, "news").withConverter(newsConverter);
    const q = query(
      newsCollection,
      where("tags", "array-contains-any", tags),
      where("date", ">=", twoWeeksAgo),
      orderBy("date", "desc"),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    //return querySnapshot;
    return querySnapshot.docs.map(doc => doc.data());
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
    // Reference to the news collection
    const newsCollection = collection(db, "news").withConverter(newsConverter);
    // Query to find the news article by title
    const q = query(newsCollection, where("title", "==", title));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No news article found with the given title.");
      return false;
    }

    // Assuming titles are unique, update the first matching document
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
      watched_news: arrayUnion(newsId), // Add news ID to watched list
    });
    console.log(`News ${newsId} added to watched_news`);
  } catch (error) {
    console.error("Error adding watched news:", error);
  }
};