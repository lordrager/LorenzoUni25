import { 
    UserNotification, 
    addNotification, 
    createNotification, 
    updateUserNotification, 
    getUserNotifications as getUserNotificationsFromDB,
    markNotificationAsSeen,
  } from './User';
  import { doc, updateDoc } from "firebase/firestore";
  import { db } from "../app/firebaseConfig";
  
  // Keep track of the current user ID for the notification service
  let currentUserId: string | null = null;
  
  /**
   * Set the current user ID for the notification service
   * @param userId The user ID to set
   */
  export const setCurrentUserId = (userId: string): void => {
    console.log("Setting current user ID for notification service:", userId);
    currentUserId = userId;
  };
  
  /**
   * Get the current user ID
   * @returns The current user ID or null if not set
   */
  export const getCurrentUserId = (): string | null => {
    return currentUserId;
  };
  
  /**
   * Get all notifications for the current user
   * @returns Array of notifications
   */
  export const getUserNotifications = async (): Promise<UserNotification[]> => {
    if (!currentUserId) {
      console.error("No current user set for notifications");
      return [];
    }
    
    return await getUserNotificationsFromDB(currentUserId);
  };
  
  /**
   * Create and add a notification about an article
   * @param articleId The article ID
   * @param articleTitle The article title
   * @param description Optional custom description
   * @returns Success status
   */
  export const createArticleNotification = async (
    articleId: string,
    articleTitle: string,
    description?: string
  ): Promise<boolean> => {
    if (!currentUserId) {
      console.error("No current user set for notifications");
      return false;
    }
    
    const notificationText = description || `New article available: ${articleTitle}`;
    const notification = createNotification(notificationText, articleId);
    
    return await addNotification(currentUserId, notification);
  };
  
  /**
   * Create a notification for a liked article
   * @param articleId The article ID
   * @param articleTitle The article title
   * @param userId The user ID (optional, uses current user ID if not provided)
   * @returns Success status
   */
  export const createArticleLikedNotification = async (
    articleId: string,
    articleTitle: string,
    userId?: string
  ): Promise<boolean> => {
    const uid = userId || currentUserId;
    if (!uid) {
      console.error("No user ID provided for liked article notification");
      return false;
    }
    
    const description = `You liked the article: ${articleTitle}`;
    const notification = createNotification(description, articleId);
    
    return await addNotification(uid, notification);
  };
  
  /**
   * Create a notification for a disliked article
   * @param articleId The article ID
   * @param articleTitle The article title
   * @param userId The user ID (optional, uses current user ID if not provided)
   * @returns Success status
   */
  export const createArticleDislikedNotification = async (
    articleId: string,
    articleTitle: string,
    userId?: string
  ): Promise<boolean> => {
    const uid = userId || currentUserId;
    if (!uid) {
      console.error("No user ID provided for disliked article notification");
      return false;
    }
    
    const description = `You disliked the article: ${articleTitle}`;
    const notification = createNotification(description, articleId);
    
    return await addNotification(uid, notification);
  };
  
  /**
   * Clear all notifications for the current user
   * @returns Success status
   */
  export const clearAllNotifications = async (): Promise<boolean> => {
    if (!currentUserId) {
      console.error("No current user set for notifications");
      return false;
    }
    
    try {
      const userRef = doc(db, "users", currentUserId);
      await updateDoc(userRef, {
        notifications: []
      });
      console.log(`All notifications cleared for user ${currentUserId}`);
      return true;
    } catch (error) {
      console.error("Error clearing notifications:", error);
      return false;
    }
  };
  
  /**
   * Add mock notifications for testing purposes
   * @param count Number of mock notifications to add
   * @returns Success status
   */
  export const addMockNotifications = async (count: number = 3): Promise<boolean> => {
    if (!currentUserId) {
      console.error("No current user set for notifications");
      return false;
    }
    
    try {
      const topics = [
        "Quantum Computing Breakthrough",
        "New AI Research Published",
        "Space Exploration Update",
        "Climate Change Study Released",
        "Technology Innovation Award"
      ];
      
      const descriptions = [
        "Scientists successfully use a quantum computer to break previously thought to be uncrackable encryption, raising security concerns.",
        "A new AI model demonstrates human-like reasoning capabilities in complex problem-solving scenarios.",
        "Mars rover discovers potential evidence of ancient microbial life in Jezero crater.",
        "Global temperatures reach record high for the fifth consecutive year according to new climate data.",
        "Revolutionary renewable energy technology wins prestigious international innovation award."
      ];
      
      // Generate mock notifications
      for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * topics.length);
        const now = new Date();
        const minutesAgo = Math.floor(Math.random() * 60);
        now.setMinutes(now.getMinutes() - minutesAgo);
        
        const mockNotification: UserNotification = {
          id: `notification_${now.getTime()}_${Math.random().toString(36).substring(2, 11)}`,
          date: now.toISOString(),
          description: descriptions[index],
          isSeen: false,
          // Some notifications have newsId, some don't
          newsId: Math.random() > 0.3 ? `mock_article_${i}` : undefined
        };
        
        await addNotification(currentUserId, mockNotification);
      }
      
      console.log(`Added ${count} mock notifications for user ${currentUserId}`);
      return true;
    } catch (error) {
      console.error("Error adding mock notifications:", error);
      return false;
    }
  };