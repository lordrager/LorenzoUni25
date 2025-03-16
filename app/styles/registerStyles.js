// app/styles/registerStyles.js
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const RegisterStyles = StyleSheet.create({
  // Main container with gradient background
  gradientContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  // For web or platforms where LinearGradient may not be available
  gradientFallback: {
    backgroundColor: '#4dc9ff', // Sky blue fallback
  },
  
  // Custom form input styles specifically for registration
  registerInput: {
    width: '95%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    marginBottom: 15,
    fontSize: 16,
  },
  
  // Custom button style for registration
  registerButton: {
    width: '95%',
    height: 50,
    backgroundColor: '#00bcd4', // Turquoise color
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  
  // Custom text styles for registration screen
  registerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // Password input container
  passwordContainer: {
    width: '95%',
    position: 'relative',
    marginBottom: 15,
  },
  
  // Card container for the form
  formCard: {
    width: '95%',
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
});

// Helper component for creating a gradient background
export const GradientBackground = ({ children, style }) => {
  if (Platform.OS === 'web' && !LinearGradient) {
    // Fallback for web if LinearGradient is not available
    return (
      <View style={[RegisterStyles.gradientFallback, style]}>
        {children}
      </View>
    );
  }
  
  return (
    <LinearGradient
      colors={['#4dc9ff', '#00bfa5']} // Sky blue to turquoise green
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[RegisterStyles.gradientContainer, style]}
    >
      {children}
    </LinearGradient>
  );
};

export default RegisterStyles;