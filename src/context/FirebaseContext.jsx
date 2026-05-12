import { createContext, useContext, useEffect, useState } from "react";
import { auth, authReady } from "../firebase.js";
import {
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  updateProfile,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

const FirebaseContext = createContext(null);

function getAuthErrorMessage(err, fallbackMessage) {
  switch (err?.code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Invalid credentials.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Google sign-in.";
    default:
      return err?.message || fallbackMessage;
  }
}

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
  const googleProvider = new GoogleAuthProvider();

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
      let nextErrorMessage = getAuthErrorMessage(err, "Unable to sign in.");

      if (
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/invalid-login-credentials"
      ) {
        try {
          const signInMethods = await fetchSignInMethodsForEmail(auth, email);

          if (!signInMethods.length) {
            nextErrorMessage =
              "No account was found for this email. Please create an account first.";
          } else if (
            signInMethods.includes("google.com") &&
            !signInMethods.includes("password")
          ) {
            nextErrorMessage =
              "This email is registered through Google. Please sign in with Google.";
          } else {
            nextErrorMessage = "Incorrect password or invalid credentials.";
          }
        } catch {
          nextErrorMessage = "Incorrect password or invalid credentials.";
        }
      }

      setError(nextErrorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, profile = {}) => {
    setLoading(true);
    setError(null);
    try {
      await authReady;
      const credentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (profile.displayName?.trim()) {
        await updateProfile(credentials.user, {
          displayName: profile.displayName.trim(),
        });
      }
      setUser(credentials.user);
      return credentials.user;
    } catch (err) {
      setError(getAuthErrorMessage(err, "Unable to register."));
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
      setError(getAuthErrorMessage(err, "Unable to sign out."));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await authReady;
      googleProvider.setCustomParameters({ prompt: "select_account" });
      const credentials = await signInWithPopup(auth, googleProvider);
      setUser(credentials.user);
      return credentials.user;
    } catch (err) {
      setError(getAuthErrorMessage(err, "Unable to sign in with Google."));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      await authReady;
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(
        getAuthErrorMessage(err, "Unable to send password reset email."),
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTeacherProfile = async (profile = {}) => {
    if (!auth.currentUser) {
      throw new Error("Please sign in before updating your profile.");
    }

    setLoading(true);
    setError(null);
    try {
      await authReady;
      await updateProfile(auth.currentUser, {
        displayName: profile.displayName?.trim() || "",
      });
      setUser({ ...auth.currentUser });
      return auth.currentUser;
    } catch (err) {
      setError(getAuthErrorMessage(err, "Unable to update profile."));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        updateTeacherProfile,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}
