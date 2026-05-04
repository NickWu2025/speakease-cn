import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile } from "@/types/profile";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isGuest: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithGoogle: (info: { id: string; name: string; email: string; avatarUrl?: string }) => void;
  continueAsGuest: (name: string) => void;
  saveProfile: (profile: UserProfile) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "speakflow_user";
const profileKey = (uid: string) => `speakflow_profile_${uid}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const u = JSON.parse(raw) as AuthUser;
      setUser(u);
      const rawProfile = localStorage.getItem(profileKey(u.id));
      if (rawProfile) setProfile(JSON.parse(rawProfile) as UserProfile);
    }
    setIsLoading(false);
  }, []);

  const signInWithGoogle = (info: { id: string; name: string; email: string; avatarUrl?: string }) => {
    const u: AuthUser = { ...info, isGuest: false };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    const rawProfile = localStorage.getItem(profileKey(u.id));
    if (rawProfile) setProfile(JSON.parse(rawProfile) as UserProfile);
    else setProfile(null);
  };

  const continueAsGuest = (name: string) => {
    const u: AuthUser = {
      id: `guest_${Date.now()}`,
      name: name.trim() || "Learner",
      email: "",
      isGuest: true,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    setProfile(null);
  };

  const saveProfile = (p: UserProfile) => {
    if (!user) return;
    localStorage.setItem(profileKey(user.id), JSON.stringify(p));
    setProfile(p);
  };

  const signOut = () => {
    if (user) localStorage.removeItem(profileKey(user.id));
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signInWithGoogle, continueAsGuest, saveProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
