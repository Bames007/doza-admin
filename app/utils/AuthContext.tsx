// contexts/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSession, signOut as nextSignOut } from "next-auth/react";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";

type AdminProfile = {
  uid: string;
  email: string;
  fullName?: string;
  role: string; // ceo, cto, head_hospitals, etc.
  phone?: string;
  photoURL?: string;
};

interface AuthContextType {
  user: AdminProfile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (uid: string): Promise<AdminProfile | null> => {
    try {
      const profileRef = ref(db, `doza/users/${uid}`);
      const snapshot = await get(profileRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          uid,
          email: session?.user?.email || "",
          fullName: data.fullName || data.fname || session?.user?.name || "",
          role: data.role || "user",
          phone: data.phone || "",
          photoURL: data.photoURL || "",
        };
      }
      // Fallback: if no profile, treat as basic user
      return {
        uid,
        email: session?.user?.email || "",
        fullName: session?.user?.name || "",
        role: "user",
      };
    } catch (err) {
      logger.error(err, "Failed to fetch admin profile");
      return null;
    }
  };

  const updateLocalStorage = (profile: AdminProfile | null) => {
    if (profile) {
      localStorage.setItem("userId", profile.uid);
      localStorage.setItem("userName", profile.fullName || profile.email || "");
      localStorage.setItem("userRole", profile.role);
      localStorage.setItem("userProfile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userProfile");
    }
  };

  const refreshProfile = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setUser(null);
      updateLocalStorage(null);
      return;
    }
    const profile = await fetchProfile(userId);
    setUser(profile);
    updateLocalStorage(profile);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (status === "loading") {
      return;
    }

    if (status === "authenticated" && session?.user?.id) {
      fetchProfile(session.user.id)
        .then((profile) => {
          setUser(profile);
          updateLocalStorage(profile);
        })
        .catch((err) => {
          setError(err.message);
          logger.error(err, "Auth error");
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      updateLocalStorage(null);
      setLoading(false);
    }
  }, [session, status]);

  const signOut = async () => {
    try {
      await nextSignOut({ redirect: false });
      setUser(null);
      updateLocalStorage(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
