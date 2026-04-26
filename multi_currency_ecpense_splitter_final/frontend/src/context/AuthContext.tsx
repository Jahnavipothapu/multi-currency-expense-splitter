import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import api from "../services/api";

type User = { id: string; name: string; email: string; avatarUrl?: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setLocalUser: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const savedUser = localStorage.getItem("user");
const savedToken = localStorage.getItem("token");

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(savedUser ? JSON.parse(savedUser) : null);
  const [token, setToken] = useState<string | null>(savedToken);

  const persistAuth = (nextToken: string, nextUser: User) => {
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    persistAuth(response.data.token, response.data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post("/auth/register", { name, email, password });
    persistAuth(response.data.token, response.data.user);
  };

  const refreshProfile = async () => {
    const response = await api.get("/auth/me");
    const nextUser = { id: response.data._id, name: response.data.name, email: response.data.email, avatarUrl: response.data.avatarUrl };
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const setLocalUser = (nextUser: User) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, login, register, refreshProfile, setLocalUser, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
