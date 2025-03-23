// @/styles/loginStyles.js
import { StyleSheet } from 'react-native';

const loginStyles = StyleSheet.create({
  mainContainer: {
    height: '100%',
  },
  formCard: {
    width: '95%',
    height: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderTopWidth: 5,
    borderTopColor: '#00bcd4',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 0,
  },
  formHeader: {
    backgroundColor: '#00bcd4',
    width: '100%',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1
  },
  formHeaderText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  formBody: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(240, 248, 255, 0.5)', // Light blue background
  },
  formInput: {
    width: '95%',
    marginBottom: 20,
    height: 55,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cde1f9',
    borderRadius: 8,
    shadowColor: '#a6c8ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  passwordContainer: {
    width: '95%',
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
    shadowColor: '#a6c8ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    paddingRight: 40, // Space for the eye icon
    height: 55,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cde1f9',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
    padding: 10,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginRight: 10,
  },
  forgotPasswordText: {
    color: '#00bcd4',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    width: '95%',
    height: 55,
    backgroundColor: '#00bcd4', // Turquoise color
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: { 
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
    color: '#fff',
    textAlign: 'center'
  },
  registerButton: {
    width: '95%',
    height: 55,
    backgroundColor: '#555', // Darker color for register button
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 15,
  },
  divider: {
    width: '95%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cde1f9',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#6c757d',
    fontWeight: '600',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  socialButton: {
    width: 55,
    height: 55,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  gradientBackground: {
    colors: ['#4dc9ff', '#00bfa5'], // Sky blue to turquoise green
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  }
});

export default loginStyles;