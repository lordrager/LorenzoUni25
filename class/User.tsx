import { 
  doc, setDoc, getDoc, getDocs, updateDoc, collection,
  arrayUnion, arrayRemove, increment, serverTimestamp
} from "firebase/firestore";
import { db } from "../app/firebaseConfig";

// Define the UserNotification interface
export interface UserNotification {
  id: string;           // Unique identifier for the notification
  date: string;         // ISO string timestamp
  description: string;  // Notification content
  isSeen: boolean;      // Whether the user has seen this notification
  newsId?: string;      // Optional ID reference to a news article
}

class User {
  constructor(
    public uid: string,
    public profileName: string = "",
    public experience: number = 0,
    public level: number = 1,
    public notifications: UserNotification[] = [], // Typed as UserNotification[]
    public tags: string[] = [],
    public liked_news: string[] = [],
    public disliked_news: string[] = [],
    public rank: number = 0,
    public streak: number = 0,
    public watched_news: string[] = [],
    public last_login?: Date,
    public achievements: string[] = []
  ) {}
}

const userConverter = {
  toFirestore: (user: User) => ({
    profileName: user.profileName,
    experience: user.experience,
    level: user.level,
    notifications: user.notifications,
    tags: user.tags,
    liked_news: user.liked_news,
    disliked_news: user.disliked_news,
    rank: user.rank,
    streak: user.streak,
    watched_news: user.watched_news,
    last_login: serverTimestamp(),
    achievements: user.achievements,
  }),
  fromFirestore: (snapshot: any, options: any): User => {
    const data = snapshot.data(options);
    return new User(
      snapshot.id,
      data.profileName,
      data.experience,
      data.level,
      data.notifications,
      data.tags,
      data.liked_news,
      data.disliked_news,
      data.rank,
      data.streak,
      data.watched_news,
      data.last_login?.toDate(),
      data.achievements
    );
  },
};

// User Management Functions
export const createUser = async (uid: string, tags: string[]) => {
  try {
    const userRef = doc(db, "users", uid).withConverter(userConverter);
    
    // Create a new user with an initial empty profileName (adjust as needed)
    const user = new User(uid, "", 0, 1, [], tags);

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

export const getAllUsers = async () => {
  try {
    console.log("Fetching all users...");
    const usersRef = collection(db, "users").withConverter(userConverter);
    const snapshot = await getDocs(usersRef);
    console.log("Snapshot:", snapshot);
    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
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

export const updateUsername = async (uid: string, newUsername: string): Promise<boolean> => {
  const trimmedUsername = newUsername ? newUsername.trim() : "";
  if (!trimmedUsername) {
    console.error("Invalid username provided:", newUsername);
    return false;
  }
  console.log(`Updating username for user ${uid} to ${trimmedUsername}.`);
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { profileName: trimmedUsername });
    console.log(`User ${uid} username updated to ${trimmedUsername}.`);
    return true;
  } catch (error) {
    console.error("Error updating username:", error);
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
    const lastLogin = user.last_login ? new Date(user.last_login) : null;
    // Calculate difference in days between today and last login (0 means same day)
    const dayDiff = lastLogin 
      ? Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 3600 * 24))
      : 1; // If no last_login, assume it's a new day

    let newStreak = user.streak;
    if (dayDiff === 1) {
      newStreak++;
    } else if (dayDiff > 1) {
      newStreak = 1;
    }

    // Only add XP if this is the first login of the day (i.e. dayDiff is at least 1)
    if (dayDiff >= 1) {
      await addExperience(uid, 10);
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

export const addExperience = async (uid: string, points: number): Promise<boolean> => {
  try {
    const user = await getUser(uid);
    if (!user) return false;
    
    let newExp = user.experience + points;
    let newLevel = user.level;
    
    // Level up logic: for every 100 experience, increment level and reset experience
    if (newExp >= 100) {
      const levelsGained = Math.floor(newExp / 100);
      newLevel += levelsGained;
      newExp = newExp % 100;
    }
    
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      experience: newExp,
      level: newLevel,
    });
    console.log(`User ${uid} now has ${newExp} experience points and is level ${newLevel}.`);
    return true;
  } catch (error) {
    console.error("Error adding experience:", error);
    return false;
  }
};

export const handleLogin = async (uid: string): Promise<boolean> => {
  try {
    const user = await getUser(uid);
    if (!user) return false;
    
    const today = new Date();
    const todayString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    
    let lastLoginString = '';
    if (user.last_login) {
      const lastLogin = new Date(user.last_login);
      lastLoginString = `${lastLogin.getFullYear()}-${lastLogin.getMonth()}-${lastLogin.getDate()}`;
    }
    
    // If the user has already logged in today, do nothing.
    if (todayString === lastLoginString) {
      console.log("User already logged in today. No streak or experience update.");
      return true;
    }
    
    // Determine new streak
    let newStreak = 1;
    if (user.last_login) {
      const lastLogin = new Date(user.last_login);
      const dayDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 3600 * 24));
      if (dayDiff === 1) {
        newStreak = user.streak + 1;
      }
    }
    
    // Add 10 experience points (this function handles level up logic)
    await addExperience(uid, 10);
    
    // Update streak and last_login timestamp
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      streak: newStreak,
      last_login: serverTimestamp()
    });
    
    console.log(`User ${uid} logged in: streak updated to ${newStreak} and 10 experience points added.`);
    return true;
  } catch (error) {
    console.error("Error handling user login:", error);
    return false;
  }
};

// Notification Management Functions

/**
 * Add a notification to a user's notifications array
 * @param uid The user's ID
 * @param notification The notification object to add
 * @returns Boolean indicating success
 */
export const addNotification = async (uid: string, notification: UserNotification): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      notifications: arrayUnion(notification)
    });
    console.log(`Notification added for user ${uid}:`, notification.id);
    return true;
  } catch (error) {
    console.error("Error adding notification:", error);
    return false;
  }
};

/**
 * Update a specific notification in a user's notifications array
 * @param uid The user's ID
 * @param notificationId The ID of the notification to update
 * @param updatedNotification The updated notification object
 * @returns Boolean indicating success
 */
export const updateUserNotification = async (
  uid: string, 
  notificationId: string, 
  updatedNotification: UserNotification
): Promise<boolean> => {
  try {
    // First, get the current user data
    const user = await getUser(uid);
    if (!user) {
      console.error("User not found");
      return false;
    }
    
    // Find the existing notification
    const existingNotificationIndex = user.notifications.findIndex(
      (notification) => notification.id === notificationId
    );
    
    if (existingNotificationIndex === -1) {
      console.error(`Notification ${notificationId} not found for user ${uid}`);
      return false;
    }
    
    // Create a new notifications array with the updated notification
    const updatedNotifications = [...user.notifications];
    updatedNotifications[existingNotificationIndex] = updatedNotification;
    
    // Update the user document with the new notifications array
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { 
      notifications: updatedNotifications 
    });
    
    console.log(`Notification ${notificationId} updated for user ${uid}`);
    return true;
  } catch (error) {
    console.error("Error updating notification:", error);
    return false;
  }
};

/**
 * Mark a notification as seen
 * @param uid The user's ID
 * @param notificationId The ID of the notification to mark as seen
 * @returns Boolean indicating success
 */
export const markNotificationAsSeen = async (
  uid: string,
  notificationId: string
): Promise<boolean> => {
  try {
    // Get the user data
    const user = await getUser(uid);
    if (!user) {
      console.error("User not found");
      return false;
    }
    
    // Find the notification
    const notification = user.notifications.find(n => n.id === notificationId);
    if (!notification) {
      console.error(`Notification ${notificationId} not found`);
      return false;
    }
    
    // Update the notification
    const updatedNotification = {
      ...notification,
      isSeen: true
    };
    
    return await updateUserNotification(uid, notificationId, updatedNotification);
  } catch (error) {
    console.error("Error marking notification as seen:", error);
    return false;
  }
};

/**
 * Create a new notification object
 * @param description The notification message
 * @param newsId Optional ID of associated news article
 * @returns A UserNotification object
 */
export const createNotification = (
  description: string,
  newsId?: string
): UserNotification => {
  const now = new Date();
  const id = `notification_${now.getTime()}_${Math.random().toString(36).substring(2, 11)}`;
  
  return {
    id,
    date: now.toISOString(),
    description,
    isSeen: false,
    newsId
  };
};

/**
 * Get all notifications for a user
 * @param uid The user's ID
 * @returns Array of notifications or empty array if none found
 */
export const getUserNotifications = async (uid: string): Promise<UserNotification[]> => {
  try {
    const user = await getUser(uid);
    if (!user) {
      console.error("User not found");
      return [];
    }
    
    return user.notifications || [];
  } catch (error) {
    console.error("Error getting user notifications:", error);
    return [];
  }
};

/**
 * Delete a specific notification
 * @param uid The user's ID
 * @param notificationId The ID of the notification to delete
 * @returns Boolean indicating success
 */
export const deleteNotification = async (
  uid: string,
  notificationId: string
): Promise<boolean> => {
  try {
    // Get the user data
    const user = await getUser(uid);
    if (!user) {
      console.error("User not found");
      return false;
    }
    
    // Find the notification
    const notification = user.notifications.find(n => n.id === notificationId);
    if (!notification) {
      console.error(`Notification ${notificationId} not found`);
      return false;
    }
    
    // Create a new notifications array without the deleted notification
    const updatedNotifications = user.notifications.filter(
      n => n.id !== notificationId
    );
    
    // Update the user document
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { 
      notifications: updatedNotifications 
    });
    
    console.log(`Notification ${notificationId} deleted for user ${uid}`);
    return true;
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
};

/**
 * Create a notification for a new article
 * @param uid The user's ID
 * @param articleId The article ID
 * @param articleTitle The article title
 * @returns Boolean indicating success
 */
export const createArticleNotification = async (
  uid: string,
  articleId: string,
  articleTitle: string
): Promise<boolean> => {
  const description = `New article: ${articleTitle}`;
  const notification = createNotification(description, articleId);
  
  return await addNotification(uid, notification);
};

// Achievement Functions
export const getUserAchievements = async (uid: string): Promise<string[] | null> => {
  try {
    const user = await getUser(uid);
    return user ? user.achievements : null;
  } catch (error) {
    console.error("Error retrieving achievements:", error);
    return null;
  }
};

export const addUserAchievement = async (uid: string, achievement: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      achievements: arrayUnion(achievement)
    });
    console.log(`Achievement "${achievement}" added successfully to user ${uid}`);
    return true;
  } catch (error) {
    console.error("Error adding achievement:", error);
    return false;
  }
};

export const addLikedNews = async (uid: string, newsId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    // Update user's liked_news and watched_news fields
    await updateDoc(userRef, {
      liked_news: arrayUnion(newsId),
      watched_news: arrayUnion(newsId)
    });
    
    // Update the news document's likes field by incrementing it by 1
    const newsRef = doc(db, "news", newsId);
    await updateDoc(newsRef, {
      likes: increment(1)
    });

    console.log(`News ${newsId} added to liked_news and watched_news for user ${uid}; likes incremented.`);
    return true;
  } catch (error) {
    console.error("Error adding liked news:", error);
    return false;
  }
};

export const addDislikedNews = async (uid: string, newsId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    // Update user's disliked_news and watched_news fields
    await updateDoc(userRef, {
      disliked_news: arrayUnion(newsId),
      watched_news: arrayUnion(newsId)
    });
    
    // Update the news document's dislikes field by incrementing it by 1
    const newsRef = doc(db, "news", newsId);
    await updateDoc(newsRef, {
      dislikes: increment(1)
    });

    console.log(`News ${newsId} added to disliked_news and watched_news for user ${uid}; dislikes incremented.`);
    return true;
  } catch (error) {
    console.error("Error adding disliked news:", error);
    return false;
  }
};

export default User;