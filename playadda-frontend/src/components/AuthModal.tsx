"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

function PasswordInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-white text-sm placeholder-brand-muted focus:outline-none focus:border-brand-accent/70 focus:bg-white/8 transition-all pr-12"
        required
        minLength={8}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors"
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        )}
      </button>
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login, closeModal } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wider">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-white text-sm placeholder-brand-muted focus:outline-none focus:border-brand-accent/70 focus:bg-white/8 transition-all"
          required
        />
      </div>
      <div>
        <label htmlFor="login-password" className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wider">Password</label>
        <PasswordInput id="login-password" value={password} onChange={setPassword} placeholder="Your password" />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-brand-accent hover:bg-brand-green-light text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brand-accent/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        ) : null}
        {loading ? "Signing In..." : "Login"}
      </button>
      <p className="text-center text-sm text-brand-muted">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-brand-lime hover:text-white font-semibold transition-colors">
          Sign Up
        </button>
      </p>
      <button type="button" onClick={closeModal} className="w-full text-center text-xs text-brand-muted hover:text-white transition-colors py-1">
        Cancel
      </button>
    </form>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register, closeModal } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", referral_code: "" });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.username, form.referral_code || undefined);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="reg-username" className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wider">Username</label>
        <input id="reg-username" type="text" value={form.username} onChange={(e) => set("username")(e.target.value)} placeholder="cooluser123" className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-white text-sm placeholder-brand-muted focus:outline-none focus:border-brand-accent/70 transition-all" required minLength={3} />
      </div>
      <div>
        <label htmlFor="reg-email" className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wider">Email</label>
        <input id="reg-email" type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="you@example.com" className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-white text-sm placeholder-brand-muted focus:outline-none focus:border-brand-accent/70 transition-all" required />
      </div>
      <div>
        <label htmlFor="reg-password" className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wider">Password</label>
        <PasswordInput id="reg-password" value={form.password} onChange={set("password")} placeholder="Min 8 characters" />
      </div>
      <div>
        <label htmlFor="reg-ref" className="block text-xs font-semibold text-brand-muted mb-1.5 uppercase tracking-wider">Referral Code <span className="text-gray-600">(optional)</span></label>
        <input id="reg-ref" type="text" value={form.referral_code} onChange={(e) => set("referral_code")(e.target.value)} placeholder="Friend&apos;s referral code" className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-white text-sm placeholder-brand-muted focus:outline-none focus:border-brand-accent/70 transition-all" />
      </div>
      <button type="submit" disabled={loading} className="w-full py-3.5 bg-brand-accent hover:bg-brand-green-light text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brand-accent/20 disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> : null}
        {loading ? "Creating Account..." : "Create Account 🚀"}
      </button>
      <p className="text-center text-sm text-brand-muted">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-brand-lime hover:text-white font-semibold transition-colors">Login</button>
      </p>
      <button type="button" onClick={closeModal} className="w-full text-center text-xs text-brand-muted hover:text-white transition-colors py-1">Cancel</button>
    </form>
  );
}

export default function AuthModal() {
  const { activeModal, openLogin, openRegister, closeModal } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(activeModal || "login");

  if (!activeModal) return null;

  const switchToRegister = () => { setMode("register"); openRegister(); };
  const switchToLogin = () => { setMode("login"); openLogin(); };
  const currentMode = activeModal === "register" ? "register" : mode;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-lime to-brand-accent rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" /></svg>
            </div>
            <span className="text-xl font-bold text-white">Play <span className="text-brand-lime">Adda</span></span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {currentMode === "login" ? "Welcome Back!" : "Join PlayAdda"}
          </h2>
          <p className="text-sm text-brand-muted mt-1">
            {currentMode === "login" ? "Login to your account to continue" : "Create your free account today"}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {currentMode === "login" ? (
            <LoginForm onSwitch={switchToRegister} />
          ) : (
            <RegisterForm onSwitch={switchToLogin} />
          )}
        </div>
      </div>
    </div>
  );
}
