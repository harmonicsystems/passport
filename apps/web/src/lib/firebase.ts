import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase client config is safe to expose publicly.
// Access control is handled by Firestore security rules.
const firebaseConfig = {
  apiKey: 'AIzaSyAJQeGRywfhpKVgQ43wCKX556DVZOu5wbA',
  authDomain: 'farmers-market-passport.firebaseapp.com',
  projectId: 'farmers-market-passport',
  storageBucket: 'farmers-market-passport.firebasestorage.app',
  messagingSenderId: '47882786293',
  appId: '1:47882786293:web:5c16a974ed9da880be3cbc',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
