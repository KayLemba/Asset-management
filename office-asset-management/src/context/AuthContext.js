import { createContext, useContext, useEffect, useState } from "react";
import {
  getSession,
  getUserById,
  signInLocal,
  signUpLocal,
  signOutLocal,
} from "../lib/localAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session?.userId) {
      const found = getUserById(session.userId);
      if (found) setUser(found);
    }
    setLoading(false);
  }, []);

  const signIn = (email, password) => {
    const result = signInLocal(email, password);
    if (!result.error) setUser(result.user);
    return { error: result.error };
  };

  const signUp = (email, password, fullName) => {
    const result = signUpLocal(email, password, fullName);
    if (!result.error) setUser(result.user);
    return { error: result.error };
  };

  const signOut = () => {
    signOutLocal();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
