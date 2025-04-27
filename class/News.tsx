import { 
  doc, setDoc, getDoc, collection, getDocs, updateDoc,
  query, where, orderBy, limit, arrayUnion, increment
} from "firebase/firestore";
import { db } from "../app/firebaseConfig";

class News {
  constructor(title, date, likes, dislikes, content_long, content_short, tags, country, city, total_views = 0) {
    this.title = title;
    this.date = date;
    this.likes = likes;
    this.dislikes = dislikes;
    this.content_long = content_long;
    this.content_short = content_short;
    this.tags = tags;
    this.country = country;
    this.city = city;
    this.total_views = total_views;
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
    total_views: news.total_views || 0
  }),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    // Handle date properly based on its format
    let date;
    if (typeof data.date === 'string') {
      // If date is stored as a string like "2025-03-19"
      date = data.date;
    } else if (data.date && data.date.toDate) {
      // If date is a Firestore timestamp
      date = data.date.toDate();
    } else if (data.date instanceof Date) {
      // If date is already a JavaScript Date
      date = data.date;
    } else {
      // Fallback
      date = new Date();
    }
    
    return new News(
      data.title,
      date,
      data.likes,
      data.dislikes,
      data.content_long,
      data.content_short,
      data.tags,
      data.country,
      data.city,
      data.total_views || 0
    );
  },
};

// Fixed function: Get recent news by tags
export const getRecentNewsByTags = async (tags) => {
  console.log("Getting recent news for tags:", tags);
  
  try {
    const newsCollection = collection(db, "news");
    
    // First, get all news with the specified tags
    const tagQuery = query(
      newsCollection,
      where("tags", "array-contains-any", tags)
    );
    
    const querySnapshot = await getDocs(tagQuery);
    console.log(`Found ${querySnapshot.size} news articles with matching tags`);
    
    // Process results client-side
    const now = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoString = twoWeeksAgo.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Filter and map results
    const newsArticles = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      })
      .filter(news => {
        // Handle date comparison based on string format (YYYY-MM-DD)
        if (typeof news.date === 'string') {
          // If it's a string, compare lexicographically (works for YYYY-MM-DD format)
          return news.date >= twoWeeksAgoString;
        } else if (news.date && news.date.toDate) {
          // If it's a Firestore timestamp
          return news.date.toDate() >= twoWeeksAgo;
        } else if (news.date instanceof Date) {
          // If it's a JavaScript Date
          return news.date >= twoWeeksAgo;
        }
        // Default fallback
        return true;
      })
      .sort((a, b) => {
        // Sort by date (newest first)
        if (typeof a.date === 'string' && typeof b.date === 'string') {
          // For string dates, reverse the comparison for descending order
          return b.date.localeCompare(a.date);
        } else if (a.date instanceof Date && b.date instanceof Date) {
          return b.date.getTime() - a.date.getTime();
        } else if (a.date && a.date.toDate && b.date && b.date.toDate) {
          return b.date.toDate().getTime() - a.date.toDate().getTime();
        }
        // Fallback for mixed types
        return 0;
      })
      .slice(0, 10); // Limit to 10 items
    
    console.log(`Returning ${newsArticles.length} filtered news articles`);
    return newsArticles;
  } catch (error) {
    console.error("Error fetching recent news:", error);
    return [];
  }
};

export const getAllNews = async () => { 
  const querySnapshot = await getDocs(collection(db, "news"));
  return querySnapshot;
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
  if (!userId || !newsId) return false;
  try {
    const userRef = doc(db, "users", userId);
    const newsRef = doc(db, "news", newsId);
    
    // First check if the user already has this news in their watched_news array
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.log("User not found");
      return false;
    }
    
    const userData = userDoc.data();
    const watchedNews = userData.watched_news || [];
    const isAlreadyWatched = watchedNews.includes(newsId);
    
    // Update user's watched_news array
    await updateDoc(userRef, {
      watched_news: arrayUnion(newsId),
    });
    
    // Only increment total_views if the user hasn't watched this news before
    if (!isAlreadyWatched) {
      // Increment total_views in the news document
      await updateDoc(newsRef, {
        total_views: increment(1)
      });
      console.log(`News ${newsId} added to watched_news and view count incremented`);
    } else {
      console.log(`News ${newsId} is already in watched_news, view count not incremented`);
    }
    
    return true;
  } catch (error) {
    console.error("Error adding watched news:", error);
    return false;
  }
};

// New function to increment likes and views
export const incrementNewsLikes = async (newsId) => {
  if (!newsId) return false;
  try {
    const newsRef = doc(db, "news", newsId);
    
    // Increment likes and total_views
    await updateDoc(newsRef, {
      likes: increment(1),
      total_views: increment(1)
    });
    
    console.log(`News ${newsId} likes and views incremented`);
    return true;
  } catch (error) {
    console.error("Error incrementing news likes:", error);
    return false;
  }
};

// New function to increment dislikes and views
export const incrementNewsDislikes = async (newsId) => {
  if (!newsId) return false;
  try {
    const newsRef = doc(db, "news", newsId);
    
    // Increment dislikes and total_views
    await updateDoc(newsRef, {
      dislikes: increment(1),
      total_views: increment(1)
    });
    
    console.log(`News ${newsId} dislikes and views incremented`);
    return true;
  } catch (error) {
    console.error("Error incrementing news dislikes:", error);
    return false;
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
      return newsSnap.exists() ? { id: newsId, ...newsSnap.data() } : null;
    });
    
    const newsResults = await Promise.all(newsPromises);
    // Return only the non-null news items
    return newsResults.filter((news) => news !== null);
  } catch (error) {
    console.error("Error fetching liked news:", error);
    return [];
  }
};