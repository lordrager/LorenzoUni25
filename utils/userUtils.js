// @/utils/userUtils.js
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../app/firebaseConfig"; // Adjust path as needed

/**
 * Create or update user record in Firestore
 * @param {Object} user - Firebase auth user object
 * @returns {Promise<boolean>} True if new user was created, false if updated
 */
export const createOrUpdateUserInFirestore = async (user) => {
  try {
    const uid = user.uid;
    const userEmail = user.email;
    const displayName = user.displayName || userEmail.split('@')[0]; // Use email prefix if no display name
    const photoURL = user.photoURL || null;
    const providerData = user.providerData && user.providerData.length > 0 ? user.providerData[0] : null;
    const provider = providerData ? providerData.providerId : 'unknown';

    // Check if user document already exists
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Default tags for new users
      const defaultTags = ["Technology", "Sports", "Health", "Business"];
      
      // Create new user document
      await setDoc(userRef, {
        uid: uid,
        username: displayName,
        email: userEmail,
        photoURL: photoURL,
        provider: provider,
        tags: defaultTags,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
      
      console.log("New user created in Firestore:", uid);
      return true;
    } else {
      // Update existing user's last login
      await setDoc(userRef, {
        lastLoginAt: new Date()
      }, { merge: true });
      
      console.log("Existing user updated in Firestore:", uid);
      return false;
    }
  } catch (error) {
    console.error("Error creating/updating user in Firestore:", error);
    throw error;
  }
};

/**
 * Get user preferences (tags)
 * @param {string} uid - User ID
 * @returns {Promise<Array>} Array of user's preferred tags
 */
export const getUserPreferences = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.tags || [];
    }
    
    return [];
  } catch (error) {
    console.error("Error getting user preferences:", error);
    throw error;
  }
};

/**
 * Update user preferences (tags)
 * @param {string} uid - User ID
 * @param {Array} tags - Array of tags
 * @returns {Promise<void>}
 */
export const updateUserPreferences = async (uid, tags) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      tags: tags,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log("User preferences updated:", uid);
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
};