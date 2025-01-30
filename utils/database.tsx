import { getAuth, signInWithEmailAndPassword } from "firebase/auth";


export const checkUserExists = async (email, password) => {
    const auth = getAuth();
    
    try {
      // Attempt to sign in the user
      await signInWithEmailAndPassword(auth, email, password);
      return true; // User exists and credentials are correct
    } catch (error) {
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        return false; // User does not exist or password is incorrect
      }
      throw error; // Other errors (e.g., network issues)
    }
};