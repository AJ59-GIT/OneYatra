
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
import { getStorage } from "firebase/storage";
// Use dynamic import for the config file to prevent build failures if it's missing (e.g., in CI/CD)
// We use a dynamically constructed path to prevent Vite/Rollup from trying to resolve it statically at build time
const CONFIG_FILE = "firebase-applet-config.json";
const CONFIG_PATH = `../${CONFIG_FILE}`;
const configModule = await import(CONFIG_PATH).catch(() => ({ default: {} }));
const firebaseConfigJson = configModule.default || configModule;

// Use environment variables for configuration, supporting both Vite and Node.js
const getEnv = (key: string) => {
  const envVal = (typeof process !== 'undefined' && process.env && process.env[key]) || 
                 (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]);
  
  return envVal && envVal !== "TODO_KEYHERE" && envVal !== "TODO_PROJECT_ID" && envVal !== "" ? envVal : undefined;
};

// Defensive check for JSON import structure
console.log("firebaseConfigJson type:", typeof firebaseConfigJson, "keys:", Object.keys(firebaseConfigJson || {}));
const rawConfig = (firebaseConfigJson as any).default || firebaseConfigJson;

const firebaseConfig = {
  apiKey: rawConfig.apiKey || getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: rawConfig.authDomain || getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: rawConfig.projectId || getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: rawConfig.storageBucket || getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: rawConfig.messagingSenderId || getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: rawConfig.appId || getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: rawConfig.measurementId || getEnv('VITE_FIREBASE_MEASUREMENT_ID'),
};

const isConfigValid = (config: any) => {
  if (!config) return false;
  const apiKey = config.apiKey;
  const projectId = config.projectId;
  const appId = config.appId;
  
  const valid = apiKey && typeof apiKey === 'string' && apiKey !== "TODO_KEYHERE" && apiKey.trim() !== "" &&
         projectId && typeof projectId === 'string' && projectId !== "TODO_PROJECT_ID" && projectId.trim() !== "" &&
         appId && typeof appId === 'string' && appId !== "TODO_APP_ID" && appId.trim() !== "";
  return !!valid;
};

const firestoreDatabaseId = rawConfig.firestoreDatabaseId || getEnv('VITE_FIREBASE_FIRESTORE_DATABASE_ID') || '(default)';

console.log("Firebase Config Initialization:", {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey,
  apiKeyPrefix: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) : 'none',
  databaseId: firestoreDatabaseId,
  isValid: isConfigValid(firebaseConfig),
  configSource: rawConfig.projectId ? "config-file" : "env-vars"
});

if (typeof window !== 'undefined') {
  (window as any).FIREBASE_DEBUG = {
    config: firebaseConfig,
    isValid: isConfigValid(firebaseConfig),
    json: firebaseConfigJson,
    rawConfig: rawConfig
  };
}

// Initialize Firebase only if config is valid to prevent 400 errors in browser
let app: any;
let db: any;
let auth: any;
let storage: any;
let googleProvider: any;
let emailProvider: any;
let analytics: any = null;

if (isConfigValid(firebaseConfig)) {
  app = initializeApp(firebaseConfig);
  
  // Initialize Firestore with settings for better reliability in iframe/preview environments
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
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported && firebaseConfig.measurementId && firebaseConfig.measurementId !== "TODO_MEASUREMENT_ID") {
        analytics = getAnalytics(app);
      }
    });
  }

  auth = getAuth(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  emailProvider = new EmailAuthProvider();
} else {
  console.warn("Firebase initialization skipped due to invalid or placeholder configuration.");
  // Provide mock/null objects to prevent crashes in components that import them
  app = null;
  db = null;
  auth = null;
  storage = null;
  googleProvider = null;
  emailProvider = null;
}

export { auth, db, storage, googleProvider, emailProvider, analytics };
export default app;

// Validate Connection to Firestore (Critical Constraint)
async function testConnection() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "TODO_KEYHERE") {
    console.error("CRITICAL: Firebase API Key is missing or invalid. Please check your configuration.");
    return;
  }

  try {
    // Use getDocFromServer to test real connection
    console.log("Testing Firestore connection...");
    // We use a document in 'test' collection which we allowed in rules
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test successful.");
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log("Firestore connection test: Permission denied (this is expected if rules are strict, but means we reached the server).");
      return;
    }
    console.error("Firestore Connection Test Error:", error.code, error.message);
    if (error.message?.includes('offline') || error.code === 'unavailable' || error.code === 'failed-precondition') {
      console.error("CRITICAL: Firestore is unavailable. This is often due to WebSocket blocking in the preview. Long polling is enabled, but the connection is still failing.");
      console.error("Please ensure you have created the Firestore database in your Firebase Console for project:", firebaseConfig.projectId);
    }
  }
}

if (typeof window !== 'undefined' && isConfigValid(firebaseConfig)) {
  testConnection();
}
