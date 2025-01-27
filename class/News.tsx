import { doc, setDoc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../app/firebaseConfig";

// Define the News class
class News {
  constructor(title, date, likes, dislikes, content_long, content_short, tags) {
    this.title = title; // String: Article title
    this.date = date; // Date: Article date
    this.likes = likes; // Number: Number of likes
    this.dislikes = dislikes; // Number: Number of dislikes
    this.content_long = content_long; // String: Detailed news content
    this.content_short = content_short; // String: Short news summary
    this.tags = tags; // Array: Tags associated with the news
  }
}

// Firestore data converter for News
const newsConverter = {
  toFirestore: (news) => {
    return {
      title: news.title,
      date: news.date.toISOString(), // Store date as ISO string in Firestore
      likes: news.likes,
      dislikes: news.dislikes,
      content_long: news.content_long,
      content_short: news.content_short,
      tags: news.tags,
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new News(
      data.title,
      new Date(data.date), // Convert Firestore's string date back to a Date object
      data.likes,
      data.dislikes,
      data.content_long,
      data.content_short,
      data.tags
    );
  },
};

// Add a new news article
export const addNews = async (newsId, newsData) => {
  const newsRef = doc(db, "news", newsId).withConverter(newsConverter);
  await setDoc(newsRef, newsData);
  console.log("News added successfully");
};

// Get a single news article
export const getNews = async (newsId) => { 
  const newsRef = doc(db, "news", newsId).withConverter(newsConverter);
  const newsSnapshot = await getDoc(newsRef);

  if (newsSnapshot.exists()) {
    return newsSnapshot.data(); // Returns an instance of the News class
  } else {
    console.log("No such news article found!");
    return null;
  }
};

export const getAllNews = async () => { 
    const querySnapshot = await getDocs(collection(db, "news"));
    return querySnapshot;
}

// Get all news articles with a specific tag
export const getNewsByTag = async (tag) => {
  const newsCollection = collection(db, "news").withConverter(newsConverter);
  const q = query(newsCollection, where("tags", "array-contains", tag));
  const querySnapshot = await getDocs(q);

  const newsList = querySnapshot.docs.map((doc) => doc.data());
  return newsList; // Returns an array of News class instances
};