import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("pa_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("pa_token");
      localStorage.removeItem("pa_user");
      window.dispatchEvent(new Event("pa_logout"));
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string, username: string, referral_code?: string) =>
    api.post("/auth/register", { email, password, username, referral_code }),
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
};

// ─── User ─────────────────────────────────────────────────
export const userApi = {
  me: () => api.get("/users/me"),
  updateProfile: (username: string) => api.patch("/users/me", { username }),
  referrals: () => api.get("/users/referrals"),
};

// ─── Wallet ───────────────────────────────────────────────
export const walletApi = {
  balance: () => api.get("/wallet"),
  deposit: (amount: number) => api.post("/wallet/deposit", { amount }),
  withdraw: (amount: number) => api.post("/wallet/withdraw", { amount }),
  transactions: (page = 1, limit = 20) =>
    api.get(`/wallet/transactions?page=${page}&limit=${limit}`),
};

// ─── Odds / Matches ───────────────────────────────────────
export const oddsApi = {
  live: () => api.get("/odds/live"),
  byMatch: (matchId: string) => api.get(`/odds/${matchId}`),
};

// ─── Bets ─────────────────────────────────────────────────
export const betsApi = {
  place: (match_id: string, odds_id: string, bet_type: "BACK" | "LAY", stake: number) =>
    api.post("/bets/place", { match_id, odds_id, bet_type, stake }),
  history: (page = 1, limit = 20, status?: string) =>
    api.get(`/bets/history?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`),
  single: (betId: string) => api.get(`/bets/${betId}`),
};

// ─── Casino ────────────────────────────────────────────────
export const casinoApi = {
  /** List all games (public) */
  games: (category?: string) =>
    api.get(`/casino/games${category ? `?category=${encodeURIComponent(category)}` : ""}`),

  /** Launch a game session (JWT) → returns { launch_url, session_id } */
  launch: (game_id: string, platform?: string) =>
    api.post("/casino/launch", { game_id, platform: platform || "web" }),

  /** Debit stake before a round (JWT) → returns { round_id, balance } */
  bet: (game_id: string, game_name: string, stake: number) =>
    api.post("/casino/bet", { game_id, game_name, stake }),

  /** Settle round after it ends (JWT) → returns { balance, net } */
  settle: (round_id: string, win_amount: number, stake: number) =>
    api.post("/casino/settle", { round_id, win_amount, stake }),

  /** Paginated casino round history (JWT) */
  history: (page = 1, limit = 20) =>
    api.get(`/casino/history?page=${page}&limit=${limit}`),
};

export default api;
