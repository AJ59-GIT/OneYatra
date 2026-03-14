
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDv047-WxK0swTrn_o2NngEemYL6xiDanE",
  authDomain: "one-yatra-app.firebaseapp.com",
  projectId: "one-yatra-app",
  storageBucket: "one-yatra-app.firebasestorage.app",
  messagingSenderId: "523318254835",
  appId: "1:523318254835:web:4c1391f3cfb5bc9b772b86",
  measurementId: "G-NVWX892HTY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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
export const googleProvider = new GoogleAuthProvider();
export const emailProvider = new EmailAuthProvider();

export { analytics };
export default app;
