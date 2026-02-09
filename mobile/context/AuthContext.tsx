import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, User } from "@/util/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

export const useAuthContext = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ─── restore session on app launch ──────────────────────────── */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);

        if (savedToken) {
          try {
            // Validate token using existing authApi.me()
            const currentUser = await authApi.me(savedToken);
            setToken(savedToken);
            setUser(currentUser);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(currentUser));
          } catch {
            // Token expired or invalid
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
          }
        }
      } catch (e) {
        console.error("Failed to restore session:", e);
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /* ─── login ──────────────────────────────────────────────────── */
  const login = async (phone: string, password: string) => {
    // Use existing authApi.login() which calls /auth/login
    const data = await authApi.login(phone, password);
    const accessToken = data.access_token;

    // Fetch user profile using existing authApi.me()
    const currentUser = await authApi.me(accessToken);

    // Persist token and user
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(currentUser));

    setToken(accessToken);
    setUser(currentUser);
  };

  /* ─── logout ─────────────────────────────────────────────────── */
  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
