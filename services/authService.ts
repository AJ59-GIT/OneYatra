
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
import { doc, getDoc, setDoc, getDocFromServer, onSnapshot } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const CURRENT_USER_KEY = 'oneyatra_current_user';

// ... (existing helper functions)

export const setupRecaptcha = (containerId: string) => {
  if (!auth) return null;
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
  if (!auth) return { success: false, message: "Firebase Auth not initialized." };
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

// Helper to remove undefined values for Firestore
const sanitizeForFirestore = (data: any) => {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeForFirestore(sanitized[key]);
    }
  });
  return sanitized;
};

// Initialize sync from Firebase to LocalStorage with real-time updates
export const initAuthListener = (callback: (user: UserProfile | null, rawUser: User | null) => void) => {
  if (!auth) {
    console.warn("initAuthListener: Firebase Auth not initialized. Using local fallback.");
    const localData = localStorage.getItem(CURRENT_USER_KEY);
    if (localData) {
      try {
        const profile = JSON.parse(localData);
        callback(profile, null);
      } catch (e) {
        callback(null, null);
      }
    } else {
      callback(null, null);
    }
    return () => {}; // No-op unsubscribe
  }

  let unsubscribeFirestore: (() => void) | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    // Clean up previous Firestore listener if it exists
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
      unsubscribeFirestore = null;
    }

    if (user) {
      console.log("initAuthListener: Auth user detected:", user.uid);
      
      let profile: UserProfile = {
        email: user.email || '',
        name: user.displayName || 'User',
        role: (user.email === 'anjeet.cs23064@sstcollege.edu.in') ? 'ADMIN' : 'USER',
        preferences: {},
        addresses: [],
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      if (user.photoURL) {
        profile.avatar = user.photoURL;
      }

      // Set up real-time listener for Firestore profile
      if (db) {
        const docRef = doc(db, "users", user.uid);
        
        unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            console.log("initAuthListener: Profile update received from Firestore.");
            const data = docSnap.data() as UserProfile;
            const updatedProfile = { ...profile, ...data };
            
            if (typeof window !== 'undefined') {
              localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedProfile));
              localStorage.setItem('oneyatra_user', 'true');
            }
            callback(updatedProfile, user);
          } else {
            console.log("initAuthListener: No profile found in Firestore, using Auth defaults.");
            // Create initial profile if it doesn't exist
            setDoc(docRef, sanitizeForFirestore(profile), { merge: true })
              .catch(e => console.error("initAuthListener: Error creating initial profile:", e));
            
            if (typeof window !== 'undefined') {
              localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
              localStorage.setItem('oneyatra_user', 'true');
            }
            callback(profile, user);
          }
        }, (error) => {
          console.error("initAuthListener: Firestore listener error:", error);
          // Fallback to local storage or auth defaults on error
          callback(profile, user);
        });
      } else {
        // No DB, just use Auth info
        callback(profile, user);
      }
    } else {
      console.log("initAuthListener: No auth user.");
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem('oneyatra_user');
      }
      callback(null, null);
    }
  });

  return () => {
    unsubscribeAuth();
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
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
    return "This domain is not authorized in Firebase. Please add your Render URL to 'Authorized domains' in your Firebase Console (Authentication > Settings > Authorized domains).";
  }
  if (error.code === 'auth/invalid-api-key') {
    return "Invalid Firebase API Key. Please check your environment variables.";
  }
  if (error.code === 'auth/popup-closed-by-user') {
    return "The login popup was closed before completion. Please ensure popups are allowed for this site and try again. If the issue persists, check if your domain is authorized in Firebase.";
  }
  return error.message || "An unexpected error occurred.";
};

export const registerWithEmail = async (email: string, password: string, name: string): Promise<{ success: boolean; message?: string }> => {
  if (!auth) return { success: false, message: "Firebase Auth not initialized." };
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
  if (!auth) return { success: false, message: "Firebase Auth not initialized." };
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
  if (!auth) return { success: false, message: "Firebase Auth not initialized." };
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return { success: true, message: "Verification email resent!" };
  } catch (error: any) {
    return { success: false, message: handleFirebaseError(error) };
  }
};

export const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
  console.log("authService: loginWithGoogle called.");
  if (!auth || !googleProvider) {
    console.error("authService: loginWithGoogle failed - Auth not initialized.", { auth: !!auth, provider: !!googleProvider });
    return { success: false, message: "Firebase Auth not initialized." };
  }
  try {
    console.log("authService: Initiating signInWithPopup...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("authService: signInWithPopup successful.", { user: result.user.uid });
    return { success: true };
  } catch (error: any) {
    console.error("authService: loginWithGoogle failed.", error.code, error.message);
    return { success: false, message: handleFirebaseError(error) };
  }
};

export const updateUserProfile = async (profile: UserProfile): Promise<boolean> => {
  if (!auth || !auth.currentUser) return false;
  const user = auth.currentUser;
  if (!user) return false;

  // Optimistically update local storage so the UI reflects changes immediately
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
  }

  if (!db) return true; // If Firestore is not available, we just update local storage

  // Create a timeout promise
  const timeoutPromise = new Promise<boolean>((_, reject) => {
    setTimeout(() => reject(new Error("Firestore timeout")), 8000); // 8 second timeout
  });

  try {
    const updateTask = (async () => {
      // Update Firebase Auth profile
      await updateProfile(user, { 
        displayName: profile.name,
        photoURL: profile.avatar
      });

      // Update Firestore profile
      await setDoc(doc(db, "users", user.uid), sanitizeForFirestore(profile), { merge: true });
      return true;
    })();

    // Race the update task against the timeout
    return await Promise.race([updateTask, timeoutPromise]);
  } catch (error) {
    console.error("Failed to update profile in Firestore, but local changes saved:", error);
    // We return true if it was just a timeout because we already updated local storage
    // and the user shouldn't be blocked by a slow network.
    return true; 
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  if (!auth) return;
  await sendPasswordResetEmail(auth, email);
};

export const logoutUser = async () => {
  if (!auth) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem('oneyatra_user');
    }
    return;
  }
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

