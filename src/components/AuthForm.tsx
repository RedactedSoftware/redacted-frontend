"use client";

import { useState } from "react";
import { login, signup } from "@/api/auth";

type AuthFormProps = {
  onAuth: (token: string) => void;
};

export default function AuthForm({ onAuth }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let token: string;
      if (isLogin) {
        // real backend login
        token = await login(email, password);
      } else {
        // real backend signup
        token = await signup(email, password);
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("authToken", token);
      }

      onAuth(token);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      void handleSubmit();
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_#001021,_#020617_30%,_#000814)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(14,165,233,0.08)_1px,transparent_1px)] bg-[length:3.5rem_3.5rem,3.5rem_3.5rem] animate-[bg-pan_20s_linear_infinite] opacity-25" />

      {/* Color glows */}
      <div className="pointer-events-none absolute -left-40 top-10 w-96 h-96 rounded-full blur-3xl bg-gradient-to-br from-cyan-600/30 to-blue-600/20 mix-blend-screen animate-blob" />
      <div className="pointer-events-none absolute -right-40 bottom-10 w-96 h-96 rounded-full blur-3xl bg-gradient-to-br from-purple-600/20 to-indigo-600/30 mix-blend-screen animate-blob" style={{ animationDelay: '1s' }} />

      {/* center column */}
      <div className="relative w-full max-w-2xl z-20">
        {/* floating card wrapper with layered shadows */}
        <div className="relative group">
          {/* outer floating shadow layers */}
          <div className="absolute -inset-6 rounded-3xl blur-3xl opacity-40 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 transform-gpu transition-all group-hover:scale-105" />
          <div className="absolute -inset-10 rounded-3xl shadow-[0_60px_120px_rgba(2,6,23,0.6)] opacity-70" />

          {/* glass card */}
          <div className="relative rounded-3xl bg-[rgba(10,15,25,0.48)] backdrop-blur-xl border border-white/6 overflow-hidden transform transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105">
            {/* inner neon frame */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl" aria-hidden>
              <div className="absolute inset-0 rounded-3xl border border-cyan-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]" />
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent opacity-40 blur-[24px] mix-blend-screen" />
            </div>

            <div className="relative p-10">
              {/* logo + title */}
              <div className="relative text-center mb-6 z-10">
                <div className="inline-block relative mb-3 transform-gpu transition-transform group-hover:scale-105">
                  <div className="h-24 w-24 mx-auto rounded-xl bg-gradient-to-br from-slate-900/60 to-slate-800/40 border border-white/6 shadow-[0_20px_40px_rgba(6,182,212,0.12),inset_0_2px_6px_rgba(255,255,255,0.02)] flex items-center justify-center overflow-hidden">
                    <img src="/redacted.png" alt="AEGIS" className="h-full w-full object-cover" />
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-[0_12px_36px_rgba(6,182,212,0.18)]">
                  AEGIS TRACKER
                </h1>
                <p className="mt-2 text-sm text-cyan-300/80 font-medium tracking-wide">Advanced Real-Time Telemetry System</p>
              </div>

              {/* Sign toggle */}
              <div className="flex gap-2 mb-6 bg-[rgba(8,12,20,0.45)] rounded-full p-1.5 border border-white/5 shadow-[0_6px_18px_rgba(2,6,23,0.6)]">
                <button type="button" onClick={() => { setIsLogin(true); setError(null); }} className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${isLogin ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-neon' : 'text-slate-400 hover:text-white'}`}>
                  Sign In
                </button>
                <button type="button" onClick={() => { setIsLogin(false); setError(null); }} className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${!isLogin ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-neon' : 'text-slate-400 hover:text-white'}`}>
                  Sign Up
                </button>
              </div>

              {/* error card */}
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-3 text-sm text-red-100 shadow-[0_18px_40px_rgba(127,29,29,0.26)]">
                  {error}
                </div>
              )}

              {/* fields */}
              <div className="space-y-4">
                <div className="rounded-xl bg-[rgba(15,20,30,0.35)] border border-white/6 px-4 py-3 transition-all focus-within:scale-[1.01] hover:scale-[1.01] shadow-[0_8px_30px_rgba(2,6,23,0.6),inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <label className="block text-xs font-semibold text-cyan-300 mb-1.5 tracking-wide">EMAIL ADDRESS</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyPress} className="w-full bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500 focus:ring-0" placeholder="you@example.com" />
                </div>

                <div className="rounded-xl bg-[rgba(15,20,30,0.35)] border border-white/6 px-4 py-3 transition-all focus-within:scale-[1.01] hover:scale-[1.01] shadow-[0_8px_30px_rgba(2,6,23,0.6),inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <label className="block text-xs font-semibold text-cyan-300 mb-1.5 tracking-wide">PASSWORD</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyPress} className="w-full bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500 focus:ring-0" placeholder="Enter your password" />
                </div>

                {!isLogin && (
                  <div className="rounded-xl bg-[rgba(15,20,30,0.35)] border border-white/6 px-4 py-3 transition-all focus-within:scale-[1.01] hover:scale-[1.01] shadow-[0_8px_30px_rgba(2,6,23,0.6),inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <label className="block text-xs font-semibold text-cyan-300 mb-1.5 tracking-wide">CONFIRM PASSWORD</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={handleKeyPress} className="w-full bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500 focus:ring-0" placeholder="Re-enter your password" />
                  </div>
                )}
              </div>

              {/* main CTA button */}
              <div className="mt-6 relative">
                <button type="button" onClick={() => void handleSubmit()} disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white font-bold shadow-[0_30px_80px_rgba(3,105,161,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-transform motion-reduce:transition-none disabled:opacity-50">
                  {loading ? (isLogin ? 'SIGNING IN...' : 'CREATING ACCOUNT...') : (isLogin ? 'SIGN IN' : 'CREATE ACCOUNT')}
                </button>
                {/* neon edge */}
                <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 opacity-30 blur-[8px] mix-blend-screen" />
              </div>

              <div className="mt-4 text-center">
                <button type="button" className="text-xs text-cyan-300/80 hover:text-cyan-200 transition-colors font-medium" onClick={() => alert('Password reset flow not implemented yet.')}>Forgot password?</button>
              </div>
            </div>

            {/* footer text */}
            <div className="mt-6 text-center text-xs text-slate-400 font-medium z-10">🔒 Secured by military-grade encryption (and vibes).</div>
          </div>
        </div>
      </div>
    </div>
  );
}
