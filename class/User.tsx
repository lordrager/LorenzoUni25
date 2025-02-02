import { 
    doc, setDoc, getDoc, updateDoc,
    arrayUnion, increment, serverTimestamp
  } from "firebase/firestore";
  import { db } from "../app/firebaseConfig";
  
  class User {
    constructor(
      public uid: string,
      public experience: number = 0,
      public level: number = 1,
      public notifications: any[] = [],
      public preferred_tags: string[] = [],
      public liked_news: string[] = [],
      public disliked_news: string[] = [],
      public rank: number = 0,
      public streak: number = 0,
      public watched_news: string[] = [],
      public last_login?: Date
    ) {}
  }
  
  const userConverter = {
    toFirestore: (user: User) => ({
      experience: user.experience,
      level: user.level,
      notifications: user.notifications,
      preferred_tags: user.preferred_tags,
      liked_news: user.liked_news,
      disliked_news: user.disliked_news,
      rank: user.rank,
      streak: user.streak,
      watched_news: user.watched_news,
      last_login: serverTimestamp()
    }),
    fromFirestore: (snapshot: any, options: any): User => {
      const data = snapshot.data(options);
      return new User(
        snapshot.id,
        data.experience,
        data.level,
        data.notifications,
        data.preferred_tags,
        data.liked_news,
        data.disliked_news,
        data.rank,
        data.streak,
        data.watched_news,
        data.last_login?.toDate()
      );
    },
  };
  
  // User Management Functions
  export const createUser = async (uid: string, tags: string[]) => {
    try {
      const userRef = doc(db, "users", uid).withConverter(userConverter);
      
      // Assuming the User class takes uid and tags as parameters
      const user = new User(uid, tags);  // Make sure User has a constructor that accepts tags
  
      await setDoc(userRef, user);
      console.log(`User ${uid} created successfully with tags: ${tags}`);
      return true;
    } catch (error) {
      console.error("Error creating user:", error);
      return false;
    }
  };
  
  export const getUser = async (uid: string): Promise<User | null> => {
    try {
      const userRef = doc(db, "users", uid).withConverter(userConverter);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? userSnap.data() : null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  };
  
  export const updateUser = async (uid: string, updatedFields: Partial<User>) => {
    try {
      const userRef = doc(db, "users", uid).withConverter(userConverter);
      await updateDoc(userRef, updatedFields);
      console.log(`User ${uid} updated successfully.`);
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      return false;
    }
  };
  
  // Specific Field Updates
  export const addWatchedNews = async (uid: string, newsId: string) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        watched_news: arrayUnion(newsId)
      });
      return true;
    } catch (error) {
      console.error("Error adding watched news:", error);
      return false;
    }
  };
  
  export const updateStreak = async (uid: string) => {
    try {
      const user = await getUser(uid);
      if (!user) return false;
  
      const today = new Date();
      const lastLogin = user.last_login || new Date(0);
      const dayDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 3600 * 24));
  
      let newStreak = user.streak;
      if (dayDiff === 1) {
        newStreak++;
      } else if (dayDiff > 1) {
        newStreak = 1;
      }
  
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        streak: newStreak,
        last_login: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error updating streak:", error);
      return false;
    }
  };
  
  export const updateExperience = async (uid: string, points: number) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        experience: increment(points)
      });
      return true;
    } catch (error) {
      console.error("Error updating experience:", error);
      return false;
    }
  };
  
  // Notification Management
  export const addNotification = async (uid: string, notification: any) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        notifications: arrayUnion(notification)
      });
      return true;
    } catch (error) {
      console.error("Error adding notification:", error);
      return false;
    }
  };