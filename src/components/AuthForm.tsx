
"use client";

import React, { useState } from "react";
import { login, signup } from "../api/auth";

interface Props {
  onAuth: (token: string) => void;
}

export default function AuthForm({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");

    try {
      const token =
        mode === "login"
          ? await login(email, password)
          : await signup(email, password);

      localStorage.setItem("authToken", token);
      onAuth(token);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
      <div className="w-full max-w-sm bg-slate-900 p-8 rounded-xl shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-center">
          {mode === "login" ? "Log In" : "Sign Up"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-2 bg-slate-800 rounded border border-slate-700"
            placeholder="Email"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full p-2 bg-slate-800 rounded border border-slate-700"
            placeholder="Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-500 py-2 rounded hover:bg-indigo-600"
          >
            {mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-slate-400">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <button
                className="text-indigo-400"
                onClick={() => setMode("signup")}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="text-indigo-400"
                onClick={() => setMode("login")}
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
