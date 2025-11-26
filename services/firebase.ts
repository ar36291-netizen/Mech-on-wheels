import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  DocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { UserProfile, ServiceRequest, RequestStatus } from '../types';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjotjrAYDovlVbAFiBl48N8prf-1fQOo4",
  authDomain: "mech-on-wheels-72f59.firebaseapp.com",
  projectId: "mech-on-wheels-72f59",
  storageBucket: "mech-on-wheels-72f59.firebasestorage.app",
  messagingSenderId: "585736796068",
  appId: "1:585736796068:web:06079b722c76256b7b3331",
  measurementId: "G-KKVGXTKHJB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics safely
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Firebase Analytics failed to initialize:", error);
}

export { analytics };
export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper to timeout promises (prevents hanging on slow/failed DB connections)
const withTimeout = <T>(promise: Promise<T>, ms: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error("Operation timed out")), ms)
    )
  ]);
};

// Helper to remove undefined values which Firestore hates
const cleanData = (data: any) => {
  const cleaned: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      cleaned[key] = data[key];
    }
  });
  return cleaned;
};

// --- Auth Helpers ---

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    // We wrap getDoc in a timeout. If Firestore is offline or permissions fail silent,
    // this ensures we don't hang the UI forever.
    const docRef = doc(db, 'users', uid);
    const docSnap = await withTimeout<DocumentSnapshot<DocumentData>>(getDoc(docRef), 8000);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (e) {
    console.warn("getUserProfile failed or timed out:", e);
    throw e; // Propagate error so App.tsx can handle fallback
  }
};

export const createUserProfile = async (uid: string, data: Omit<UserProfile, 'uid' | 'createdAt'>) => {
  // Create a base object to avoid passing 'undefined' values to Firestore
  const profileData: any = {
    ...data,
    uid,
    createdAt: Date.now(),
  };

  // Only set isAvailable for providers. 
  if (data.role === 'provider') {
    profileData.isAvailable = false;
  }

  const cleanedPayload = cleanData(profileData);

  // We don't block the UI strictly on this, but we try to await it.
  try {
    await withTimeout(setDoc(doc(db, 'users', uid), cleanedPayload), 8000);
  } catch (e) {
    console.error("Failed to create profile in DB:", e);
    // We intentionally don't throw here to allow the auth flow to continue 
    // even if DB write fails (Offline mode will handle it)
  }
};

// --- Service Request Helpers ---

export const createServiceRequest = async (request: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'providerId'>) => {
  const collectionRef = collection(db, 'service_requests');
  
  const payload = cleanData({
    ...request,
    providerId: null,
    status: 'PENDING',
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // Wrap addDoc in timeout so submitting doesn't hang indefinitely if DB is down
  await withTimeout(addDoc(collectionRef, payload), 10000);
};

export const subscribeToCustomerRequests = (customerId: string, callback: (reqs: ServiceRequest[]) => void) => {
  const q = query(
    collection(db, 'service_requests'), 
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const reqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ServiceRequest));
    callback(reqs);
  });
};

export const subscribeToProviderRequests = (providerId: string, callback: (reqs: ServiceRequest[]) => void) => {
  const q = query(collection(db, 'service_requests'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const reqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ServiceRequest));
    const filtered = reqs.filter(r => 
      r.status === 'PENDING' || r.providerId === providerId
    );
    callback(filtered);
  });
};

export const updateRequestStatus = async (requestId: string, status: RequestStatus, providerId?: string) => {
  const docRef = doc(db, 'service_requests', requestId);
  const updateData: any = {
    status,
    updatedAt: Date.now()
  };
  if (providerId !== undefined) {
    updateData.providerId = providerId;
  }
  
  const cleanedPayload = cleanData(updateData);
  await withTimeout(updateDoc(docRef, cleanedPayload), 8000);
};

export const toggleProviderAvailability = async (uid: string, isAvailable: boolean) => {
  const docRef = doc(db, 'users', uid);
  await withTimeout(updateDoc(docRef, { isAvailable }), 5000);
};