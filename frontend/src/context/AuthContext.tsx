import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  login: (email: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || "User";

  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/auth/me",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        const authenticatedUser: User = {
          name: data.name,
          email: data.email,
          avatarUrl: data.avatarUrl,
        };

        setUser(authenticatedUser);
      } catch (error) {
        console.error("Failed to fetch authenticated user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Keeping this temporarily because your email/password
  // login UI still uses it.
  const login = (email: string) => {
    const trimmed = email.trim();
    const name = trimmed ? nameFromEmail(trimmed) : "User";

    setUser({
      name,
      email: trimmed,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=DFF3E4&color=1F7A44&bold=true`,
    });
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:5000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return ctx;
}