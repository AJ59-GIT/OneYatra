
import { UserDocument } from "../types";
import { db, auth, storage } from "./firebase";
import { 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { handleFirestoreError, OperationType } from "../utils/firestoreErrorHandler";

// --- Firebase Management ---

export const getDocuments = async (): Promise<UserDocument[]> => {
  if (!auth.currentUser) return [];
  
  const path = `users/${auth.currentUser.uid}/documents`;
  try {
    const q = query(
      collection(db, path),
      orderBy("id", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserDocument);
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, path);
    return [];
  }
};

export const saveDocument = async (userDoc: UserDocument): Promise<void> => {
  if (!auth.currentUser) return;
  
  const path = `users/${auth.currentUser.uid}/documents/${userDoc.id}`;
  try {
    const docRef = doc(db, "users", auth.currentUser.uid, "documents", userDoc.id);
    await setDoc(docRef, userDoc);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
};

export const deleteDocument = async (id: string, fileUrl?: string): Promise<void> => {
  if (!auth.currentUser) return;
  
  const path = `users/${auth.currentUser.uid}/documents/${id}`;
  try {
    // Delete metadata
    const docRef = doc(db, "users", auth.currentUser.uid, "documents", id);
    await deleteDoc(docRef);
    
    // Delete file from storage if url is provided
    if (fileUrl) {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef).catch(err => console.warn("File deletion failed:", err));
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, path);
  }
};

export const uploadDocumentFile = async (file: File): Promise<string> => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  const fileId = Math.random().toString(36).substring(2, 15);
  const fileExt = file.name.split('.').pop();
  const filePath = `users/${auth.currentUser.uid}/documents/${fileId}.${fileExt}`;
  const fileRef = ref(storage, filePath);
  
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
};

// --- Mock OCR Engine ---

export interface OCRResult {
  holderName: string;
  number: string;
  expiryDate?: string;
  dob?: string;
  gender?: 'M' | 'F' | 'O';
  confidence: number;
}

export const performOCR = async (file: File): Promise<OCRResult> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Determine doc type from filename usually, here just random mock
  // In a real app, we'd send `file` to Google Cloud Vision API or Tesseract.js
  
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setFullYear(today.getFullYear() + 5);
  const dobDate = new Date(today);
  dobDate.setFullYear(today.getFullYear() - 28);

  return {
    holderName: "Aditya Verma", // Mock extracted name
    number: Math.random().toString(36).substring(2, 10).toUpperCase(),
    expiryDate: futureDate.toISOString().split('T')[0],
    dob: dobDate.toISOString().split('T')[0],
    gender: 'M',
    confidence: 0.95
  };
};

export const checkExpiry = (doc: UserDocument): 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' => {
  if (!doc.expiryDate) return 'VALID';
  
  const expiry = new Date(doc.expiryDate).getTime();
  const now = Date.now();
  const sixMonths = 1000 * 60 * 60 * 24 * 180;

  if (expiry < now) return 'EXPIRED';
  if (expiry - now < sixMonths) return 'EXPIRING_SOON';
  return 'VALID';
};
