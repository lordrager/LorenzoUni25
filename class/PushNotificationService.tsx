import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../app/firebaseConfig';
import { UserNotification } from './User';

// Keep track of notification listener, subscription, and token
let notificationListener: any = null;
let responseListener: any = null;
let userNotificationsUnsubscribe: any = null;
let expoPushToken: string | null = null;

/**
 * Register for push notifications
 * @returns The Expo push token for this device
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token;

  // Must be a physical device (not simulator/emulator) for push notifications
  if (Device.isDevice) {
    // Check if we have permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If don't have permission yet, ask for it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // If still don't have permission, return null
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }
    
    // Get the token from Expo's push notification service
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || '1234567890', // Replace with your project ID
    })).data;
    
    expoPushToken = token;
    console.log('Expo push token:', token);
  } else {
    console.warn('Must use physical device for Push Notifications');
    return null;
  }

  // Special handling for Android devices
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00bcd4',
    });
  }

  return token;
}

/**
 * Store the push token in the user's document
 * @param userId The user's ID
 * @param token The push token to store
 */
export async function storePushToken(userId: string, token: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      pushToken: token
    });
    console.log(`Push token stored for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error storing push token:", error);
    return false;
  }
}

/**
 * Set up notification listeners
 * @param onNotification Function to call when a notification is received
 * @param onNotificationResponse Function to call when user taps on a notification
 */
export function setupNotificationListeners(
  onNotification: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
) {
  // When app is foregrounded
  notificationListener = Notifications.addNotificationReceivedListener(
    onNotification
  );
  
  // When notification is tapped
  responseListener = Notifications.addNotificationResponseReceivedListener(
    onNotificationResponse
  );
  
  return () => {
    // Cleanup
    if (notificationListener) Notifications.removeNotificationSubscription(notificationListener);
    if (responseListener) Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Listen for changes to the user's notifications in Firestore
 * @param userId The user's ID
 * @param lastNotificationDate Last notification timestamp to filter new ones
 * @param onNewNotification Callback function when new notification is detected
 */
export function startNotificationsListener(
  userId: string,
  lastNotificationDate: string | null,
  onNewNotification: (notification: UserNotification) => void
) {
  // Clean up existing listener if there is one
  if (userNotificationsUnsubscribe) {
    userNotificationsUnsubscribe();
  }
  
  console.log(`Starting notifications listener for user ${userId}`);
  console.log(`Last notification date: ${lastNotificationDate}`);
  
  // Set up listener on the user document
  const userRef = doc(db, "users", userId);
  
  let lastDate = lastNotificationDate;
  
  userNotificationsUnsubscribe = onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const userData = doc.data();
      const notifications: UserNotification[] = userData.notifications || [];
      
      // Sort by date, newest first
      const sortedNotifications = [...notifications].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      // Find any notifications newer than lastNotificationDate
      if (sortedNotifications.length > 0) {
        let newNotifications = [];
        
        if (lastDate) {
          newNotifications = sortedNotifications.filter(notification => {
            return new Date(notification.date).getTime() > new Date(lastDate).getTime();
          });
        } else {
          // If no previous date, just take the newest one
          newNotifications = [sortedNotifications[0]];
        }
        
        // Trigger callback for each new notification
        if (newNotifications.length > 0) {
          console.log(`Found ${newNotifications.length} new notifications`);
          
          newNotifications.forEach(notification => {
            console.log(`Processing notification: ${notification.id}`);
            onNewNotification(notification);
          });
          
          // Update last notification date
          lastDate = sortedNotifications[0].date;
        }
      }
    }
  }, error => {
    console.error("Error listening to notifications:", error);
  });
  
  // Return unsubscribe function
  return userNotificationsUnsubscribe;
}

/**
 * Stop listening for notifications
 */
export function stopNotificationsListener() {
  if (userNotificationsUnsubscribe) {
    userNotificationsUnsubscribe();
    userNotificationsUnsubscribe = null;
    console.log("Stopped notification listener");
  }
}

/**
 * Send a local notification
 * @param title The notification title
 * @param body The notification body
 * @param data Any additional data to attach to the notification
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data: any = {}
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Show immediately
    });
    console.log(`Sent local notification: ${title}`);
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
}

/**
 * Clean up all notification-related resources
 */
export function cleanupNotifications() {
  stopNotificationsListener();
  
  if (notificationListener) {
    Notifications.removeNotificationSubscription(notificationListener);
    notificationListener = null;
  }
  
  if (responseListener) {
    Notifications.removeNotificationSubscription(responseListener);
    responseListener = null;
  }
  
  console.log("Cleaned up all notification resources");
}