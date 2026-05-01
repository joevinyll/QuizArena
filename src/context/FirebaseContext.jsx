import { createContext, useContext, useEffect, useState } from "react";
import { auth, authReady } from "../firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";

const FirebaseContext = createContext(null);

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase must be used within FirebaseProvider");
  }
  return context;
}

export function FirebaseProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};
    let mounted = true;

    authReady
      .catch(() => {
        // Continue with Firebase's default behavior if persistence setup fails.
      })
      .finally(() => {
        if (!mounted) return;
        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        });
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await authReady;
      const credentials = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      setUser(credentials.user);
      return credentials.user;
    } catch (err) {
      setError(err.message || "Unable to sign in.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await authReady;
      const credentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      setUser(credentials.user);
      return credentials.user;
    } catch (err) {
      setError(err.message || "Unable to register.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authReady;
      await signOut(auth);
      setUser(null);
    } catch (err) {
      setError(err.message || "Unable to sign out.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{ user, loading, error, login, register, logout }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}
