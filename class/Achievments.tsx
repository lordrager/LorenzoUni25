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
  
  /**
   * Achievement Class
   *
   * Represents an achievement with a unique id, a name, a photo (URL),
   * an array of requirements, and the experience points (expPoints) it awards.
   */
  export class Achievement {
    constructor(
      public id: string,
      public name: string,
      public photo: string,           // URL or file path to the achievement image
      public requirements: string[],  // Array of requirement strings
      public expPoints: number        // Experience points awarded
    ) {}
  }
  
  /**
   * Firestore Data Converter for Achievement.
   *
   * This converter ensures that Achievement objects are properly formatted
   * when being written to or read from Firestore.
   */
  const achievementConverter = {
    toFirestore: (achievement: Achievement) => ({
      name: achievement.name,
      photo: achievement.photo,
      requirements: achievement.requirements,
      expPoints: achievement.expPoints,
    }),
    fromFirestore: (snapshot: any, options: any): Achievement => {
      const data = snapshot.data(options);
      return new Achievement(
        snapshot.id,
        data.name,
        data.photo,
        data.requirements,
        data.expPoints
      );
    },
  };
  
  /**
   * Create a new Achievement document in Firestore.
   * @param achievement - An Achievement instance to be stored.
   * @returns True if the operation was successful, false otherwise.
   */
  export const createAchievement = async (
    achievement: Achievement
  ): Promise<boolean> => {
    try {
      const achievementRef = doc(
        db,
        "achievements",
        achievement.id
      ).withConverter(achievementConverter);
      await setDoc(achievementRef, achievement);
      console.log(`Achievement ${achievement.id} created successfully`);
      return true;
    } catch (error) {
      console.error("Error creating achievement:", error);
      return false;
    }
  };
  
  /**
   * Retrieve an Achievement document from Firestore by its id.
   * @param id - The unique identifier of the achievement.
   * @returns The Achievement object if found, otherwise null.
   */
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
  
  /**
   * Update an existing Achievement document.
   * @param id - The unique identifier of the achievement to update.
   * @param updatedFields - Partial fields of Achievement to update.
   * @returns True if the update was successful, false otherwise.
   */
  export const updateAchievement = async (
    id: string,
    updatedFields: Partial<Achievement>
  ): Promise<boolean> => {
    try {
      const achievementRef = doc(db, "achievements", id);
      await updateDoc(achievementRef, updatedFields);
      console.log(`Achievement ${id} updated successfully`);
      return true;
    } catch (error) {
      console.error("Error updating achievement:", error);
      return false;
    }
  };
  
  /**
   * Retrieve all Achievement documents from Firestore.
   * @returns An array of Achievement objects.
   */
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