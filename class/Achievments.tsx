import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  getDocs,
} from "firebase/firestore";
import { db } from "../app/firebaseConfig";
import { getUser, addUserAchievement, addExperience } from "./User";

export class Achievement {
  constructor(
    public id: string,
    public name: string,
    public photo: string,           // URL or file path to the achievement image
    public requirements: string[],  // Array of requirement strings
    public experiencePoints: number,       // Experience points awarded
    public requiredStreak?: number,      // Required login streak to earn this achievement
    public requiredLikes?: number,       // Required number of article likes
    public requiredDislikes?: number     // Required number of article dislikes
  ) {}
}

const achievementConverter = {
  toFirestore: (achievement: Achievement) => ({
    name: achievement.name,
    photo: achievement.photo,
    requirements: achievement.requirements,
    experiencePoints: achievement.experiencePoints,
    requiredStreak: achievement.requiredStreak,
    requiredLikes: achievement.requiredLikes,
    requiredDislikes: achievement.requiredDislikes,
  }),
  fromFirestore: (snapshot: any, options: any): Achievement => {
    const data = snapshot.data(options);
    return new Achievement(
      snapshot.id,
      data.name,
      data.photo,
      data.requirements,
      data.experiencePoints,
      data.requiredStreak,
      data.requiredLikes,
      data.requiredDislikes
    );
  },
};

export const getAchievement = async (
  id: string
): Promise<Achievement | null> => {
  try {
    const achievementRef = doc(
      db,
      "achievements",
      id
    ).withConverter(achievementConverter);
    const achievementSnap = await getDoc(achievementRef);
    return achievementSnap.exists() ? achievementSnap.data() : null;
  } catch (error) {
    console.error("Error fetching achievement:", error);
    return null;
  }
};

export const getAllAchievements = async (): Promise<Achievement[]> => {
  try {
    const achievementsRef = collection(db, "achievements").withConverter(
      achievementConverter
    );
    const q = query(achievementsRef);
    const snapshot = await getDocs(q);
    const achievementsList: Achievement[] = [];
    snapshot.forEach((doc) => achievementsList.push(doc.data()));
    return achievementsList;
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return [];
  }
};

/**
 * Checks if a user meets the requirements for a specific achievement
 * @param userId The user's ID
 * @param achievementId The achievement ID to check
 * @returns An object with result indicating if requirements are met and a message
 */
export const checkAchievementRequirements = async (
  userId: string,
  achievementId: string
): Promise<{ met: boolean; message: string }> => {
  try {
    // Get user and achievement data
    const user = await getUser(userId);
    const achievement = await getAchievement(achievementId);

    if (!user) {
      return { met: false, message: "User not found" };
    }

    if (!achievement) {
      return { met: false, message: "Achievement not found" };
    }

    // Check if user already has this achievement
    if (user.achievements && user.achievements.includes(achievementId)) {
      return { met: true, message: "Achievement already earned" };
    }

    // Check streak requirement
    if (achievement.requiredStreak && user.streak < achievement.requiredStreak) {
      return { 
        met: false, 
        message: `Login streak requirement not met. Current: ${user.streak}, Required: ${achievement.requiredStreak}` 
      };
    }

    // Check likes requirement
    if (achievement.requiredLikes && (!user.liked_news || user.liked_news.length < achievement.requiredLikes)) {
      const currentLikes = user.liked_news ? user.liked_news.length : 0;
      return { 
        met: false, 
        message: `Article likes requirement not met. Current: ${currentLikes}, Required: ${achievement.requiredLikes}` 
      };
    }

    // Check dislikes requirement
    if (achievement.requiredDislikes && (!user.disliked_news || user.disliked_news.length < achievement.requiredDislikes)) {
      const currentDislikes = user.disliked_news ? user.disliked_news.length : 0;
      return { 
        met: false, 
        message: `Article dislikes requirement not met. Current: ${currentDislikes}, Required: ${achievement.requiredDislikes}` 
      };
    }

    // All requirements met
    return { met: true, message: "All requirements met" };
  } catch (error) {
    console.error("Error checking achievement requirements:", error);
    return { met: false, message: "Error checking requirements" };
  }
};

/**
 * Checks and awards an achievement to a user if they meet the requirements
 * @param userId The user's ID
 * @param achievementId The achievement ID to check and award
 * @returns Boolean indicating success of the operation
 */
export const checkAndAwardAchievement = async (
  userId: string,
  achievementId: string
): Promise<boolean> => {
  try {
    const result = await checkAchievementRequirements(userId, achievementId);
    
    if (result.met) {
      // Only add if it's not already awarded (extra safety check)
      const user = await getUser(userId);
      if (user && (!user.achievements || !user.achievements.includes(achievementId))) {
        // Get the achievement to add its experience points
        const achievement = await getAchievement(achievementId);
        
        if (achievement) {
          await addUserAchievement(userId, achievementId);
          await addExperience(userId, achievement.experiencePoints);
          console.log(`Achievement ${achievementId} awarded to user ${userId} with ${achievement.experiencePoints} XP`);
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error awarding achievement:", error);
    return false;
  }
};

export const checkAllAchievements = async (userId: string): Promise<number> => {
  try {
    const achievements = await getAllAchievements();
    for (const achievement of achievements) {
      console.log(`Checking achievement: ${achievement.id}`);
      const awarded = await checkAndAwardAchievement(userId, achievement.id);
    }
  } catch (error) {
    console.error("Error checking all achievements:", error);
    return 0;
  }
};