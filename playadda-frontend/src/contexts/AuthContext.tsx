"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi, walletApi } from "@/lib/api";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  referral_code: string;
}

interface Wallet {
  balance: number;
  locked_balance: number;
  available_balance: number;
}

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, referral_code?: string) => Promise<void>;
  logout: () => void;
  refreshWallet: () => Promise<void>;
  openLogin: () => void;
  openRegister: () => void;
  closeModal: () => void;
  activeModal: "login" | "register" | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(null);

  const refreshWallet = useCallback(async () => {
    try {
      const res = await walletApi.balance();
      setWallet(res.data?.data || res.data);
    } catch {
      // wallet not loaded
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("pa_token");
    localStorage.removeItem("pa_user");
    setUser(null);
    setWallet(null);
    setToken(null);
    toast.success("Logged out");
  }, []);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("pa_token");
    const savedUser = localStorage.getItem("pa_user");
    if (savedToken && savedUser) {
      try {
        const u = JSON.parse(savedUser) as User;
        setToken(savedToken);
        setUser(u);
        refreshWallet();
      } catch {
        localStorage.removeItem("pa_token");
        localStorage.removeItem("pa_user");
      }
    }
    setIsLoading(false);
  }, [refreshWallet]);

  // Listen for 401 auto-logout
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("pa_logout", handler);
    return () => window.removeEventListener("pa_logout", handler);
  }, [logout]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { access_token, user: u } = res.data?.data || res.data;
    localStorage.setItem("pa_token", access_token);
    localStorage.setItem("pa_user", JSON.stringify(u));
    setToken(access_token);
    setUser(u);
    await refreshWallet();
    setActiveModal(null);
    toast.success(`Welcome back, ${u.username}! 🎉`);
  };

  const register = async (
    email: string,
    password: string,
    username: string,
    referral_code?: string
  ) => {
    const res = await authApi.register(email, password, username, referral_code);
    const { access_token, user: u } = res.data?.data || res.data;
    localStorage.setItem("pa_token", access_token);
    localStorage.setItem("pa_user", JSON.stringify(u));
    setToken(access_token);
    setUser(u);
    await refreshWallet();
    setActiveModal(null);
    toast.success(`Welcome to PlayAdda, ${u.username}! 🚀`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        token,
        isLoggedIn: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshWallet,
        openLogin: () => setActiveModal("login"),
        openRegister: () => setActiveModal("register"),
        closeModal: () => setActiveModal(null),
        activeModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
