import { 
  doc, setDoc, getDoc, getDocs, updateDoc, collection,
  arrayUnion, increment, serverTimestamp
} from "firebase/firestore";
import { db } from "../app/firebaseConfig";

class User {
  constructor(
    public uid: string,
    public profileName: string = "",
    public experience: number = 0,
    public level: number = 1,
    public notifications: any[] = [],
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

/**
 * New function: updateUsername
 *
 * Updates the user's username (stored as profileName) in Firestore.
 *
 * @param uid - The user's unique identifier.
 * @param newUsername - The new username to set.
 * @returns A boolean indicating whether the operation was successful.
 */
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

/**
 * Existing function to update experience by increment.
 * This function has been left intact for reference.
 */
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

/**
 * New function: addExperience
 *
 * This function adds a specified amount of experience points to the user.
 * If the total experience reaches or exceeds 100, it resets the experience (using the remainder)
 * and increases the user's level accordingly.
 *
 * @param uid - The user's unique identifier.
 * @param points - The amount of experience points to add.
 * @returns A boolean indicating whether the operation was successful.
 */
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

/**
 * New function: handleLogin
 *
 * This function should be called when a user logs in.
 * It checks if the user's last login date is different from today. If it is a new day:
 *  - It increments the user's streak (if the last login was yesterday, streak increases; otherwise, it resets to 1).
 *  - It adds 10 experience points using the addExperience function.
 *  - It updates the user's last_login to the current timestamp.
 * If the user has already logged in today, no updates are made.
 *
 * @param uid - The user's unique identifier.
 * @returns A boolean indicating whether the login handling was successful.
 */
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

// Achievement Functions

/**
 * Retrieves the achievements for a given user.
 * @param uid - The user's unique identifier.
 * @returns An array of achievement strings or null if the user doesn't exist.
 */
export const getUserAchievements = async (uid: string): Promise<string[] | null> => {
  try {
    const user = await getUser(uid);
    return user ? user.achievements : null;
  } catch (error) {
    console.error("Error retrieving achievements:", error);
    return null;
  }
};

/**
 * Adds a new achievement to the user's achievements array.
 * @param uid - The user's unique identifier.
 * @param achievement - The achievement string to add.
 * @returns A boolean indicating whether the operation was successful.
 */
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

// Function to add a disliked news article and increment its dislike count
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
// Example function to add mock news data (assuming News and newsConverter are defined)
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