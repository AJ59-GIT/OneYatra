
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

// We use a dynamic import for the config file to prevent build failures 
// on platforms like Render where this file might not be present.
let firebaseConfigJson: any = {};
try {
  // @ts-ignore - Dynamic import might fail if file is missing
  const configModule = await import("../firebase-applet-config.json");
  firebaseConfigJson = configModule.default || configModule;
} catch (e) {
  console.warn("firebase-applet-config.json not found, relying on environment variables.");
}

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
    const val = (firebaseConfigJson as any)[mappedKey];
    if (val && val !== "TODO_KEYHERE" && val !== "TODO_PROJECT_ID") {
      return val;
    }
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
let db: any;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    experimentalForceLongPolling: true,
  }, firestoreDatabaseId);
  console.log("Firestore initialized with long polling and persistent cache.");
} catch (e) {
  console.warn("Firestore initializeFirestore failed, falling back to getFirestore:", e);
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
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "TODO_KEYHERE") {
    console.error("CRITICAL: Firebase API Key is missing or invalid. Please check your configuration.");
    return;
  }

  try {
    // Use getDocFromServer to test real connection
    console.log("Testing Firestore connection...");
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test successful (or permission denied, which means we reached the server).");
  } catch (error: any) {
    console.error("Firestore Connection Test Error:", error.code, error.message);
    if (error.message?.includes('offline') || error.code === 'unavailable' || error.code === 'failed-precondition') {
      console.error("CRITICAL: Firestore is unavailable. This is often due to WebSocket blocking in the preview. Long polling is enabled, but the connection is still failing.");
      console.error("Please ensure you have created the Firestore database in your Firebase Console for project:", firebaseConfig.projectId);
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

export { analytics };
export default app;
