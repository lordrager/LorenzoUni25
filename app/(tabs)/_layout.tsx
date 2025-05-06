import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Tabs component with theme awareness
function TabLayoutContent() {
  const { darkMode } = useTheme();
  
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#00bcd4',
      tabBarInactiveTintColor: darkMode ? '#999999' : '#666666',
      tabBarStyle: {
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderTopColor: darkMode ? '#333333' : '#e0e0e0',
      },
      headerShown: false,
    }}>
      <Tabs.Screen
        name="user_home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="user_notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="bell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="user_search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="user_achievments"
        options={{
          title: 'Achievments',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="trophy" color={color} />,
        }}
      />
      <Tabs.Screen
        name="user_settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

// Main layout component that wraps everything with ThemeProvider
export default function TabLayout() {
  return (
    <ThemeProvider>
      <TabLayoutContent />
    </ThemeProvider>
  );
}