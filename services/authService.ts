
import { UserProfile } from "../types";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { doc, getDoc, setDoc, getDocFromServer } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";

const CURRENT_USER_KEY = 'oneyatra_current_user';

// ... (existing helper functions)

export const setupRecaptcha = (containerId: string) => {
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }
  return (window as any).recaptchaVerifier;
};

export const loginWithPhone = async (phoneNumber: string, appVerifier: any): Promise<{ success: boolean; confirmationResult?: ConfirmationResult; message?: string }> => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return { success: true, confirmationResult };
  } catch (error: any) {
    return { success: false, message: handleFirebaseError(error) };
  }
};

export const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string): Promise<{ success: boolean; message?: string }> => {
  try {
    await confirmationResult.confirm(otp);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: handleFirebaseError(error) };
  }
};

// Initialize sync from Firebase to LocalStorage
export const initAuthListener = (callback: (user: UserProfile | null, rawUser: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      let profile: UserProfile = {
        email: user.email || '',
        name: user.displayName || 'User',
        avatar: user.photoURL || undefined,
        preferences: {}
      };

      // Try to fetch full profile from Firestore
      try {
        const docRef = doc(db, "users", user.uid);
        // Use getDoc to allow for offline persistence/cache fallback
        console.log("Fetching user profile from Firestore for UID:", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log("Profile found in Firestore.");
          profile = { ...profile, ...docSnap.data() as UserProfile };
        } else {
          console.log("No profile found in Firestore, creating one.");
          // Create initial profile if it doesn't exist
          await setDoc(docRef, profile);
        }
      } catch (e: any) {
        if (e.message?.includes('offline') || e.code === 'unavailable') {
          console.warn("Firestore is offline/unavailable. Using local profile data if available.");
          // If it's an offline error, we still want to use the local profile if available
          const localData = localStorage.getItem(CURRENT_USER_KEY);
          if (localData) {
            try {
              profile = JSON.parse(localData);
            } catch (err) {}
          }
        } else {
          console.error("Failed to fetch profile from Firestore:", e.code, e.message || e);
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
        localStorage.setItem('oneyatra_user', 'true');
      }
      callback(profile, user);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem('oneyatra_user');
      }
      callback(null, null);
    }
  });
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const checkPasswordStrength = (password: string): { score: number; message: string; color: string } => {
  let score = 0;
  if (password.length > 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  switch (score) {
    case 0:
    case 1:
      return { score: 1, message: 'Weak', color: 'bg-red-500' };
    case 2:
      return { score: 2, message: 'Fair', color: 'bg-yellow-500' };
    case 3:
      return { score: 3, message: 'Good', color: 'bg-blue-500' };
    case 4:
      return { score: 4, message: 'Strong', color: 'bg-green-500' };
    default:
      return { score: 0, message: '', color: 'bg-gray-200' };
  }
};

const handleFirebaseError = (error: any): string => {
  if (error.code === 'auth/requests-from-referer-blocked') {
    return "This domain is not authorized in Firebase. Please add this URL to 'Authorized domains' in your Firebase Console.";
  }
  if (error.code === 'auth/invalid-api-key') {
    return "Invalid Firebase API Key. Please check your environment variables.";
  }
  return error.message || "An unexpected error occurred.";
};

export const registerWithEmail = async (email: string, password: string, name: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await sendEmailVerification(userCredential.user);
    return { success: true, message: "Registration successful! Verification email sent." };
  } catch (error: any) {
    return { success: false, message: handleFirebaseError(error) };
  }
};

export const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (!userCredential.user.emailVerified) {
      return { success: false, message: "Please verify your email before logging in." };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, message: handleFirebaseError(error) };
  }
};

export const resendVerificationEmail = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return { success: true, message: "Verification email resent!" };
  } catch (error: any) {
    return { success: false, message: handleFirebaseError(error) };
  }
};

export const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    await signInWithPopup(auth, googleProvider);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: handleFirebaseError(error) };
  }
};

export const updateUserProfile = async (profile: UserProfile): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    // Update Firebase Auth profile
    await updateProfile(user, { 
      displayName: profile.name,
      photoURL: profile.avatar
    });

    // Update Firestore profile
    await setDoc(doc(db, "users", user.uid), profile, { merge: true });

    // Update local storage as well
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
    }
    return true;
  } catch (error) {
    console.error("Failed to update profile", error);
    return false;
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const logoutUser = async () => {
  await signOut(auth);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('oneyatra_user');
  }
};

export const getCurrentUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to parse user data", e);
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
};

export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('oneyatra_user');
  }
};

