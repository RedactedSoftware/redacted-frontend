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
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setSuccess(false);

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
      setSuccess(true);
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
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated radar circles */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="absolute w-[300px] h-[300px] border border-cyan-500/20 rounded-full animate-ping"
          style={{ animationDuration: "3s" }}
        />
        <div
          className="absolute w-[500px] h-[500px] border border-cyan-500/10 rounded-full animate-ping"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute w-[700px] h-[700px] border border-blue-500/10 rounded-full animate-ping"
          style={{ animationDuration: "5s" }}
        />
      </div>

      {/* Scanning line effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-32 animate-scan" />
      </div>

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0891b2_1px,transparent_1px),linear-gradient(to_bottom,#0891b2_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-10" />

      <div className="relative z-10 w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="text-center md:text-left space-y-6 px-4">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 shadow-[0_0_50px_rgba(6,182,212,0.6)] relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 animate-pulse opacity-50" />
            <img src="/aegis-tracker.png" alt="AEGIS Tracker Logo" className="w-16 h-16 relative z-10 object-contain" />
          </div>

          <div>
            <h1 className="text-6xl md:text-7xl font-black text-white mb-4 tracking-tight">
              AEGIS
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                TRACKER
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md">
              Advanced real-time telemetry system for precision monitoring and data acquisition.
            </p>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-sm">
              <span className="text-xs font-semibold text-cyan-400">REAL-TIME DATA</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 backdrop-blur-sm">
              <span className="text-xs font-semibold text-blue-400">SECURE</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 backdrop-blur-sm">
              <span className="text-xs font-semibold text-green-400">LIVE SYNC</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">99.9%</div>
              <div className="text-xs text-slate-500 mt-1">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">24/7</div>
              <div className="text-xs text-slate-500 mt-1">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">1ms</div>
              <div className="text-xs text-slate-500 mt-1">Latency</div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="relative">
          {/* Glow effect behind card */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl" />

          <div className="relative bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.9)]">
            {/* Animated border */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="absolute inset-[-2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 opacity-20 animate-gradient-x" />
            </div>

            <div className="relative">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isLogin ? "System Access" : "Create Account"}
                </h2>
                <p className="text-sm text-slate-400">
                  {isLogin ? "Enter your credentials to continue" : "Register for AEGIS access"}
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 text-xl">⚠</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-red-300 mb-1">Authentication Error</div>
                      <div className="text-xs text-red-400/80">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Alert */}
              {success && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/50 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">✓</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-green-300 mb-1">Access Granted</div>
                      <div className="text-xs text-green-400/80">Redirecting to dashboard...</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                      placeholder="operator@aegis.sys"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                      placeholder="••••••••••••"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                        placeholder="••••••••••••"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                      onClick={() => alert("Password reset flow not implemented yet.")}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={loading}
                className="mt-8 w-full py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>{isLogin ? "AUTHENTICATING..." : "CREATING ACCOUNT..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{isLogin ? "ACCESS SYSTEM" : "CREATE ACCOUNT"}</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </span>
              </button>

              {/* Toggle Auth Mode */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccess(false);
                  }}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {isLogin ? (
                    <>
                      Don't have access? <span className="text-cyan-400 font-semibold">Create Account</span>
                    </>
                  ) : (
                    <>
                      Already registered? <span className="text-cyan-400 font-semibold">Sign In</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security Badge */}
              <div className="mt-8 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Secured with 256-bit encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes gradient-x {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
