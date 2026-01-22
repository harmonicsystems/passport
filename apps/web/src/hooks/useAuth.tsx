import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import type { UserRole } from '@market-passport/shared';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('visitor');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const email = firebaseUser.email?.toLowerCase() || '';

        try {
          // Check admin
          const adminDoc = await getDoc(doc(db, 'admins', email));
          if (adminDoc.exists()) {
            setRole('admin');
          } else {
            // Check staff
            const staffDoc = await getDoc(doc(db, 'staff', email));
            if (staffDoc.exists()) {
              setRole('staff');
            } else {
              setRole('visitor');
            }
          }
        } catch (err) {
          console.warn('Could not check role, defaulting to visitor:', err);
          setRole('visitor');
        }

        // Ensure user document exists
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              createdAt: Date.now(),
            });
          }
        } catch (err) {
          console.warn('Could not create/check user doc:', err);
        }
      } else {
        setRole('visitor');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setRole('visitor');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
