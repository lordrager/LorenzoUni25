// @/utils/permissionUtils.js
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

// Track if permissions have been requested to avoid duplicate requests
let locationPermissionRequested = false;
let notificationPermissionRequested = false;

/**
 * Request location permissions and get current location
 * @param {function} setLocation - Function to set location state
 * @returns {Promise<void>}
 */
export const requestLocationPermission = async (setLocation) => {
  if (locationPermissionRequested) {
    return; // Already requested during this session
  }
  
  try {
    console.log("Requesting location permission for the first time");
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log("Location permission status:", status);
    
    locationPermissionRequested = true;
    
    if (status === "granted") {
      try {
        // Get location if permission granted
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        console.log("User location obtained:", loc.coords);
      } catch (locError) {
        console.error("Failed to get location:", locError);
      }
    }
  } catch (error) {
    console.error("Error requesting location permission:", error);
  }
};

/**
 * Request notification permissions
 * @returns {Promise<void>}
 */
export const requestNotificationPermission = async () => {
  if (notificationPermissionRequested) {
    return; // Already requested during this session
  }
  
  try {
    console.log("Requesting notification permission for the first time");
    const { status } = await Notifications.requestPermissionsAsync();
    console.log("Notification permission status:", status);
    
    notificationPermissionRequested = true;
    
    if (status === "granted") {
      console.log("Notification permission granted");
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
  }
};

/**
 * Check both location and notification permissions
 * @param {function} setLocation - Function to set location state
 * @returns {Promise<void>}
 */
export const checkPermissions = async (setLocation) => {
  try {
    await requestLocationPermission(setLocation);
    await requestNotificationPermission();
  } catch (error) {
    console.error("Error checking permissions:", error);
  }
};