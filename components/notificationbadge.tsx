import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getUnreadNotificationCount, setCurrentUserId } from '@/class/Notification';

interface NotificationBadgeProps {
  color?: string;
  size?: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  color = '#f44336', 
  size = 18 
}) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const fetchUnreadCount = async (uid: string) => {
      try {
        // Set the user ID in notification service
        setCurrentUserId(uid);
        
        // Get unread notification count
        const unreadCount = await getUnreadNotificationCount();
        setCount(unreadCount);
      } catch (error) {
        console.error('Error fetching unread notification count:', error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUnreadCount(user.uid);
      } else {
        setCount(0);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Only show badge if there are unread notifications and not loading
  if (loading || count === 0) {
    return null;
  }

  return (
    <View style={[
      styles.badge,
      { 
        backgroundColor: color,
        width: size,
        height: size,
        borderRadius: size / 2,
      }
    ]}>
      {count > 9 ? (
        <Text style={styles.text}>9+</Text>
      ) : (
        <Text style={styles.text}>{count}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
});

export default NotificationBadge;