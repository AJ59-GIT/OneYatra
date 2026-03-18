
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
import { 
  getFirestore, 
  getDocFromServer, 
  doc, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import firebaseConfigJson from "../firebase-applet-config.json";

// Use environment variables for configuration, supporting both Vite and Node.js
const getEnv = (key: string) => {
  // 1. Check process.env (Node.js)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // 2. Check import.meta.env (Vite)
  // @ts-ignore - import.meta.env is Vite specific
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  
  // 3. Fallback to firebase-applet-config.json for local/preview development
  const mapping: Record<string, string> = {
    'VITE_FIREBASE_API_KEY': 'apiKey',
    'VITE_FIREBASE_AUTH_DOMAIN': 'authDomain',
    'VITE_FIREBASE_PROJECT_ID': 'projectId',
    'VITE_FIREBASE_STORAGE_BUCKET': 'storageBucket',
    'VITE_FIREBASE_MESSAGING_SENDER_ID': 'messagingSenderId',
    'VITE_FIREBASE_APP_ID': 'appId',
    'VITE_FIREBASE_MEASUREMENT_ID': 'measurementId',
    'VITE_FIREBASE_FIRESTORE_DATABASE_ID': 'firestoreDatabaseId'
  };
  
  const mappedKey = mapping[key];
  if (mappedKey && firebaseConfigJson && (firebaseConfigJson as any)[mappedKey]) {
    return (firebaseConfigJson as any)[mappedKey];
  }
  
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

const firestoreDatabaseId = getEnv('VITE_FIREBASE_FIRESTORE_DATABASE_ID') || '(default)';

console.log("Firebase Config Initialization:", {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey,
  databaseId: firestoreDatabaseId
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings for better reliability in iframe/preview environments
// Note: initializeFirestore can only be called once.
let db: any;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    experimentalForceLongPolling: true, // Force long polling to bypass potential WebSocket issues
  }, firestoreDatabaseId);
} catch (e) {
  console.warn("Firestore already initialized, using getFirestore fallback");
  db = getFirestore(app, firestoreDatabaseId);
}

// Initialize Analytics (safe check for browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Export Auth
export const auth = getAuth(app);
export { db };
export const googleProvider = new GoogleAuthProvider();
export const emailProvider = new EmailAuthProvider();

// Validate Connection to Firestore (Critical Constraint)
async function testConnection() {
  try {
    // Use getDocFromServer to test real connection
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error.message?.includes('offline') || error.code === 'unavailable') {
      console.error("CRITICAL: Please check your Firebase configuration. The client is offline.");
    }
    // Skip logging for other errors (like permission denied), as this is simply a connection test.
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

export { analytics };
export default app;
