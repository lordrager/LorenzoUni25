import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection, 
    query, 
    getDocs, 
    arrayUnion, 
    arrayRemove, 
    serverTimestamp, 
    Timestamp 
  } from "firebase/firestore";
  import { db } from "../app/firebaseConfig";
  import { getUser } from "./User";
  import * as NotificationsExpo from 'expo-notifications';
  import Constants from 'expo-constants';
  import { Platform } from 'react-native';
  
  /**
   * Notification Class
   *
   * Represents a notification with a unique id, title, message, timestamp,
   * type, additional data, and read status.
   */
  export class Notification {
    constructor(
      public id: string,
      public title: string,
      public message: string,
      public timestamp: any, // Firebase Timestamp or Date
      public type: 'article' | 'achievement' | 'system' | string,
      public data: {
        articleId?: string;
        articleTitle?: string;
        achievementName?: string;
        expPoints?: number;
        action?: string;
        [key: string]: any; // Allow other custom properties
      } = {},
      public read: boolean = false
    ) {}
  }
  
  /**
   * Firestore Data Converter for Notification.
   *
   * This converter ensures that Notification objects are properly formatted
   * when being written to or read from Firestore.
   */
  const notificationConverter = {
    toFirestore: (notification: Notification) => ({
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp || serverTimestamp(),
      type: notification.type,
      data: notification.data || {},
      read: notification.read || false,
    }),
    fromFirestore: (snapshot: any, options: any): Notification => {
      const data = snapshot.data(options);
      return new Notification(
        snapshot.id,
        data.title,
        data.message,
        data.timestamp,
        data.type,
        data.data || {},
        data.read || false
      );
    },
  };
  
  // Store for the current user ID and push token
  let currentUserId: string | null = null;
  let currentPushToken: string | null = null;
  
  /**
   * Set the current user ID for notification operations
   * @param userId - The user ID to set
   */
  export const setCurrentUserId = (userId: string): void => {
    currentUserId = userId;
    // Try to register push notifications when user ID is set
    configurePushNotifications();
  };
  
  /**
   * Get the current user ID
   * @returns The current user ID or null if not set
   */
  export const getCurrentUserId = (): string | null => {
    return currentUserId;
  };
  
  /**
   * Configure push notifications for this device
   * @returns Promise resolving to true if successful, false otherwise
   */
  export const configurePushNotifications = async (): Promise<boolean> => {
    try {
      // Request permission (iOS)
      if (Platform.OS === 'ios') {
        const { status: existingStatus } = await NotificationsExpo.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await NotificationsExpo.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Push notification permissions not granted!');
          return false;
        }
      }
  
      // Set notification handler
      NotificationsExpo.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      
      // Get the push token for this device
      const tokenData = await NotificationsExpo.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      }).catch(err => {
        console.log('Error getting push token:', err);
        return null;
      });
      
      if (tokenData) {
        currentPushToken = tokenData.data;
        console.log('Push token:', currentPushToken);
        
        // Save token to user's record if user ID is set
        if (currentUserId) {
          await savePushToken(currentUserId, currentPushToken);
        }
      }
  
      return true;
    } catch (error) {
      console.error('Error configuring push notifications:', error);
      return false;
    }
  };
  
  /**
   * Save a push token to a user's record
   * @param userId - The user ID
   * @param token - The push token
   */
  export const savePushToken = async (userId: string, token: string): Promise<void> => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        pushTokens: arrayUnion(token)
      });
      console.log(`Push token saved for user ${userId}`);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };
  
  /**
   * Create and add a notification to a user's notifications array
   * @param title - The notification title
   * @param message - The notification message
   * @param type - The notification type
   * @param data - Optional data to include with the notification
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to the notification ID if successful, null otherwise
   */
  export const createNotification = async (
    title: string, 
    message: string, 
    type: string,
    data: any = {},
    userId?: string
  ): Promise<string | null> => {
    // Use provided userId or the currentUserId
    const targetUserId = userId || currentUserId;
    
    if (!targetUserId) {
      console.error('No user ID provided for notification');
      return null;
    }
    
    try {
      // Create a unique ID for this notification
      const notificationId = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Create notification object
      const notification = new Notification(
        notificationId,
        title,
        message,
        serverTimestamp(), // Use Firebase server timestamp
        type,
        data,
        false // not read initially
      );
  
      // Add to user's notifications in Firestore
      const userRef = doc(db, "users", targetUserId);
      await updateDoc(userRef, {
        notifications: arrayUnion(notificationConverter.toFirestore(notification))
      });
      
      // Send a push notification
      await sendPushNotification(targetUserId, title, message, data);
      
      console.log(`Notification ${notificationId} added for user ${targetUserId}`);
      return notificationId;
    } catch (error) {
      console.error("Error adding notification:", error);
      return null;
    }
  };
  
  /**
   * Send a push notification to a user's devices
   * @param userId - The user ID
   * @param title - The notification title
   * @param message - The notification message
   * @param data - Optional data to include with the notification
   * @returns Promise resolving to true if successful, false otherwise
   */
  export const sendPushNotification = async (
    userId: string,
    title: string,
    message: string,
    data: any = {}
  ): Promise<boolean> => {
    try {
      // In a production app, you would get the user's push tokens from your database
      // and send the notification to each token
      
      // For now, we'll just trigger a local notification
      await NotificationsExpo.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data,
        },
        trigger: null, // Send immediately
      });
      
      console.log("Local notification scheduled");
      return true;
    } catch (error) {
      console.error("Error scheduling push notification:", error);
      return false;
    }
  };
  
  /**
   * Mark a notification as read
   * @param notificationId - The notification ID
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to true if successful, false otherwise
   */
  export const markNotificationAsRead = async (
    notificationId: string,
    userId?: string
  ): Promise<boolean> => {
    // Use provided userId or the currentUserId
    const targetUserId = userId || currentUserId;
    
    if (!targetUserId) {
      console.error('No user ID provided for marking notification as read');
      return false;
    }
    
    try {
      // Get current user data to find the notification
      const user = await getUser(targetUserId);
      if (!user || !user.notifications) {
        console.log("User or notifications not found");
        return false;
      }
      
      // Find the notification to update
      const notificationIndex = user.notifications.findIndex(n => n.id === notificationId);
      if (notificationIndex === -1) {
        console.log("Notification not found");
        return false;
      }
      
      // Create updated notification
      const updatedNotification = {
        ...user.notifications[notificationIndex],
        read: true
      };
      
      // Remove the old notification and add the updated one
      const userRef = doc(db, "users", targetUserId);
      await updateDoc(userRef, {
        notifications: arrayRemove(user.notifications[notificationIndex])
      });
      await updateDoc(userRef, {
        notifications: arrayUnion(updatedNotification)
      });
      
      console.log(`Notification ${notificationId} marked as read`);
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  };
  
  /**
   * Get all notifications for a user
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to an array of notifications
   */
  export const getUserNotifications = async (userId?: string): Promise<Notification[]> => {
    // Use provided userId or the currentUserId
    const targetUserId = userId || currentUserId;
    
    if (!targetUserId) {
      console.error('No user ID provided for getting notifications');
      return [];
    }
    
    try {
      const user = await getUser(targetUserId);
      if (!user || !user.notifications) {
        return [];
      }
      
      // Convert raw data to Notification objects
      const notifications = user.notifications.map(n => 
        new Notification(
          n.id || `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          n.title,
          n.message,
          n.timestamp,
          n.type,
          n.data || {},
          n.read || false
        )
      );
      
      // Sort notifications by timestamp (newest first)
      const sortedNotifications = [...notifications].sort((a, b) => {
        // Handle different timestamp formats
        const timeA = a.timestamp instanceof Timestamp 
          ? a.timestamp.toDate().getTime() 
          : new Date(a.timestamp).getTime();
        
        const timeB = b.timestamp instanceof Timestamp 
          ? b.timestamp.toDate().getTime() 
          : new Date(b.timestamp).getTime();
        
        return timeB - timeA;
      });
      
      return sortedNotifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  };
  
  /**
   * Create an article notification
   * @param articleId - The article ID
   * @param articleTitle - The article title
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to the notification ID if successful, null otherwise
   */
  export const createArticleNotification = async (
    articleId: string,
    articleTitle: string,
    userId?: string
  ): Promise<string | null> => {
    return createNotification(
      "New Article Available",
      `Check out "${articleTitle}" based on your interests`,
      "article",
      {
        articleId,
        articleTitle
      },
      userId
    );
  };
  
  /**
   * Create a notification for a liked article
   * @param articleId - The article ID
   * @param articleTitle - The article title  
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to the notification ID if successful, null otherwise
   */
  export const createArticleLikedNotification = async (
    articleId: string,
    articleTitle: string,
    userId?: string
  ): Promise<string | null> => {
    return createNotification(
      "Article Liked",
      `You liked "${articleTitle}"`,
      "article",
      {
        articleId,
        articleTitle,
        action: "like"
      },
      userId
    );
  };
  
  /**
   * Create a notification for a disliked article
   * @param articleId - The article ID
   * @param articleTitle - The article title  
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to the notification ID if successful, null otherwise
   */
  export const createArticleDislikedNotification = async (
    articleId: string,
    articleTitle: string,
    userId?: string
  ): Promise<string | null> => {
    return createNotification(
      "Article Disliked",
      `You disliked "${articleTitle}"`,
      "article",
      {
        articleId,
        articleTitle,
        action: "dislike"
      },
      userId
    );
  };
  
  /**
   * Create an achievement notification
   * @param achievementName - The achievement name
   * @param expPoints - The experience points gained
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to the notification ID if successful, null otherwise
   */
  export const createAchievementNotification = async (
    achievementName: string,
    expPoints: number,
    userId?: string
  ): Promise<string | null> => {
    return createNotification(
      "Achievement Unlocked!",
      `You've earned "${achievementName}" and gained ${expPoints} XP`,
      "achievement",
      {
        achievementName,
        expPoints
      },
      userId
    );
  };
  
  /**
   * Clear all notifications for a user
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to true if successful, false otherwise
   */
  export const clearAllNotifications = async (userId?: string): Promise<boolean> => {
    // Use provided userId or the currentUserId
    const targetUserId = userId || currentUserId;
    
    if (!targetUserId) {
      console.error('No user ID provided for clearing notifications');
      return false;
    }
    
    try {
      const userRef = doc(db, "users", targetUserId);
      await updateDoc(userRef, {
        notifications: []
      });
      
      console.log(`All notifications cleared for user ${targetUserId}`);
      return true;
    } catch (error) {
      console.error("Error clearing notifications:", error);
      return false;
    }
  };
  
  /**
   * Get the count of unread notifications for a user
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to the count of unread notifications
   */
  export const getUnreadNotificationCount = async (userId?: string): Promise<number> => {
    // Use provided userId or the currentUserId
    const targetUserId = userId || currentUserId;
    
    if (!targetUserId) {
      console.error('No user ID provided for getting unread notification count');
      return 0;
    }
    
    try {
      const user = await getUser(targetUserId);
      if (!user || !user.notifications) {
        return 0;
      }
      
      const unreadCount = user.notifications.filter(n => !n.read).length;
      return unreadCount;
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      return 0;
    }
  };
  
  /**
   * Save notification preferences for a user
   * @param preferences - The notification preferences object
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to true if successful, false otherwise
   */
  export const saveNotificationPreferences = async (
    preferences: {
      articles: boolean;
      achievements: boolean;
      system: boolean;
      emailNotifications: boolean;
      pushNotifications: boolean;
    },
    userId?: string
  ): Promise<boolean> => {
    // Use provided userId or the currentUserId
    const targetUserId = userId || currentUserId;
    
    if (!targetUserId) {
      console.error('No user ID provided for saving notification preferences');
      return false;
    }
    
    try {
      const userRef = doc(db, "users", targetUserId);
      await updateDoc(userRef, {
        notificationPreferences: preferences
      });
      
      console.log(`Notification preferences saved for user ${targetUserId}`);
      return true;
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      return false;
    }
  };
  
  /**
   * Get notification preferences for a user
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to the notification preferences object
   */
  export const getNotificationPreferences = async (userId?: string): Promise<any> => {
    // Use provided userId or the currentUserId
    const targetUserId = userId || currentUserId;
    
    if (!targetUserId) {
      console.error('No user ID provided for getting notification preferences');
      return null;
    }
    
    try {
      const user = await getUser(targetUserId);
      if (!user) {
        return null;
      }
      
      // Return preferences or default values
      return user.notificationPreferences || {
        articles: true,
        achievements: true,
        system: true,
        emailNotifications: true,
        pushNotifications: true
      };
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      return null;
    }
  };
  
  /**
   * Delete a specific notification
   * @param notificationId - The notification ID to delete
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to true if successful, false otherwise
   */
  export const deleteNotification = async (
    notificationId: string, 
    userId?: string
  ): Promise<boolean> => {
    // Use provided userId or the currentUserId
    const targetUserId = userId || currentUserId;
    
    if (!targetUserId) {
      console.error('No user ID provided for deleting notification');
      return false;
    }
    
    try {
      // Get current user data to find the notification
      const user = await getUser(targetUserId);
      if (!user || !user.notifications) {
        console.log("User or notifications not found");
        return false;
      }
      
      // Find the notification to delete
      const notification = user.notifications.find(n => n.id === notificationId);
      if (!notification) {
        console.log("Notification not found");
        return false;
      }
      
      // Remove the notification
      const userRef = doc(db, "users", targetUserId);
      await updateDoc(userRef, {
        notifications: arrayRemove(notification)
      });
      
      console.log(`Notification ${notificationId} deleted`);
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  };
  
  /**
   * Add mock notifications to a user for testing
   * @param count - The number of mock notifications to add
   * @param userId - The user ID (uses the current user ID if not provided)
   * @returns Promise resolving to true if successful, false otherwise
   */
  export const addMockNotifications = async (count: number = 7, userId?: string): Promise<boolean> => {
    // Use provided userId or the currentUserId
    const targetUserId = userId || currentUserId;
    
    if (!targetUserId) {
      console.error('No user ID provided for adding mock notifications');
      return false;
    }
    
    try {
      // Add article notifications
      const articleCount = Math.floor(count / 2);
      for (let i = 0; i < articleCount; i++) {
        const articleId = `mock_article_${i}`;
        const articleTitle = `Mock Article ${i}`;
        await createArticleNotification(articleId, articleTitle, targetUserId);
      }
      
      // Add achievement notifications
      const achievementCount = Math.floor(count / 4);
      const achievements = [
        { name: 'First Win', points: 50 },
        { name: 'News Expert', points: 100 },
        { name: 'Dedicated Reader', points: 75 },
        { name: 'Quick Learner', points: 25 },
        { name: 'Feedback Provider', points: 60 }
      ];
      
      for (let i = 0; i < achievementCount; i++) {
        const achievement = achievements[i % achievements.length];
        await createAchievementNotification(
          achievement.name,
          achievement.points,
          targetUserId
        );
      }
      
      // Add system notifications
      const systemCount = count - articleCount - achievementCount;
      const systemMessages = [
        'Your streak is now 7 days! Keep it up!',
        'Welcome back! You\'ve been missed.',
        'You\'ve leveled up to level 5!',
        'New features have been added to the app.',
        'Your account has been verified successfully.'
      ];
      
      for (let i = 0; i < systemCount; i++) {
        const message = systemMessages[i % systemMessages.length];
        await createNotification(
          'System Notification',
          message,
          'system',
          {},
          targetUserId
        );
      }
      
      console.log(`Added ${count} mock notifications to user ${targetUserId}`);
      return true;
    } catch (error) {
      console.error("Error adding mock notifications:", error);
      return false;
    }
  };